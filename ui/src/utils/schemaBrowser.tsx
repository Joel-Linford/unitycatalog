import { TreeDataNode } from 'antd';
import { TableInterface } from '../hooks/tables';
import { VolumeInterface } from '../hooks/volumes';
import { FunctionInterface } from '../hooks/functions';
import {
  ApartmentOutlined,
  DeploymentUnitOutlined,
  FolderOutlined,
  FunctionOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { ModelInterface } from '../hooks/models';
import { OntologyInterface } from '../hooks/ontologies';

export function updateEntityTreeData({
  treeData,
  entityToExpand,
  entityList,
}: {
  treeData: TreeDataNode[];
  entityToExpand: { catalog: string; schema: string; type: string };
  entityList: (
    | TableInterface
    | VolumeInterface
    | FunctionInterface
    | ModelInterface
    | OntologyInterface
  )[];
}) {
  const { catalog, schema, type } = entityToExpand;
  const catalogNode = treeData.find(({ key }) => key === catalog);
  const schemaNode = catalogNode?.children?.find(
    ({ key }) => key === [catalog, schema].join('.'),
  );
  const entitiesNode = schemaNode?.children?.find(
    ({ key }) => key === `${[catalog, schema].join('.')}:${type}`,
  );

  if (entitiesNode) {
    entitiesNode.children = entityList?.length
      ? entityList.map(({ catalog_name, schema_name, name }) => ({
          title: (
            <>
              {type === 'functions' ? (
                <FunctionOutlined />
              ) : type === 'volumes' ? (
                <FolderOutlined />
              ) : type === 'registered_models' ? (
                <DeploymentUnitOutlined />
              ) : type === 'ontologies' ? (
                <ApartmentOutlined />
              ) : (
                <TableOutlined />
              )}{' '}
              {name}
            </>
          ),
          key: `${catalog_name}.${schema_name}.${name}:${type}`,
          isLeaf: true,
        }))
      : [
          {
            title: `No ${type} found`,
            key: `${[catalog, schema].join('.')}:${type}:no-data`,
            isLeaf: true,
            style: { color: 'gray' },
            selectable: false,
          },
        ];
  }

  return [...treeData];
}
