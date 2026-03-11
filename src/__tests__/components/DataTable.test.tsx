import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataTable } from '../../components/ui/DataTable';

interface MockItem {
  id: number;
  nome: string;
}

describe('Componente: DataTable', () => {
  const mockColumns = [
    {
      key: 'id',
      header: 'ID',
      render: (item: MockItem) => <span>{item.id}</span>,
      isSortable: true,
    },
    {
      key: 'nome',
      header: 'Nome',
      render: (item: MockItem) => <span>{item.nome}</span>,
      isSortable: true,
    },
    {
      key: 'acao',
      header: 'Ação',
      render: () => <button>Editar</button>,
      isSortable: false,
    },
  ];

  const mockData: MockItem[] = [
    { id: 1, nome: 'Harry Potter' },
    { id: 2, nome: 'Senhor dos Anéis' },
  ];

  const mockOnSort = vi.fn();

  it('deve renderizar os cabeçalhos e os dados corretamente', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        isLoading={false}
        error={null}
        sortConfig={{ key: 'id', direction: 'asc' }}
        onSort={mockOnSort}
        getRowKey={(item) => item.id}
      />,
    );

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Harry Potter')).toBeInTheDocument();
    expect(screen.getByText('Senhor dos Anéis')).toBeInTheDocument();
  });

  it('deve exibir mensagem de estado vazio quando não houver dados', () => {
    render(
      <DataTable
        data={[]}
        columns={mockColumns}
        isLoading={false}
        error={null}
        sortConfig={{ key: 'id', direction: 'asc' }}
        onSort={mockOnSort}
        getRowKey={(item) => item.id}
        emptyStateMessage="Nenhum item encontrado."
      />,
    );

    expect(screen.getByText('Nenhum item encontrado.')).toBeInTheDocument();
  });

  it('deve chamar a função onSort ao clicar em um cabeçalho ordenável', () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        isLoading={false}
        error={null}
        sortConfig={{ key: 'id', direction: 'asc' }}
        onSort={mockOnSort}
        getRowKey={(item) => item.id}
      />,
    );

    fireEvent.click(screen.getByText('Nome'));

    expect(mockOnSort).toHaveBeenCalledWith('nome');
  });
});
