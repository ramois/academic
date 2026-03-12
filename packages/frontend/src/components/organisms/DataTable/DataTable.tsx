import { useMemo, useState, type ReactNode } from 'react';

export type DataTableColumn<T> = {
  id: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right';
  value: (row: T) => string | number | null | undefined;
  render?: (row: T) => ReactNode;
};

type SortDir = 'asc' | 'desc';

/** Modo cliente: data tiene todos los ítems; la tabla hace slice y orden. */
type ClientSideProps<T> = {
  data: T[];
  total?: never;
  page?: never;
  pageSize?: never;
  sortKey?: never;
  sortDir?: never;
  onPageChange?: never;
  onPageSizeChange?: never;
  onSortChange?: never;
  loading?: never;
};

/** Modo servidor (AJAX): data es la página actual; total y estado controlado. */
type ServerSideProps<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  sortKey: string | null;
  sortDir: SortDir;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (sortKey: string | null, sortDir: SortDir) => void;
  loading?: boolean;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  keyExtractor: (row: T) => string;
  renderActions?: (row: T) => ReactNode;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  emptyMessage?: string;
} & (ClientSideProps<T> | ServerSideProps<T>);

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  renderActions,
  pageSizeOptions = [5, 10, 25, 50],
  defaultPageSize = 10,
  emptyMessage = 'No hay datos.',
  ...rest
}: DataTableProps<T>) {
  const isServerSide = 'total' in rest && rest.total !== undefined;

  const [clientSortKey, setClientSortKey] = useState<string | null>(null);
  const [clientSortDir, setClientSortDir] = useState<SortDir>('asc');
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(defaultPageSize);

  const sortKey = isServerSide ? rest.sortKey : clientSortKey;
  const sortDir = isServerSide ? rest.sortDir : clientSortDir;
  const page = isServerSide ? rest.page : clientPage;
  const pageSize = isServerSide ? rest.pageSize : clientPageSize;
  const total = isServerSide ? rest.total : data.length;
  const loading = isServerSide ? rest.loading : false;

  const column = sortKey ? columns.find((c) => c.id === sortKey) : null;

  const sortedData = useMemo(() => {
    if (isServerSide) return data;
    if (!column?.sortable || !sortKey) return [...data];
    return [...data].sort((a, b) => {
      const va = column.value(a);
      const vb = column.value(b);
      const aVal = va == null ? '' : String(va);
      const bVal = vb == null ? '' : String(vb);
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, column, isServerSide]);

  const totalItems = total;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const from = (currentPage - 1) * pageSize;
  const paginatedData = useMemo(() => {
    if (isServerSide) return data;
    return sortedData.slice(from, from + pageSize);
  }, [isServerSide, data, sortedData, from, pageSize]);

  const handleSort = (colId: string) => {
    const col = columns.find((c) => c.id === colId);
    if (!col?.sortable) return;
    if (isServerSide && rest.onSortChange) {
      const nextDir = sortKey === colId && sortDir === 'asc' ? 'desc' : 'asc';
      rest.onSortChange(colId, nextDir);
      rest.onPageChange(1);
    } else {
      if (sortKey === colId) {
        setClientSortDir(clientSortDir === 'asc' ? 'desc' : 'asc');
      } else {
        setClientSortKey(colId);
        setClientSortDir('asc');
      }
      setClientPage(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (isServerSide && rest.onPageChange) rest.onPageChange(newPage);
    else setClientPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    if (isServerSide && rest.onPageSizeChange) {
      rest.onPageSizeChange(newSize);
      rest.onPageChange(1);
    } else {
      setClientPageSize(newSize);
      setClientPage(1);
    }
  };

  if (!isServerSide && data.length === 0) {
    return <p className="text-slate-600 py-6">{emptyMessage}</p>;
  }

  if (isServerSide && total === 0 && !loading) {
    return <p className="text-slate-600 py-6">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={`px-4 py-3 font-semibold ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.id)}
                      disabled={loading}
                      className="inline-flex items-center gap-1 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded disabled:opacity-50"
                    >
                      {col.label}
                      {sortKey === col.id && (
                        <span className="text-indigo-600" aria-hidden>
                          {sortDir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {renderActions && (
                <th scope="col" className="px-4 py-3 font-semibold text-right">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-4 py-8 text-center text-slate-500">
                  Cargando…
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={keyExtractor(row)} className="hover:bg-slate-50/70">
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={`px-4 py-3 text-slate-700 ${col.align === 'right' ? 'text-right' : ''}`}
                    >
                      {col.render ? col.render(row) : (col.value(row) ?? '–')}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-4 py-3 text-right">{renderActions(row)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            Filas por página
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <span>
            {totalItems === 0 ? '0' : `${from + 1}–${Math.min(from + pageSize, totalItems)}`} de {totalItems}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none"
          >
            Anterior
          </button>
          <span className="px-2">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
