import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps } from 'antd';
import { useMemo, useState } from 'react';
import { DeleteOntologyModal } from '../modals/DeleteOntologyModal';

interface OntologyActionsDropdownProps {
  catalog: string;
  schema: string;
  ontology: string;
  /** When provided, shows Edit ontology in the menu and calls this when selected. */
  onEdit?: () => void;
}

enum OntologyActionsEnum {
  Delete,
}

export default function OntologyActionsDropdown({
  catalog,
  schema,
  ontology,
  onEdit,
}: OntologyActionsDropdownProps) {
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [action, setAction] = useState<OntologyActionsEnum | null>(null);

  const menuItems = useMemo(
    (): MenuProps['items'] => [
      ...(onEdit
        ? [
            {
              key: 'editOntology',
              label: 'Edit ontology',
              onClick: () => onEdit(),
              icon: <EditOutlined />,
            },
          ]
        : []),
      {
        key: 'deleteOntology',
        label: 'Delete ontology',
        onClick: () => setAction(OntologyActionsEnum.Delete),
        icon: <DeleteOutlined />,
        danger: true,
      },
    ],
    [onEdit],
  );

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        onOpenChange={() => setDropdownVisible(!dropdownVisible)}
      >
        <Button
          type="text"
          icon={
            <MoreOutlined
              rotate={dropdownVisible ? 90 : 0}
              style={{ transition: 'transform 0.5s' }}
            />
          }
        />
      </Dropdown>
      <DeleteOntologyModal
        open={action === OntologyActionsEnum.Delete}
        closeModal={() => setAction(null)}
        catalog={catalog}
        schema={schema}
        ontology={ontology}
      />
    </>
  );
}
