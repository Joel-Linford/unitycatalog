import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { CLIENT } from '../context/client';
import { route, isError, assertNever } from '../utils/openapi';
import type { Route } from '../utils/openapi';

// Ontology API types (match OpenAPI spec; run `yarn generate` or `npm run generate` to regenerate catalog.gen.ts)
export interface OntologyPropertyDef {
  name: string;
  type: string;
  required?: boolean;
}
export interface OntologyNodeClass {
  name: string;
  parent_class?: string;
  /** Full name of the table backing this node class (e.g. catalog.schema.table). */
  source_table?: string;
  properties?: OntologyPropertyDef[];
}
export interface OntologyRelationshipType {
  name: string;
  source_class: string;
  target_class: string;
  /** Full name of the table backing this relationship type (e.g. catalog.schema.edge_table). */
  source_table?: string;
  properties?: OntologyPropertyDef[];
}
export interface OntologyInfo {
  name?: string;
  catalog_name?: string;
  schema_name?: string;
  full_name?: string;
  comment?: string;
  node_classes?: OntologyNodeClass[];
  relationship_types?: OntologyRelationshipType[];
  owner?: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
}
export interface OntologyApiPaths {
  '/ontologies': {
    get: {
      parameters: { query: { catalog_name: string; schema_name: string } };
      responses: { 200: { content: { 'application/json': { ontologies?: OntologyInfo[]; next_page_token?: string } } } };
    };
    post: { requestBody: { content: { 'application/json': unknown } }; responses: { 200: { content: { 'application/json': OntologyInfo } } } };
  };
  '/ontologies/{full_name}': {
    parameters: { path: { full_name: string } };
    get: { responses: { 200: { content: { 'application/json': OntologyInfo } } } };
    patch: {
      requestBody: { content: { 'application/json': { comment?: string; node_classes?: OntologyNodeClass[]; relationship_types?: OntologyRelationshipType[] } } };
      responses: { 200: { content: { 'application/json': OntologyInfo } } };
    };
    delete: { responses: { 200: { content: Record<string, never> } } };
  };
}

type CatalogApiWithOntologies = import('../types/api/catalog.gen').paths & OntologyApiPaths;

export interface OntologyInterface extends OntologyInfo {}

export interface UseListOntologiesArgs {
  catalog_name: string;
  schema_name: string;
  options?: Partial<UseQueryOptions<{ ontologies?: OntologyInfo[]; next_page_token?: string }>>;
}

export interface CreateOntologyParams {
  name: string;
  catalog_name: string;
  schema_name: string;
  comment?: string;
  node_classes?: OntologyNodeClass[];
  relationship_types?: OntologyRelationshipType[];
}

export function useCreateOntology() {
  const queryClient = useQueryClient();

  return useMutation<OntologyInfo, Error, CreateOntologyParams>({
    mutationFn: async (body: CreateOntologyParams) => {
      const response = await (route as Route<CatalogApiWithOntologies>)({
        client: CLIENT,
        request: {
          path: '/ontologies',
          method: 'post',
          params: {
            body: body as Parameters<Route<CatalogApiWithOntologies>>[0]['request'] extends { params: { body: infer B } } ? B : never,
          },
        },
        errorMessage: 'Failed to create ontology',
      }).call();
      if (isError(response)) {
        return assertNever(response.data.status);
      } else {
        return response.data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['listOntologies', variables.catalog_name, variables.schema_name],
      });
    },
  });
}

export function useListOntologies({
  catalog_name,
  schema_name,
  options,
}: UseListOntologiesArgs) {
  return useQuery<{ ontologies?: OntologyInfo[]; next_page_token?: string }>({
    queryKey: ['listOntologies', catalog_name, schema_name],
    queryFn: async () => {
      const response = await (route as Route<CatalogApiWithOntologies>)({
        client: CLIENT,
        request: {
          path: '/ontologies',
          method: 'get',
          params: {
            query: {
              catalog_name,
              schema_name,
            },
          },
        },
        errorMessage: 'Failed to list ontologies',
      }).call();
      if (isError(response)) {
        return assertNever(response.data.status);
      } else {
        return response.data;
      }
    },
    ...options,
  });
}

export interface UseGetOntologyArgs {
  full_name: string;
}

export function useGetOntology({ full_name }: UseGetOntologyArgs) {
  const [catalog, schema, ontology] = full_name.split('.');

  return useQuery<OntologyInfo>({
    queryKey: ['getOntology', catalog, schema, ontology],
    queryFn: async () => {
      const response = await (route as Route<CatalogApiWithOntologies>)({
        client: CLIENT,
        request: {
          path: '/ontologies/{full_name}',
          method: 'get',
          params: {
            paths: {
              full_name,
            },
          },
        },
        errorMessage: 'Failed to fetch ontology',
      }).call();
      if (isError(response)) {
        return assertNever(response.data.status);
      } else {
        return response.data;
      }
    },
  });
}

export interface UseUpdateOntologyArgs {
  full_name: string;
}

export interface UpdateOntologyMutationParams {
  comment?: string;
  node_classes?: OntologyNodeClass[];
  relationship_types?: OntologyRelationshipType[];
}

export function useUpdateOntology({ full_name }: UseUpdateOntologyArgs) {
  const queryClient = useQueryClient();
  const [catalog, schema, ontology] = full_name.split('.');

  return useMutation<OntologyInfo, Error, UpdateOntologyMutationParams>({
    mutationFn: async (body: UpdateOntologyMutationParams) => {
      const response = await (route as Route<CatalogApiWithOntologies>)({
        client: CLIENT,
        request: {
          path: '/ontologies/{full_name}',
          method: 'patch',
          params: {
            paths: { full_name },
            body: body as Record<string, unknown>,
          },
        },
        errorMessage: 'Failed to update ontology',
      }).call();
      if (isError(response)) {
        return assertNever(response.data.status);
      } else {
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['getOntology', catalog, schema, ontology],
      });
    },
  });
}

export interface UseDeleteOntologyArgs {
  full_name: string;
}

export function useDeleteOntology({ full_name }: UseDeleteOntologyArgs) {
  const queryClient = useQueryClient();
  const [catalog, schema] = full_name.split('.');

  return useMutation<unknown, Error, void>({
    mutationFn: async () => {
      const response = await (route as Route<CatalogApiWithOntologies>)({
        client: CLIENT,
        request: {
          path: '/ontologies/{full_name}',
          method: 'delete',
          params: {
            paths: { full_name },
          },
        },
        errorMessage: 'Failed to delete ontology',
      }).call();
      if (isError(response)) {
        return assertNever(response.data.status);
      } else {
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['listOntologies', catalog, schema],
      });
    },
  });
}
