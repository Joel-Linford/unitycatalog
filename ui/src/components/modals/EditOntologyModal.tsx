import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Typography,
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  type OntologyInfo,
  type OntologyNodeClass,
  type OntologyRelationshipType,
  type UpdateOntologyMutationParams,
  useUpdateOntology,
} from '../../hooks/ontologies';
import { useListTables } from '../../hooks/tables';
import { PROPERTY_TYPES } from '../../utils/ontologyPropertyTypes';

export interface EditOntologyFormValues {
  comment: string;
  node_classes: OntologyNodeClass[];
  relationship_types: OntologyRelationshipType[];
}

interface EditOntologyModalProps {
  open: boolean;
  ontology: OntologyInfo;
  fullName: string;
  closeModal: () => void;
  onSuccess?: () => void;
}

function useNodeClassNames(form: FormInstance<EditOntologyFormValues>): string[] {
  const nodeClasses = Form.useWatch<EditOntologyFormValues['node_classes']>(
    'node_classes',
    form,
  );
  const names = (nodeClasses ?? [])
    .map((c) => c?.name?.trim())
    .filter((n): n is string => Boolean(n));
  return names.filter((n, i) => names.indexOf(n) === i);
}

export function EditOntologyModal({
  open,
  ontology,
  fullName,
  closeModal,
  onSuccess,
}: EditOntologyModalProps) {
  const [form] = Form.useForm<EditOntologyFormValues>();
  const submitRef = useRef<HTMLButtonElement>(null);
  const nodeClassNames = useNodeClassNames(form);
  const [submitting, setSubmitting] = useState(false);

  const updateMutation = useUpdateOntology({ full_name: fullName });

  const [catalog, schema] = fullName.split('.');
  const { data: tablesData } = useListTables({
    catalog_name: catalog,
    schema_name: schema,
    options: { enabled: open && Boolean(catalog && schema) },
  });
  const tableOptions = (tablesData?.tables ?? []).map((t) => ({
    value: [t.catalog_name, t.schema_name, t.name].filter(Boolean).join('.'),
    label: t.name ?? [t.catalog_name, t.schema_name, t.name].filter(Boolean).join('.'),
  }));

  const initialValues: EditOntologyFormValues = {
    comment: ontology.comment ?? '',
    node_classes: ontology.node_classes ?? [],
    relationship_types: ontology.relationship_types ?? [],
  };

  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues);
    }
  }, [open, form]);

  const handleSubmit = useCallback(() => {
    submitRef.current?.click();
  }, []);

  const onFinish = useCallback(
    (values: EditOntologyFormValues) => {
      setSubmitting(true);
      const payload: UpdateOntologyMutationParams = {
        comment: values.comment?.trim() || undefined,
        node_classes: values.node_classes?.length ? values.node_classes : undefined,
        relationship_types: values.relationship_types?.length
          ? values.relationship_types
          : undefined,
      };
      updateMutation.mutate(payload, {
        onSuccess: () => {
          message.success('Ontology updated');
          closeModal();
          onSuccess?.();
        },
        onSettled: () => setSubmitting(false),
      });
    },
    [updateMutation, closeModal, onSuccess],
  );

  const nodeClassOptions = nodeClassNames.map((n) => ({ value: n, label: n }));

  return (
    <Modal
      title={<Typography.Title level={4}>Edit ontology</Typography.Title>}
      open={open}
      destroyOnClose
      onCancel={closeModal}
      onOk={handleSubmit}
      okText="Save"
      cancelText="Cancel"
      width={640}
      okButtonProps={{ loading: submitting }}
    >
      <Form<EditOntologyFormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues}
      >
        <Form.Item name="comment" label="Description">
          <Input.TextArea rows={3} placeholder="Optional description" />
        </Form.Item>

        <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
          Node classes
        </Typography.Title>
        <Form.List name="node_classes">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...rest }) => (
                <div
                  key={key}
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    border: '1px solid #d9d9d9',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Form.Item
                      {...rest}
                      name={[name, 'name']}
                      label="Class name"
                      rules={[{ required: true, message: 'Required' }]}
                      style={{ marginBottom: 0, flex: 1 }}
                    >
                      <Input placeholder="e.g. Person" />
                    </Form.Item>
                    <Form.Item
                      {...rest}
                      name={[name, 'parent_class']}
                      label="Parent class"
                      style={{ marginBottom: 0, minWidth: 140 }}
                    >
                      <Select
                        allowClear
                        placeholder="None"
                        options={nodeClassOptions.filter(
                          (o) => o.value !== form.getFieldValue(['node_classes', name, 'name']),
                        )}
                      />
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      onClick={() => remove(name)}
                      style={{ alignSelf: 'flex-end' }}
                    >
                      Remove
                    </Button>
                  </div>
                  <Form.Item
                    {...rest}
                    name={[name, 'source_table']}
                    label="Source table"
                    style={{ marginBottom: 8 }}
                  >
                    <Select
                      allowClear
                      placeholder="Select table (same schema)"
                      options={tableOptions}
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>
                  <Form.List name={[name, 'properties']}>
                    {(propFields, { add: addProp, remove: removeProp }) => (
                      <>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          Properties
                        </Typography.Text>
                        {propFields.map(({ key: pk, name: pname, ...prest }) => (
                          <div
                            key={pk}
                            style={{
                              display: 'flex',
                              gap: 8,
                              alignItems: 'flex-start',
                              marginTop: 4,
                            }}
                          >
                            <Form.Item
                              {...prest}
                              name={[pname, 'name']}
                              rules={[{ required: true }]}
                              style={{ marginBottom: 0, flex: 1 }}
                            >
                              <Input size="small" placeholder="Property name" />
                            </Form.Item>
                            <Form.Item
                              {...prest}
                              name={[pname, 'type']}
                              rules={[{ required: true }]}
                              style={{ marginBottom: 0, minWidth: 100 }}
                            >
                              <Select
                                size="small"
                                placeholder="Type"
                                options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))}
                              />
                            </Form.Item>
                            <Form.Item
                              {...prest}
                              name={[pname, 'required']}
                              style={{ marginBottom: 0 }}
                            >
                              <Select
                                size="small"
                                options={[
                                  { value: false, label: 'Optional' },
                                  { value: true, label: 'Required' },
                                ]}
                                style={{ width: 90 }}
                              />
                            </Form.Item>
                            <Button
                              type="text"
                              size="small"
                              danger
                              onClick={() => removeProp(pname)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="dashed"
                          size="small"
                          onClick={() => addProp({ name: '', type: 'STRING', required: false })}
                          style={{ marginTop: 4 }}
                        >
                          + Add property
                        </Button>
                      </>
                    )}
                  </Form.List>
                </div>
              ))}
              <Button type="dashed" onClick={() => add({ name: '', properties: [] })} block>
                + Add node class
              </Button>
            </>
          )}
        </Form.List>

        <Typography.Title level={5} style={{ marginTop: 24, marginBottom: 8 }}>
          Relationship types
        </Typography.Title>
        <Form.List name="relationship_types">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...rest }) => (
                <div
                  key={key}
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    border: '1px solid #d9d9d9',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <Form.Item
                      {...rest}
                      name={[name, 'name']}
                      label="Relationship name"
                      rules={[{ required: true }]}
                      style={{ marginBottom: 0, minWidth: 120 }}
                    >
                      <Input placeholder="e.g. KNOWS" />
                    </Form.Item>
                    <Form.Item
                      {...rest}
                      name={[name, 'source_class']}
                      label="Source class"
                      rules={[{ required: true }]}
                      style={{ marginBottom: 0, minWidth: 120 }}
                    >
                      <Select
                        placeholder="Source"
                        options={nodeClassOptions}
                      />
                    </Form.Item>
                    <Form.Item
                      {...rest}
                      name={[name, 'target_class']}
                      label="Target class"
                      rules={[{ required: true }]}
                      style={{ marginBottom: 0, minWidth: 120 }}
                    >
                      <Select placeholder="Target" options={nodeClassOptions} />
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      onClick={() => remove(name)}
                      style={{ alignSelf: 'flex-end' }}
                    >
                      Remove
                    </Button>
                  </div>
                  <Form.Item
                    {...rest}
                    name={[name, 'source_table']}
                    label="Source table"
                    style={{ marginBottom: 8 }}
                  >
                    <Select
                      allowClear
                      placeholder="Select table (same schema)"
                      options={tableOptions}
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>
                  <Form.List name={[name, 'properties']}>
                    {(propFields, { add: addProp, remove: removeProp }) => (
                      <>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          Properties
                        </Typography.Text>
                        {propFields.map(({ key: pk, name: pname, ...prest }) => (
                          <div
                            key={pk}
                            style={{
                              display: 'flex',
                              gap: 8,
                              alignItems: 'flex-start',
                              marginTop: 4,
                            }}
                          >
                            <Form.Item
                              {...prest}
                              name={[pname, 'name']}
                              rules={[{ required: true }]}
                              style={{ marginBottom: 0, flex: 1 }}
                            >
                              <Input size="small" placeholder="Property name" />
                            </Form.Item>
                            <Form.Item
                              {...prest}
                              name={[pname, 'type']}
                              rules={[{ required: true }]}
                              style={{ marginBottom: 0, minWidth: 100 }}
                            >
                              <Select
                                size="small"
                                placeholder="Type"
                                options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))}
                              />
                            </Form.Item>
                            <Form.Item
                              {...prest}
                              name={[pname, 'required']}
                              style={{ marginBottom: 0 }}
                            >
                              <Select
                                size="small"
                                options={[
                                  { value: false, label: 'Optional' },
                                  { value: true, label: 'Required' },
                                ]}
                                style={{ width: 90 }}
                              />
                            </Form.Item>
                            <Button
                              type="text"
                              size="small"
                              danger
                              onClick={() => removeProp(pname)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="dashed"
                          size="small"
                          onClick={() => addProp({ name: '', type: 'STRING', required: false })}
                          style={{ marginTop: 4 }}
                        >
                          + Add property
                        </Button>
                      </>
                    )}
                  </Form.List>
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() =>
                  add({
                    name: '',
                    source_class: nodeClassNames[0] ?? '',
                    target_class: nodeClassNames[0] ?? '',
                    properties: [],
                  })
                }
                block
              >
                + Add relationship type
              </Button>
            </>
          )}
        </Form.List>

        <Form.Item hidden>
          <Button type="primary" htmlType="submit" ref={submitRef}>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
