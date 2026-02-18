/** Property types supported by the graph ontology (matches API PropertyType enum). */
export const PROPERTY_TYPES = [
  'STRING',
  'INTEGER',
  'LONG',
  'FLOAT',
  'DOUBLE',
  'BOOLEAN',
  'DATE',
  'LIST',
  'MAP',
] as const;

export type PropertyTypeName = (typeof PROPERTY_TYPES)[number];
