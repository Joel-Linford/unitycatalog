# Graph Ontology Design

This document describes the design for graph database cataloging and governance through ontology management in Unity Catalog.

## Overview

An **ontology** defines the graph data model as nodes (classes/labels) and edges (relationship types). It lives at the schema level alongside tables, volumes, functions, and models. Rather than tables as the third-level asset, graph schemas are represented by ontologies that contain node classes and relationship types.

## Namespace Placement

```
catalog_name.schema_name.ontology_name
```

- **Level 1**: Catalog (unchanged)
- **Level 2**: Schema (unchanged) — a schema can contain both tabular assets (tables) and graph assets (ontologies)
- **Level 3**: Ontology — the graph schema asset; full name is `catalog.schema.ontology`

## Ontology Structure

An ontology is composed of:

### Node Classes (Labels)

Node classes define the types of nodes in the graph. Each class has:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Label/class name (e.g., `Person`, `Product`, `Order`) |
| `parent_class` | string (optional) | Parent class for inheritance (e.g., `Customer` extends `Person`) |
| `source_table` | string (optional) | Full name of the Unity Catalog table backing this node class (e.g. `catalog.schema.table`). Nodes may be loaded from this table. |
| `properties` | array of PropertyDef | Typed properties for this class |

### Relationship Types (Edges)

Relationship types define the directed edges between node classes. Each type has:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Relationship type name (e.g., `PURCHASED`, `WORKS_FOR`) |
| `source_class` | string | Source node class (start of edge) |
| `target_class` | string | Target node class (end of edge) |
| `source_table` | string (optional) | Full name of the Unity Catalog table backing this relationship type (e.g. `catalog.schema.edge_table`). Edges may be loaded from this table. |
| `properties` | array of PropertyDef | Typed properties for this relationship |

### Property Definition

Properties use a fixed type set (engine-neutral, Neo4j-compatible):

| Type | Description |
|------|-------------|
| `STRING` | Text |
| `INTEGER` | 32-bit integer |
| `LONG` | 64-bit integer |
| `FLOAT` | Single-precision float |
| `DOUBLE` | Double-precision float |
| `BOOLEAN` | True/false |
| `DATE` | Date (ISO 8601) |
| `LIST` | List of values |
| `MAP` | Key-value map |

Each property has:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Property name |
| `type` | PropertyType enum | One of the types above |
| `required` | boolean | Whether the property is required (default: false) |

## API Design

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ontologies` | Create ontology |
| GET | `/ontologies` | List ontologies (query: `catalog_name`, `schema_name`) |
| GET | `/ontologies/{full_name}` | Get ontology by full name |
| PATCH | `/ontologies/{full_name}` | Update ontology |
| DELETE | `/ontologies/{full_name}` | Delete ontology |

### Request/Response

- **CreateOntology**: `catalog_name`, `schema_name`, `name`, `comment`, `node_classes`, `relationship_types`
- **OntologyInfo**: Same fields plus `full_name`, `owner`, `created_at`, `created_by`, `updated_at`, `updated_by`

## Example

```json
{
  "catalog_name": "product_graph",
  "schema_name": "default",
  "name": "ecommerce_ontology",
  "comment": "E-commerce graph model for product recommendations",
  "node_classes": [
    {
      "name": "Person",
      "properties": [
        { "name": "email", "type": "STRING", "required": true },
        { "name": "name", "type": "STRING", "required": false }
      ]
    },
    {
      "name": "Customer",
      "parent_class": "Person",
      "properties": [
        { "name": "loyalty_tier", "type": "STRING", "required": false }
      ]
    },
    {
      "name": "Product",
      "properties": [
        { "name": "sku", "type": "STRING", "required": true },
        { "name": "price", "type": "DOUBLE", "required": true }
      ]
    }
  ],
  "relationship_types": [
    {
      "name": "PURCHASED",
      "source_class": "Customer",
      "target_class": "Product",
      "properties": [
        { "name": "quantity", "type": "INTEGER", "required": true },
        { "name": "date", "type": "DATE", "required": false }
      ]
    }
  ]
}
```

## UI Considerations

- **Node-edge visualization**: Cytoscape.js for interactive graph rendering
- Ontology list and detail views in the UC UI
- Graph view shows node classes as nodes, relationship types as directed edges

## Future Phases

- **Versioning**: Ontology versions (e.g., Delta-aware)
- **Lineage**: Node/edge mappings to cataloged tables
- **Connections**: Direct Neo4j connection for schema and data quality analysis
- **Governance**: Add `ontology` to SecurableType for RBAC
