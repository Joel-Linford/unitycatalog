# syntax=docker.io/docker/dockerfile:1.7-labs
ARG HOME="/home/unitycatalog"
ARG ALPINE_VERSION="3.20"

# Build stage, using Amazon Corretto jdk 17 on alpine with arm64 support
FROM amazoncorretto:17-alpine${ALPINE_VERSION}-jdk as base

# Dependencies are installed in $HOME/.cache by sbt
ARG HOME
ENV HOME=$HOME

WORKDIR $HOME

COPY --parents dev/ build/ project/ examples/ server/ api/ clients/python/ version.sbt build.sbt ./

# Strip CRLF so scripts run on Linux (Windows checkouts can leave \r in shebang)
RUN apk add --no-cache bash curl && \
    for f in ./build/sbt ./build/sbt-launch-lib.bash ./project/build.properties; do sed -i 's/\r$//' "$f"; done

# Pre-download sbt launcher (Maven Central returns 400 for default wget/curl User-Agent)
RUN SBT_VERSION=$(grep 'sbt\.version' project/build.properties | sed 's/.*= *//' | tr -d '\r') && \
    curl -fLsS -o ./build/sbt-launch-${SBT_VERSION}.jar \
      -H "User-Agent: UnityCatalog-Docker/1.0" \
      "https://repo1.maven.org/maven2/org/scala-sbt/sbt-launch/${SBT_VERSION}/sbt-launch-${SBT_VERSION}.jar"

# Build server only (skip pythonClient to avoid Python/version script in Docker)
RUN ./build/sbt -info "server/clean" "server/package"

# Small runtime image
FROM alpine:${ALPINE_VERSION} as runtime

# Specific JAVA_HOME from Amazon Corretto
ARG JAVA_HOME="/usr/lib/jvm/default-jvm"
ARG USER="unitycatalog"
ARG HOME

# Copy Java from base
COPY --from=base $JAVA_HOME $JAVA_HOME

ENV HOME=$HOME \
    JAVA_HOME=$JAVA_HOME \
    PATH="${JAVA_HOME}/bin:${PATH}"

# Copy build artifacts from base stage
COPY --from=base --parents \
    $HOME/examples/ \
    $HOME/server/ \
    $HOME/api/ \
    $HOME/target/ \
    $HOME/.cache/ \
    /

# Create a service user with read and execute permissions and write permissions of the ./etc directory
RUN apk add --no-cache bash wget && \
    addgroup -S $USER && \
    adduser -S -G $USER $USER && \
    chmod -R 550 $HOME && \
    mkdir -p $HOME/etc/ && \
    chmod -R 770 $HOME/etc/ && \
    chown -R $USER:$USER $HOME

USER $USER

# Copy remaining directories here for caching optimization
COPY --chown=$USER:$USER --parents bin/ etc/ $HOME/

# Strip CRLF from launcher script (Windows checkouts)
RUN sed -i 's/\r$//' $HOME/bin/start-uc-server 2>/dev/null || true

WORKDIR $HOME

EXPOSE 8080
CMD ["./bin/start-uc-server", "-p", "8080"]
