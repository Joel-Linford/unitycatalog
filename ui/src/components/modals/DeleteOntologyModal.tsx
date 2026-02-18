import { Modal, Typography } from 'antd';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeleteOntology } from '../../hooks/ontologies';
import { SchemaTabs } from '../../pages/SchemaDetails';
import { useNotification } from '../../utils/NotificationContext';

interface DeleteOntologyModalProps {
  open: boolean;
  closeModal: () => void;
  catalog: string;
  schema: string;
  ontology: string;
}

export function DeleteOntologyModal({
  open,
  closeModal,
  catalog,
  schema,
  ontology,
}: DeleteOntologyModalProps) {
  const navigate = useNavigate();
  const { setNotification } = useNotification();
  const mutation = useDeleteOntology({
    full_name: [catalog, schema, ontology].join('.'),
  });

  const handleSubmit = useCallback(() => {
    mutation.mutate(undefined, {
        onError: (error: Error) => {
          setNotification(error.message, 'error');
        },
        onSuccess: () => {
          setNotification(`${ontology} ontology successfully deleted`, 'success');
          navigate(`/data/${catalog}/${schema}`, { state: { tab: SchemaTabs.Ontologies } });
        },
      },
    );
  }, [mutation, ontology, setNotification, navigate, catalog, schema]);

  return (
    <Modal
      title={
        <Typography.Title type="danger" level={4}>
          Delete ontology
        </Typography.Title>
      }
      okText="Delete"
      okType="danger"
      cancelText="Cancel"
      open={open}
      destroyOnClose
      onCancel={closeModal}
      onOk={handleSubmit}
      okButtonProps={{ loading: mutation.isPending }}
    >
      <Typography.Text>
        Are you sure you want to delete the ontology
      </Typography.Text>
      <Typography.Text strong>{` ${ontology}`}</Typography.Text>
      <Typography.Text>? This operation cannot be undone.</Typography.Text>
    </Modal>
  );
}
