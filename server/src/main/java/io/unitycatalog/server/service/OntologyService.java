package io.unitycatalog.server.service;

import com.linecorp.armeria.common.HttpResponse;
import com.linecorp.armeria.common.HttpStatus;
import com.linecorp.armeria.server.annotation.Delete;
import com.linecorp.armeria.server.annotation.ExceptionHandler;
import com.linecorp.armeria.server.annotation.Get;
import com.linecorp.armeria.server.annotation.Param;
import com.linecorp.armeria.server.annotation.Patch;
import com.linecorp.armeria.server.annotation.Post;
import io.unitycatalog.server.auth.UnityCatalogAuthorizer;
import io.unitycatalog.server.exception.GlobalExceptionHandler;
import io.unitycatalog.server.model.CreateOntology;
import io.unitycatalog.server.model.ListOntologiesResponse;
import io.unitycatalog.server.model.OntologyInfo;
import io.unitycatalog.server.model.UpdateOntology;
import io.unitycatalog.server.persist.OntologyRepository;
import io.unitycatalog.server.persist.Repositories;
import java.util.Optional;
import lombok.SneakyThrows;

@ExceptionHandler(GlobalExceptionHandler.class)
public class OntologyService extends AuthorizedService {
  private final OntologyRepository ontologyRepository;

  @SneakyThrows
  public OntologyService(UnityCatalogAuthorizer authorizer, Repositories repositories) {
    super(authorizer, repositories);
    this.ontologyRepository = repositories.getOntologyRepository();
  }

  @Post("")
  public HttpResponse createOntology(CreateOntology createOntology) {
    OntologyInfo ontology = ontologyRepository.createOntology(createOntology);
    return HttpResponse.ofJson(ontology);
  }

  @Get("")
  public HttpResponse listOntologies(
      @Param("catalog_name") String catalogName,
      @Param("schema_name") String schemaName,
      @Param("max_results") Optional<Integer> maxResults,
      @Param("page_token") Optional<String> pageToken) {
    ListOntologiesResponse response =
        ontologyRepository.listOntologies(catalogName, schemaName, maxResults, pageToken);
    return HttpResponse.ofJson(response);
  }

  @Get("/{full_name}")
  public HttpResponse getOntology(@Param("full_name") String fullName) {
    OntologyInfo ontology = ontologyRepository.getOntology(fullName);
    return HttpResponse.ofJson(ontology);
  }

  @Patch("/{full_name}")
  public HttpResponse updateOntology(
      @Param("full_name") String fullName, UpdateOntology updateOntology) {
    OntologyInfo ontology = ontologyRepository.updateOntology(fullName, updateOntology);
    return HttpResponse.ofJson(ontology);
  }

  @Delete("/{full_name}")
  public HttpResponse deleteOntology(@Param("full_name") String fullName) {
    ontologyRepository.deleteOntology(fullName);
    return HttpResponse.of(HttpStatus.OK);
  }
}
