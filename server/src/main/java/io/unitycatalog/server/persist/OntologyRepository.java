package io.unitycatalog.server.persist;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.unitycatalog.server.exception.BaseException;
import io.unitycatalog.server.exception.ErrorCode;
import io.unitycatalog.server.model.CreateOntology;
import io.unitycatalog.server.model.ListOntologiesResponse;
import io.unitycatalog.server.model.OntologyInfo;
import io.unitycatalog.server.model.OntologyNodeClass;
import io.unitycatalog.server.model.OntologyRelationshipType;
import io.unitycatalog.server.model.UpdateOntology;
import io.unitycatalog.server.persist.dao.OntologyInfoDAO;
import io.unitycatalog.server.persist.dao.SchemaInfoDAO;
import io.unitycatalog.server.persist.utils.PagedListingHelper;
import io.unitycatalog.server.persist.utils.RepositoryUtils;
import io.unitycatalog.server.persist.utils.TransactionManager;
import io.unitycatalog.server.utils.IdentityUtils;
import io.unitycatalog.server.utils.ValidationUtils;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.query.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OntologyRepository {
  private static final Logger LOGGER = LoggerFactory.getLogger(OntologyRepository.class);
  private static final TypeReference<List<OntologyNodeClass>> NODE_CLASSES_TYPE =
      new TypeReference<List<OntologyNodeClass>>() {};
  private static final TypeReference<List<OntologyRelationshipType>> RELATIONSHIP_TYPES_TYPE =
      new TypeReference<List<OntologyRelationshipType>>() {};

  private final Repositories repositories;
  private final SessionFactory sessionFactory;
  private final ObjectMapper objectMapper = new ObjectMapper();
  private static final PagedListingHelper<OntologyInfoDAO> LISTING_HELPER =
      new PagedListingHelper<>(OntologyInfoDAO.class);

  public OntologyRepository(Repositories repositories, SessionFactory sessionFactory) {
    this.repositories = repositories;
    this.sessionFactory = sessionFactory;
  }

  public OntologyInfo createOntology(CreateOntology createOntology) {
    ValidationUtils.validateSqlObjectName(createOntology.getName());
    String callerId = IdentityUtils.findPrincipalEmailAddress();
    return TransactionManager.executeWithTransaction(
        sessionFactory,
        session -> {
          RepositoryUtils.CatalogAndSchemaDao catalogAndSchemaDao =
              RepositoryUtils.getCatalogAndSchemaDaoOrThrow(
                  session, createOntology.getCatalogName(), createOntology.getSchemaName());
          UUID schemaId = catalogAndSchemaDao.schemaInfoDAO().getId();
          if (getOntologyDAO(session, schemaId, createOntology.getName()) != null) {
            throw new BaseException(
                ErrorCode.ALREADY_EXISTS, "Ontology already exists: " + createOntology.getName());
          }

          UUID ontologyId = UUID.randomUUID();
          Date now = new Date();

          String nodeClassesJson = toJson(createOntology.getNodeClasses());
          String relationshipTypesJson = toJson(createOntology.getRelationshipTypes());

          OntologyInfoDAO dao =
              OntologyInfoDAO.builder()
                  .id(ontologyId)
                  .name(createOntology.getName())
                  .schemaId(schemaId)
                  .comment(createOntology.getComment())
                  .nodeClassesJson(nodeClassesJson)
                  .relationshipTypesJson(relationshipTypesJson)
                  .owner(callerId)
                  .createdAt(now)
                  .createdBy(callerId)
                  .updatedAt(now)
                  .updatedBy(callerId)
                  .build();
          session.persist(dao);
          LOGGER.info("Added ontology: {}", dao.getName());
          return dao.toOntologyInfo(
              createOntology.getCatalogName(),
              createOntology.getSchemaName(),
              createOntology.getNodeClasses(),
              createOntology.getRelationshipTypes());
        },
        "Failed to create ontology",
        false);
  }

  public OntologyInfo getOntology(String fullName) {
    return TransactionManager.executeWithTransaction(
        sessionFactory,
        session -> {
          String[] namespace = fullName.split("\\.");
          if (namespace.length != 3) {
            throw new BaseException(
                ErrorCode.INVALID_ARGUMENT, "Invalid ontology name: " + fullName);
          }
          String catalogName = namespace[0];
          String schemaName = namespace[1];
          String ontologyName = namespace[2];
          OntologyInfoDAO dao = getOntologyDAO(session, catalogName, schemaName, ontologyName);
          if (dao == null) {
            throw new BaseException(ErrorCode.NOT_FOUND, "Ontology not found: " + fullName);
          }
          List<OntologyNodeClass> nodeClasses =
              fromJson(dao.getNodeClassesJson(), NODE_CLASSES_TYPE);
          List<OntologyRelationshipType> relationshipTypes =
              fromJson(dao.getRelationshipTypesJson(), RELATIONSHIP_TYPES_TYPE);
          return dao.toOntologyInfo(catalogName, schemaName, nodeClasses, relationshipTypes);
        },
        "Failed to get ontology",
        true);
  }

  public OntologyInfoDAO getOntologyDAO(
      Session session, String catalogName, String schemaName, String ontologyName) {
    UUID schemaId =
        repositories.getSchemaRepository().getSchemaIdOrThrow(session, catalogName, schemaName);
    return getOntologyDAO(session, schemaId, ontologyName);
  }

  public OntologyInfoDAO getOntologyDAO(Session session, UUID schemaId, String ontologyName) {
    Query<OntologyInfoDAO> query =
        session.createQuery(
            "FROM OntologyInfoDAO WHERE name = :name AND schemaId = :schemaId",
            OntologyInfoDAO.class);
    query.setParameter("name", ontologyName);
    query.setParameter("schemaId", schemaId);
    query.setMaxResults(1);
    return query.uniqueResult();
  }

  public ListOntologiesResponse listOntologies(
      String catalogName,
      String schemaName,
      Optional<Integer> maxResults,
      Optional<String> pageToken) {
    return TransactionManager.executeWithTransaction(
        sessionFactory,
        session -> {
          UUID schemaId =
              repositories
                  .getSchemaRepository()
                  .getSchemaIdOrThrow(session, catalogName, schemaName);
          List<OntologyInfoDAO> daos =
              LISTING_HELPER.listEntity(session, maxResults, pageToken, schemaId);
          String nextPageToken = LISTING_HELPER.getNextPageToken(daos, maxResults);
          List<OntologyInfo> result = new ArrayList<>();
          for (OntologyInfoDAO dao : daos) {
            List<OntologyNodeClass> nodeClasses =
                fromJson(dao.getNodeClassesJson(), NODE_CLASSES_TYPE);
            List<OntologyRelationshipType> relationshipTypes =
                fromJson(dao.getRelationshipTypesJson(), RELATIONSHIP_TYPES_TYPE);
            result.add(dao.toOntologyInfo(catalogName, schemaName, nodeClasses, relationshipTypes));
          }
          return new ListOntologiesResponse().ontologies(result).nextPageToken(nextPageToken);
        },
        "Failed to list ontologies",
        true);
  }

  public OntologyInfo updateOntology(String fullName, UpdateOntology updateOntology) {
    String callerId = IdentityUtils.findPrincipalEmailAddress();
    String[] namespace = fullName.split("\\.");
    if (namespace.length != 3) {
      throw new BaseException(ErrorCode.INVALID_ARGUMENT, "Invalid ontology name: " + fullName);
    }
    String catalogName = namespace[0];
    String schemaName = namespace[1];
    String ontologyName = namespace[2];

    return TransactionManager.executeWithTransaction(
        sessionFactory,
        session -> {
          OntologyInfoDAO dao = getOntologyDAO(session, catalogName, schemaName, ontologyName);
          if (dao == null) {
            throw new BaseException(ErrorCode.NOT_FOUND, "Ontology not found: " + fullName);
          }
          if (updateOntology.getComment() != null) {
            dao.setComment(updateOntology.getComment());
          }
          if (updateOntology.getNodeClasses() != null) {
            dao.setNodeClassesJson(toJson(updateOntology.getNodeClasses()));
          }
          if (updateOntology.getRelationshipTypes() != null) {
            dao.setRelationshipTypesJson(toJson(updateOntology.getRelationshipTypes()));
          }
          dao.setUpdatedAt(new Date());
          dao.setUpdatedBy(callerId);
          session.merge(dao);
          LOGGER.info("Updated ontology: {}", dao.getName());
          List<OntologyNodeClass> nodeClasses =
              updateOntology.getNodeClasses() != null
                  ? updateOntology.getNodeClasses()
                  : fromJson(dao.getNodeClassesJson(), NODE_CLASSES_TYPE);
          List<OntologyRelationshipType> relationshipTypes =
              updateOntology.getRelationshipTypes() != null
                  ? updateOntology.getRelationshipTypes()
                  : fromJson(dao.getRelationshipTypesJson(), RELATIONSHIP_TYPES_TYPE);
          return dao.toOntologyInfo(catalogName, schemaName, nodeClasses, relationshipTypes);
        },
        "Failed to update ontology",
        false);
  }

  public void deleteOntology(String fullName) {
    TransactionManager.executeWithTransaction(
        sessionFactory,
        session -> {
          String[] namespace = fullName.split("\\.");
          if (namespace.length != 3) {
            throw new BaseException(
                ErrorCode.INVALID_ARGUMENT, "Invalid ontology name: " + fullName);
          }
          String catalogName = namespace[0];
          String schemaName = namespace[1];
          String ontologyName = namespace[2];
          SchemaInfoDAO schemaInfo =
              repositories
                  .getSchemaRepository()
                  .getSchemaDaoOrThrow(session, catalogName, schemaName);
          OntologyInfoDAO dao = getOntologyDAO(session, schemaInfo.getId(), ontologyName);
          if (dao == null) {
            throw new BaseException(ErrorCode.NOT_FOUND, "Ontology not found: " + fullName);
          }
          session.remove(dao);
          LOGGER.info("Deleted ontology: {}", dao.getName());
          return null;
        },
        "Failed to delete ontology",
        false);
  }

  private String toJson(Object value) {
    if (value == null) {
      return "[]";
    }
    try {
      return objectMapper.writeValueAsString(value);
    } catch (Exception e) {
      throw new BaseException(
          ErrorCode.INTERNAL, "Failed to serialize ontology data: " + e.getMessage());
    }
  }

  @SuppressWarnings("unchecked")
  private <T> T fromJson(String json, TypeReference<T> typeRef) {
    if (json == null || json.isEmpty()) {
      return (T) Collections.emptyList();
    }
    try {
      return objectMapper.readValue(json, typeRef);
    } catch (Exception e) {
      throw new BaseException(
          ErrorCode.INTERNAL, "Failed to deserialize ontology data: " + e.getMessage());
    }
  }
}
