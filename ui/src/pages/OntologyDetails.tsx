import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DetailsLayout from '../components/layouts/DetailsLayout';
import { Button, Flex, Table, Tabs, Typography } from 'antd';
import DescriptionBox from '../components/DescriptionBox';
import { useGetOntology } from '../hooks/ontologies';
import OntologySidebar from '../components/ontologies/OntologySidebar';
import OntologyGraph from '../components/ontologies/OntologyGraph';
import OntologyActionsDropdown from '../components/ontologies/OntologyActionsDropdown';
import { EditOntologyModal } from '../components/modals/EditOntologyModal';
import { ApartmentOutlined, EditOutlined } from '@ant-design/icons';

export default function OntologyDetails() {
  const { catalog, schema, ontology } = useParams();
  if (!catalog) throw new Error('Catalog name is required');
  if (!schema) throw new Error('Schema name is required');
  if (!ontology) throw new Error('Ontology name is required');

  const fullName = [catalog, schema, ontology].join('.');
  const { data } = useGetOntology({ full_name: fullName });
  const [editModalOpen, setEditModalOpen] = useState(false);

  if (!data) return null;

  const nodeColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v: string) => <Typography.Text code>{v}</Typography.Text> },
    { title: 'Parent class', dataIndex: 'parent_class', key: 'parent_class', render: (v: string) => v ?? '—' },
    { title: 'Source table', dataIndex: 'source_table', key: 'source_table', render: (v: string) => v ?? '—' },
    {
      title: 'Properties',
      dataIndex: 'properties',
      key: 'properties',
      render: (props: { name: string; type: string }[] | undefined) =>
        props?.length
          ? props.map((p) => `${p.name}: ${p.type}`).join(', ')
          : '—',
    },
  ];

  const relColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v: string) => <Typography.Text code>{v}</Typography.Text> },
    { title: 'Source', dataIndex: 'source_class', key: 'source_class' },
    { title: 'Target', dataIndex: 'target_class', key: 'target_class' },
    { title: 'Source table', dataIndex: 'source_table', key: 'source_table', render: (v: string) => v ?? '—' },
    {
      title: 'Properties',
      dataIndex: 'properties',
      key: 'properties',
      render: (props: { name: string; type: string }[] | undefined) =>
        props?.length
          ? props.map((p) => `${p.name}: ${p.type}`).join(', ')
          : '—',
    },
  ];

  return (
    <>
    <DetailsLayout
      title={
        <Flex justify="space-between" align="flex-start" gap="middle" wrap="wrap">
          <Typography.Title level={3} style={{ margin: 0 }}>
            <ApartmentOutlined /> {fullName}
          </Typography.Title>
          <Flex gap="small" align="center">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setEditModalOpen(true)}
            >
              Edit ontology
            </Button>
            <OntologyActionsDropdown
              catalog={catalog}
              schema={schema}
              ontology={ontology}
              onEdit={() => setEditModalOpen(true)}
            />
          </Flex>
        </Flex>
      }
      breadcrumbs={[
        { title: <Link to="/">Catalogs</Link>, key: '_home' },
        { title: <Link to={`/data/${catalog}`}>{catalog}</Link>, key: '_catalog' },
        {
          title: <Link to={`/data/${catalog}/${schema}`}>{schema}</Link>,
          key: '_schema',
        },
        { title: ontology, key: '_ontology' },
      ]}
    >
      <DetailsLayout.Content>
        <Flex vertical gap="middle">
          <DescriptionBox comment={data.comment ?? ''} />
          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              Graph view
            </Typography.Title>
            <OntologyGraph ontology={data} height={380} />
          </div>
          <Tabs
            items={[
              {
                key: 'nodes',
                label: `Node classes (${data.node_classes?.length ?? 0})`,
                children: (
                  <Table
                    size="small"
                    dataSource={data.node_classes ?? []}
                    columns={nodeColumns}
                    rowKey="name"
                    pagination={false}
                  />
                ),
              },
              {
                key: 'edges',
                label: `Relationship types (${data.relationship_types?.length ?? 0})`,
                children: (
                  <Table
                    size="small"
                    dataSource={data.relationship_types ?? []}
                    columns={relColumns}
                    rowKey={(r) => `${r.name}-${r.source_class}-${r.target_class}`}
                    pagination={false}
                  />
                ),
              },
            ]}
          />
        </Flex>
      </DetailsLayout.Content>
      <DetailsLayout.Aside>
        <OntologySidebar catalog={catalog} schema={schema} ontology={ontology} />
      </DetailsLayout.Aside>
    </DetailsLayout>
    <EditOntologyModal
      open={editModalOpen}
      ontology={data}
      fullName={fullName}
      closeModal={() => setEditModalOpen(false)}
    />
    </>
  );
}
