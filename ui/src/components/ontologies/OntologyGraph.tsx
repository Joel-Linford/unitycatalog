import React, { useEffect, useRef } from 'react';
import type { OntologyInfo, OntologyNodeClass, OntologyRelationshipType } from '../../hooks/ontologies';

interface OntologyGraphProps {
  ontology: OntologyInfo | null;
  height?: number;
}

/**
 * Renders the ontology as a node-edge graph.
 * Uses Cytoscape.js when available; falls back to a simple placeholder.
 */
export default function OntologyGraph({ ontology, height = 400 }: OntologyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ontology?.node_classes?.length || !containerRef.current) return;

    const loadCytoscape = async (): Promise<(() => void) | undefined> => {
      try {
        const cytoscapeModule = await import('cytoscape');
        const cytoscape = cytoscapeModule.default;
        type ElementDef = { group: string; data: Record<string, unknown> };
        const elements: ElementDef[] = [];
        const nodeIds = new Set<string>();

        // Render all nodes as top-level so the layout spreads them. (Using Cytoscape
        // compound nodes for parent_class would nest nodes into one blob.)
        (ontology.node_classes ?? []).forEach((nodeClass: OntologyNodeClass) => {
          const id = `node-${nodeClass.name}`;
          nodeIds.add(id);
          elements.push({
            group: 'nodes',
            data: { id, label: nodeClass.name },
          });
        });

        // Inheritance (parent_class) as dashed edges — add first so relationship edges draw on top.
        (ontology.node_classes ?? []).forEach((nodeClass: OntologyNodeClass) => {
          if (!nodeClass.parent_class) return;
          const childId = `node-${nodeClass.name}`;
          const parentId = `node-${nodeClass.parent_class}`;
          if (nodeIds.has(childId) && nodeIds.has(parentId)) {
            elements.push({
              group: 'edges',
              data: {
                id: `edge-inherits-${nodeClass.name}`,
                source: childId,
                target: parentId,
                label: 'inherits',
              },
            });
          }
        });

        // Semantic relationship edges (HAS, etc.) — add after inheritance so they draw on top.
        const rawRels =
          ontology.relationship_types ??
          (ontology as Record<string, unknown>).relationshipTypes;
        const relTypes = Array.isArray(rawRels) ? rawRels : [];
        relTypes.forEach((rel: OntologyRelationshipType & { sourceClass?: string; targetClass?: string }, idx: number) => {
          const sourceClass = rel.source_class ?? rel.sourceClass ?? '';
          const targetClass = rel.target_class ?? rel.targetClass ?? '';
          const sourceId = `node-${sourceClass}`;
          const targetId = `node-${targetClass}`;
          if (sourceClass && targetClass && nodeIds.has(sourceId) && nodeIds.has(targetId)) {
            elements.push({
              group: 'edges',
              data: {
                id: `edge-rel-${idx}-${rel.name}`,
                source: sourceId,
                target: targetId,
                label: rel.name,
              },
            });
          }
        });

        const cy = cytoscape({
          container: containerRef.current,
          elements: elements as unknown as import('cytoscape').ElementsDefinition,
          style: [
            {
              selector: 'node',
              style: {
                label: 'data(label)',
                'background-color': '#5c7cfa',
                color: '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '10px',
                padding: '10px',
                shape: 'ellipse',
                width: 48,
                height: 48,
              },
            },
            {
              selector: 'edge',
              style: {
                width: 2,
                'line-color': '#adb5bd',
                'target-arrow-color': '#adb5bd',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                label: 'data(label)',
                'font-size': '9px',
                color: '#495057',
                'text-margin-y': -5,
                'text-rotation': 'autorotate',
                'text-wrap': 'ellipsis',
              },
            },
            {
              selector: 'edge[label="inherits"]',
              style: {
                'line-style': 'dashed',
                'line-color': '#868e96',
                'target-arrow-color': '#868e96',
              },
            },
          ],
          layout: { name: 'cose', animate: false },
        });
        return () => cy.destroy();
      } catch {
        return undefined;
      }
    };

    let destroy: (() => void) | undefined;
    loadCytoscape().then((fn) => {
      destroy = fn;
    });
    return () => {
      destroy?.();
    };
  }, [ontology]);

  if (!ontology) return null;

  const hasContent =
    (ontology.node_classes?.length ?? 0) > 0 ||
    (ontology.relationship_types?.length ?? 0) > 0;

  return (
    <div
      ref={containerRef}
      style={{
        height: hasContent ? height : 120,
        minHeight: 120,
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        background: '#fafafa',
      }}
    >
      {!hasContent && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#8c8c8c',
          }}
        >
          No node classes or relationships defined. Add classes and relationship types to see the graph.
        </div>
      )}
    </div>
  );
}
