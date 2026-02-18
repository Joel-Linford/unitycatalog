import { Button, Flex, Typography } from 'antd';
import ListLayout from '../layouts/ListLayout';
import { formatTimestamp } from '../../utils/formatTimestamp';
import { useNavigate } from 'react-router-dom';
import { useListOntologies } from '../../hooks/ontologies';
import { ReactNode, useState } from 'react';
import { ApartmentOutlined, PlusOutlined } from '@ant-design/icons';
import CreateOntologyModal from '../modals/CreateOntologyModal';

interface OntologiesListProps {
  catalog: string;
  schema: string;
  filters?: ReactNode;
}

export default function OntologiesList({
  catalog,
  schema,
  filters,
}: OntologiesListProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useListOntologies({
    catalog_name: catalog,
    schema_name: schema,
  });
  const navigate = useNavigate();

  return (
    <>
      <ListLayout
        loading={isLoading}
        title={
          <Flex justify="space-between" align="center" wrap="wrap" gap="small">
            <Typography.Title level={4} style={{ margin: 0 }}>
              Ontologies
            </Typography.Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              Create ontology
            </Button>
          </Flex>
        }
      data={data?.ontologies}
      filters={filters}
      onRowClick={(record) =>
        navigate(
          `/ontologies/${record.catalog_name}/${record.schema_name}/${record.name}`,
        )
      }
      rowKey={(record) => `ontology-${record.full_name ?? record.name}`}
      columns={[
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          width: '60%',
          render: (name: string) => (
            <>
              <ApartmentOutlined /> {name}
            </>
          ),
        },
        {
          title: 'Updated At',
          dataIndex: 'updated_at',
          key: 'updated_at',
          width: '40%',
          render: (value: number | undefined) =>
            value != null ? formatTimestamp(value) : '—',
        },
      ]}
      />
      <CreateOntologyModal
        open={createOpen}
        closeModal={() => setCreateOpen(false)}
        catalog={catalog}
        schema={schema}
      />
    </>
  );
}
