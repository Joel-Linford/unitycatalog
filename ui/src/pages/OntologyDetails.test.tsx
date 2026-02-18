import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
jest.mock('../context/client', () => ({ CLIENT: {} }));
jest.mock('../utils/openapi', () => ({ route: jest.fn(), isError: jest.fn(), assertNever: jest.fn() }));
jest.mock('../components/ontologies/OntologyActionsDropdown', () => ({
  __esModule: true,
  default: () => null,
}));

import * as ontologies from '../hooks/ontologies';
import OntologyDetails from './OntologyDetails';

const mockOntology = {
  full_name: 'unity.default.education_sample',
  name: 'education_sample',
  catalog_name: 'unity',
  schema_name: 'default',
  comment: 'Sample education ontology',
  node_classes: [
    { name: 'Student', properties: [{ name: 'id', type: 'STRING', required: true }] },
    { name: 'School', properties: [] },
  ],
  relationship_types: [
    { name: 'attend', source_class: 'Student', target_class: 'School', properties: [] },
  ],
};

function renderWithRouter(
  initialEntries: string[] = ['/ontologies/unity/default/education_sample'],
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/ontologies/:catalog/:schema/:ontology" element={<OntologyDetails />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const matchMediaMock = (query: string) => ({
  matches: false,
  media: query,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

describe('OntologyDetails', () => {
  beforeEach(() => {
    window.matchMedia = jest.fn(matchMediaMock) as unknown as typeof window.matchMedia;
    jest.spyOn(ontologies, 'useGetOntology').mockReturnValue({
      data: mockOntology,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
      failureCount: 0,
      failureReason: null,
      isPending: false,
      isStale: false,
      fetchStatus: 'idle',
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isRefetching: false,
      isLoadingError: false,
      isInitialLoading: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isSuccess: true,
      status: 'success',
    } as ReturnType<typeof ontologies.useGetOntology>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders ontology name and content when data is loaded', () => {
    renderWithRouter();
    expect(screen.getByText('unity.default.education_sample')).toBeInTheDocument();
    expect(screen.getByText('Sample education ontology')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByText('School')).toBeInTheDocument();
  });

  it('shows Edit ontology button', () => {
    renderWithRouter();
    const editButton = screen.getByRole('button', { name: /edit ontology/i });
    expect(editButton).toBeInTheDocument();
  });

  it('opens Edit ontology modal when Edit button is clicked', async () => {
    renderWithRouter();
    const editButton = screen.getByRole('button', { name: /edit ontology/i });
    await userEvent.click(editButton);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/edit ontology/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/node classes/i)).toBeInTheDocument();
  });

  it('closes modal when Cancel is clicked', async () => {
    renderWithRouter();
    await userEvent.click(screen.getByRole('button', { name: /edit ontology/i }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
