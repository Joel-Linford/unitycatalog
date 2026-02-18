import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../context/client', () => ({ CLIENT: {} }));
jest.mock('../../utils/openapi', () => ({ route: jest.fn(), isError: jest.fn(), assertNever: jest.fn() }));

import { EditOntologyModal } from './EditOntologyModal';

const matchMediaMock = (query: string) => ({
  matches: false,
  media: query,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

const mockOntology = {
  full_name: 'unity.default.test',
  comment: 'Test ontology',
  node_classes: [
    { name: 'Person', parent_class: undefined, properties: [{ name: 'name', type: 'STRING', required: false }] },
  ],
  relationship_types: [
    { name: 'KNOWS', source_class: 'Person', target_class: 'Person', properties: [] },
  ],
};

function renderModal(props: {
  open?: boolean;
  ontology?: typeof mockOntology;
  fullName?: string;
  closeModal?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <EditOntologyModal
        open={props.open ?? true}
        ontology={props.ontology ?? mockOntology}
        fullName={props.fullName ?? 'unity.default.test'}
        closeModal={props.closeModal ?? jest.fn()}
      />
    </QueryClientProvider>,
  );
}

describe('EditOntologyModal', () => {
  beforeEach(() => {
    window.matchMedia = jest.fn(matchMediaMock) as unknown as typeof window.matchMedia;
  });

  it('renders nothing when open is false', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with form when open', () => {
    renderModal({ open: true });
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/edit ontology/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/node classes/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/relationship types/i)).toBeInTheDocument();
  });

  it('shows initial comment and node class names', () => {
    renderModal({ open: true });
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByDisplayValue('Test ontology')).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue('Person')).toBeInTheDocument();
  });

  it('calls closeModal when Cancel is clicked', async () => {
    const closeModal = jest.fn();
    renderModal({ open: true, closeModal });
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(closeModal).toHaveBeenCalledTimes(1);
  });
});
