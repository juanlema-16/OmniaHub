import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownLeft, ArrowUpRight, Download, Receipt, X } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { exportTransactions, listTransactions } from '../../api/wallet';
import { getErrorMessage } from '../../api/axios';
import Table from '../ui/Table';
import Select from '../ui/Select';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Alert from '../ui/Alert';
import { CONCEPTO_TRANSACCION } from '../../utils/constants';
import { formatFechaHora } from '../../utils/dates';
import { formatQ } from '../../utils/formatQ';
import { plural } from '../../utils/plural';

const FILTROS = { desde: '', hasta: '', tipo: '', concepto: '' };

export default function MovimientosTab({ role, version }) {
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [filtros, setFiltros] = useState(FILTROS);
  const [page, setPage] = useState(1);
  const [exportando, setExportando] = useState(false);

  const filtrosApi = { ...Object.fromEntries(Object.entries(filtros).filter(([, v]) => v)), search: search || undefined };
  const movimientos = useAsync(() => listTransactions({ ...filtrosApi, page, limit: 10 }), [JSON.stringify(filtrosApi), page, version]);
  const hayFiltros = Object.values(filtros).some(Boolean) || Boolean(search);

  useEffect(() => setPage(1), [filtros, search]);

  const cambiar = (e) => setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));
  const fechasInvalidas = filtros.desde && filtros.hasta && filtros.desde > filtros.hasta;

  const descargar = async () => {
    setExportando(true);
    try {
      await exportTransactions(filtrosApi);
      toast.success('Descargando tus movimientos');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportando(false);
    }
  };

  const columnas = [
    { key: 'fecha', header: 'Fecha', render: (t) => <span className="whitespace-nowrap text-slate-600">{formatFechaHora(t.createdAt)}</span> },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (t) => (
        <Badge tone={t.tipo === 'ENTRADA' ? 'green' : 'red'}>
          {t.tipo === 'ENTRADA' ? <ArrowDownLeft className="h-3 w-3" aria-hidden="true" /> : <ArrowUpRight className="h-3 w-3" aria-hidden="true" />}
          {t.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'}
        </Badge>
      ),
    },
    { key: 'concepto', header: 'Concepto', render: (t) => <span className="font-medium text-slate-800">{CONCEPTO_TRANSACCION[t.concepto] || t.concepto}</span> },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (t) => (
        <div className="max-w-xs">
          <p className="text-slate-700">{t.descripcion || '—'}</p>
          {t.order && (
            <p className="text-xs text-slate-500">
              Orden {t.order.numero}
              {t.order.guia && ` · Guía ${t.order.guia}`}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      align: 'right',
      render: (t) => (
        <span className={`whitespace-nowrap font-semibold ${t.tipo === 'ENTRADA' ? 'text-success' : 'text-danger'}`}>
          {t.tipo === 'ENTRADA' ? '+' : '−'} {formatQ(t.monto)}
        </span>
      ),
    },
    { key: 'previo', header: 'Saldo previo', align: 'right', render: (t) => <span className="whitespace-nowrap text-slate-500">{formatQ(t.saldoPrevio)}</span> },
    { key: 'nuevo', header: 'Saldo nuevo', align: 'right', render: (t) => <span className="whitespace-nowrap font-medium text-slate-900">{formatQ(t.saldoNuevo)}</span> },
  ];

  const totales = movimientos.data?.totales;

  return (
    <div className="space-y-4">
      {role === 'dropshipper' && (
        <Alert tone="info">
          <ul className="list-disc space-y-1 pl-4">
            <li>Las órdenes SIN RECAUDO solo tienen una SALIDA al crearse: costo del producto, envío y comisión de la plataforma.</li>
            <li>No generan ENTRADA al entregarse, porque el dinero ya lo cobraste a tu cliente.</li>
          </ul>
        </Alert>
      )}

      <Table
        columns={columnas}
        data={movimientos.data?.items || []}
        loading={movimientos.cargando}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por descripción, orden o guía' }}
        filters={
          <Button variant="secondary" icon={Download} loading={exportando} disabled={!movimientos.data?.total} onClick={descargar}>
            Exportar CSV
          </Button>
        }
        aboveTable={
          <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Desde" name="desde" type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={cambiar} error={fechasInvalidas ? 'La fecha inicial no puede ser mayor a la final' : undefined} />
            <Input label="Hasta" name="hasta" type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={cambiar} />
            <Select
              label="Tipo"
              name="tipo"
              value={filtros.tipo}
              onChange={cambiar}
              placeholder="Entradas y salidas"
              options={[
                { value: 'ENTRADA', label: 'Entradas' },
                { value: 'SALIDA', label: 'Salidas' },
              ]}
            />
            <Select label="Concepto" name="concepto" value={filtros.concepto} onChange={cambiar} placeholder="Todos" options={Object.entries(CONCEPTO_TRANSACCION).map(([value, label]) => ({ value, label }))} />
            {hayFiltros && (
              <button
                type="button"
                onClick={() => {
                  setFiltros(FILTROS);
                  setTexto('');
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary sm:col-span-2 lg:col-span-4"
              >
                <X className="h-4 w-4" aria-hidden="true" /> Quitar filtros
              </button>
            )}
          </div>
        }
        pagination={movimientos.data && { page: movimientos.data.page, pages: movimientos.data.pages, total: movimientos.data.total, onPageChange: setPage }}
        emptyIcon={Receipt}
        emptyTitle={hayFiltros ? 'No hay movimientos con esos filtros' : 'Aún no tienes movimientos'}
        emptyDescription={hayFiltros ? 'Prueba con otras fechas o quita los filtros.' : 'Tus entradas y salidas de dinero aparecerán aquí.'}
      />

      {movimientos.error && <Alert tone="error">{movimientos.error}</Alert>}
      {totales && movimientos.data.total > 0 && (
        <p className="text-right text-sm text-slate-600">
          {plural(movimientos.data.total, 'movimiento')}: <span className="font-semibold text-success">+ {formatQ(totales.entradas)}</span> en entradas y{' '}
          <span className="font-semibold text-danger">− {formatQ(totales.salidas)}</span> en salidas
        </p>
      )}
    </div>
  );
}
