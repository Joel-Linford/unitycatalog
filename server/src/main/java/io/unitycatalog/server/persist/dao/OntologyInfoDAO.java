package io.unitycatalog.server.persist.dao;

import io.unitycatalog.server.model.OntologyInfo;
import io.unitycatalog.server.model.OntologyNodeClass;
import io.unitycatalog.server.model.OntologyRelationshipType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "uc_ontologies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class OntologyInfoDAO extends IdentifiableDAO {
  @Column(name = "schema_id")
  private UUID schemaId;

  @Column(name = "comment", length = 4096)
  private String comment;

  @Column(name = "node_classes", columnDefinition = "CLOB")
  private String nodeClassesJson;

  @Column(name = "relationship_types", columnDefinition = "CLOB")
  private String relationshipTypesJson;

  @Column(name = "owner")
  private String owner;

  @Column(name = "created_at")
  private Date createdAt;

  @Column(name = "created_by")
  private String createdBy;

  @Column(name = "updated_at")
  private Date updatedAt;

  @Column(name = "updated_by")
  private String updatedBy;

  public OntologyInfo toOntologyInfo(
      String catalogName,
      String schemaName,
      List<OntologyNodeClass> nodeClasses,
      List<OntologyRelationshipType> relationshipTypes) {
    return new OntologyInfo()
        .name(getName())
        .catalogName(catalogName)
        .schemaName(schemaName)
        .fullName(catalogName + "." + schemaName + "." + getName())
        .comment(comment)
        .nodeClasses(nodeClasses != null ? nodeClasses : Collections.emptyList())
        .relationshipTypes(relationshipTypes != null ? relationshipTypes : Collections.emptyList())
        .owner(owner)
        .createdAt(createdAt != null ? createdAt.getTime() : null)
        .createdBy(createdBy)
        .updatedAt(updatedAt != null ? updatedAt.getTime() : null)
        .updatedBy(updatedBy);
  }
}
