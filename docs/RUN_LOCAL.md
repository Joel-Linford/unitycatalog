# Run the application locally (with ontology editor)

## 1. Build the server

From the repo root (use the `.bat` launcher on Windows so sbt runs without "Select an application"):

```bash
# Windows (PowerShell or CMD)
.\build\sbt.bat "server/compile" "server/packageBin"

# Linux / macOS / WSL / Git Bash
./build/sbt "server/compile" "server/packageBin"
```

## 2. Start the backend

The API runs on port **8081**; a transcoder on **8080** forwards to it. The UI is configured to proxy to `http://localhost:8080`.

**Option A – Run via sbt (keeps server in foreground):**

```bash
.\build\sbt.bat "server/run -p 8080"
```

Leave this terminal open. In another terminal, do step 3.

**Option B – Run with Java (Windows):**  
If the classpath is too long, use the args file (from repo root after building):

```powershell
# Recreate the args file (classpath + main class)
$cp = Get-Content -Path "server\target\classpath" -Raw
"-cp`n$cp`nio.unitycatalog.server.UnityCatalogServer`n-p`n8080" | Set-Content -Path "server\target\run-args.txt" -NoNewline
java @server\target\run-args.txt
```

## 3. Build and run the UI

In a **new terminal**:

```bash
cd ui
npm install
npm start
```

(If `yarn.lock` is valid, you can use `yarn install` and `yarn start` instead.)

Then open **http://localhost:3000** in your browser. The dev server proxies API calls to the backend.

To see the **ontology editor**: go to a catalog → schema → **Ontologies** tab, then open or create an ontology.

## Sample education ontology (optional)

To see a **pre-populated ontology** (Student–School–Class–Degree with relationships attend, take, in) in the app, use either method below.

### Method 1: Seed via API (recommended – server must be running)

With the **server already running**, from the repo root run:

```powershell
.\scripts\seed-education-ontology.ps1
```

This creates `education_sample` in the same DB the server is using. Then in the app: **Catalogs** → **unity** → **default** → **Ontologies** → **education_sample**. If catalog `unity` or schema `default` don't exist yet, create them in the UI first (or use Method 2).

### Method 2: Populate test DB (server must be stopped)

1. **Stop the server** if it is running (so the DB file is not locked).

2. **From the repo root**, run the populator (this uses the same DB file as the server, `etc/db/h2db`, and creates catalog `unity`, schema `default`, and ontology `education_sample`):

   ```bash
   .\build\sbt.bat "server/populateTestDB"
   ```

   You should see `Created sample ontology: unity.default.education_sample` in the output.

3. **Start the server again**, then refresh the app. Go to **Catalogs** → **unity** → **default** → **Ontologies** tab. You should see **education_sample**; click it to open the graph and node/relationship tables.

If you still don’t see the ontology, use **Method 1** (seed script) with the server running instead.

## Ports

| Service        | Port | Notes                    |
|----------------|------|--------------------------|
| UI dev server  | 3000 | Open this in the browser |
| Backend proxy  | 8080 | UI proxy target          |
| Backend API    | 8081 | Used by transcoder      |

## Run with Docker (server + UI)

From the repo root:

```bash
docker compose up --build
```

(Uses `compose.yaml` at the repo root.)

- **Server** listens on port **8080** (API at `http://localhost:8080/api/2.1/unity-catalog/...`).
- **UI** runs on port **3000** and proxies API requests to the server. Open **http://localhost:3000** in the browser.

The first build can take several minutes (sbt compile, yarn install). Server data (H2 DB and config) is stored in a Docker volume `uc-etc` so it persists between runs. The UI waits for the server to be healthy before starting.

**Useful commands:**

| Command | Description |
|---------|--------------|
| `docker compose up --build` | Build (if needed) and start server + UI in foreground |
| `docker compose up -d --build` | Same, but run in background |
| `docker compose down` | Stop and remove containers |
| `docker compose up --build ui` | Build/start only the UI (server must already be running) |

**If the server is reported unhealthy:** the healthcheck is a TCP check on port 8080. Ensure nothing else is using port 8080 and that the server container has enough time to start (60s start period). View logs with `docker compose logs server`.

To seed the sample ontology with the server running in Docker, run the seed script on the host (it will hit `localhost:8080`):

```powershell
.\scripts\seed-education-ontology.ps1
```
