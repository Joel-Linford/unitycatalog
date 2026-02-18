import { Button, Form, Input, Modal, Typography } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreateOntologyParams,
  useCreateOntology,
} from '../../hooks/ontologies';
import { useNotification } from '../../utils/NotificationContext';

interface CreateOntologyModalProps {
  open: boolean;
  closeModal: () => void;
  catalog: string;
  schema: string;
}

export default function CreateOntologyModal({
  open,
  closeModal,
  catalog,
  schema,
}: CreateOntologyModalProps) {
  const navigate = useNavigate();
  const mutation = useCreateOntology();
  const { setNotification } = useNotification();
  const submitRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = useCallback(() => {
    submitRef.current?.click();
  }, []);

  return (
    <Modal
      title={<Typography.Title level={4}>Create ontology</Typography.Title>}
      okText="Create"
      cancelText="Cancel"
      open={open}
      destroyOnClose
      onCancel={closeModal}
      onOk={handleSubmit}
      okButtonProps={{ loading: mutation.isPending }}
    >
      <Typography.Paragraph type="secondary">
        Add a new graph ontology to this schema. You can add node classes and
        relationship types after creation.
      </Typography.Paragraph>
      <Form<CreateOntologyParams>
        layout="vertical"
        onFinish={(values) => {
          mutation.mutate(
            {
              name: values.name,
              catalog_name: catalog,
              schema_name: schema,
              comment: values.comment,
            },
            {
              onError: (error) => {
                setNotification(error.message, 'error');
              },
              onSuccess: (data) => {
                setNotification(
                  `Ontology ${data.name} created successfully`,
                  'success',
                );
                closeModal();
                const fullName = [data.catalog_name, data.schema_name, data.name]
                  .filter(Boolean)
                  .join('.');
                navigate(`/ontologies/${catalog}/${schema}/${data.name}`);
              },
            },
          );
        }}
        name="Create ontology form"
        initialValues={{ name: '', comment: '' }}
      >
        <Form.Item
          required
          label={<Typography.Text strong>Name</Typography.Text>}
          name="name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input placeholder="e.g. product_graph" />
        </Form.Item>
        <Form.Item
          label={<Typography.Text strong>Comment</Typography.Text>}
          name="comment"
        >
          <TextArea rows={2} placeholder="Optional description" />
        </Form.Item>
        <Form.Item hidden>
          <Button type="primary" htmlType="submit" ref={submitRef}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
