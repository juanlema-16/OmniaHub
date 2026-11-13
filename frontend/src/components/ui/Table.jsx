import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

// columns: [{ key, header, render?: (row) => node, className?, align?: 'right' | 'center' }]
// pagination: { page, pages, total, limit?, onPageChange }
// search: { value, onChange, placeholder } · aboveTable: panel opcional entre la barra y la tabla (filtros avanzados)
export default function Table({
  columns,
  data = [],
  loading = false,
  rowKey = '_id',
  onRowClick,
  search,
  filters,
  pagination,
  emptyTitle = 'No hay resultados',
  emptyDescription,
  emptyIcon,
  skeletonRows = 5,
  bare = false,
  aboveTable,
}) {
  const alinear = (c) => (c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left');

  // bare: sin borde ni sombra propios, para usarla dentro de un Card
  return (
    <div className={`overflow-hidden bg-white ${bare ? 'rounded-b-xl' : 'rounded-xl border border-slate-200 shadow-sm'}`}>
      {(search || filters) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          {search && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder || 'Buscar…'}
                aria-label={search.placeholder || 'Buscar'}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          )}
          {filters && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{filters}</div>}
        </div>
      )}
      {aboveTable}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${alinear(c)} ${c.className || ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading &&
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full max-w-[10rem]" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading &&
              data.map((row) => (
                <tr
                  key={row[rowKey]}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer transition-colors hover:bg-slate-50' : ''}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={`whitespace-nowrap px-4 py-3 text-slate-700 ${alinear(c)} ${c.className || ''}`}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && data.length === 0 && <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} compact />}
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <span>
            Página <strong className="text-slate-900">{pagination.page}</strong> de {pagination.pages} · {pagination.total} resultado
            {pagination.total === 1 ? '' : 's'}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="rounded-lg border border-slate-300 p-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages || loading}
              className="rounded-lg border border-slate-300 p-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
