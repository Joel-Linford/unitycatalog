import { Typography } from 'antd';
import { formatTimestamp } from '../../utils/formatTimestamp';
import MetadataList, { MetadataListType } from '../MetadataList';
import { useGetOntology, type OntologyInfo } from '../../hooks/ontologies';

interface OntologySidebarProps {
  catalog: string;
  schema: string;
  ontology: string;
}

const ONTOLOGY_METADATA: MetadataListType<OntologyInfo> = [
  {
    key: 'created_at',
    dataIndex: 'created_at',
    label: 'Created at',
    render: (value) => (
      <Typography.Text>{formatTimestamp(value)}</Typography.Text>
    ),
  },
  {
    key: 'updated_at',
    dataIndex: 'updated_at',
    label: 'Updated at',
    render: (value) => (
      <Typography.Text>{formatTimestamp(value)}</Typography.Text>
    ),
  },
  {
    key: 'owner',
    label: 'Owner',
    dataIndex: 'owner',
    render: (value) => <Typography.Text>{value ?? '—'}</Typography.Text>,
  },
];

export default function OntologySidebar({
  catalog,
  schema,
  ontology,
}: OntologySidebarProps) {
  const { data } = useGetOntology({
    full_name: [catalog, schema, ontology].join('.'),
  });

  if (!data) return null;

  return (
    <MetadataList
      data={data}
      metadata={ONTOLOGY_METADATA}
      title="Ontology details"
    />
  );
}
