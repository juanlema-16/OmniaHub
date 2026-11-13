import { useState } from 'react';
import { Receipt, Wallet } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { listCashSessions, listPosSales } from '../../api/pos';
import Card from '../ui/Card';
import Tabs from '../ui/Tabs';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Alert from '../ui/Alert';
import FacturaModal from '../invoices/FacturaModal';
import { estiloDiferencia } from './CerrarCajaModal';
import { formatQ } from '../../utils/formatQ';
import { formatFechaHora } from '../../utils/dates';
import { plural } from '../../utils/plural';

function Ventas({ version }) {
  const [page, setPage] = useState(1);
  const [facturaId, setFacturaId] = useState(null);
  const { data, cargando, error } = useAsync(() => listPosSales({ page, limit: 8 }), [page, version]);

  const columnas = [
    { key: 'fecha', header: 'Fecha', render: (v) => formatFechaHora(v.createdAt) },
    { key: 'factura', header: 'Factura', render: (v) => <span className="font-medium text-primary">{v.invoice?.numero || '—'}</span> },
    { key: 'cliente', header: 'Cliente', render: (v) => v.cliente?.nombre || 'Consumidor Final' },
    { key: 'items', header: 'Productos', render: (v) => plural(v.items.reduce((s, i) => s + i.cantidad, 0), 'unidad', 'unidades') },
    { key: 'metodo', header: 'Pago', render: (v) => <Badge tone={v.metodoPago === 'EFECTIVO' ? 'green' : 'sky'}>{v.metodoPago === 'EFECTIVO' ? 'Efectivo' : 'Tarjeta'}</Badge> },
    { key: 'total', header: 'Total', align: 'right', render: (v) => <span className="font-semibold text-slate-900">{formatQ(v.total)}</span> },
  ];

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}
      <Table
        bare
        columns={columnas}
        data={data?.items || []}
        loading={cargando}
        onRowClick={(v) => v.invoice?._id && setFacturaId(v.invoice._id)}
        pagination={data && { page: data.page, pages: data.pages, total: data.total, onPageChange: setPage }}
        emptyIcon={Receipt}
        emptyTitle="Aún no hay ventas en caja"
        emptyDescription="Las ventas que cobres en el POS aparecerán aquí. Toca una para ver su factura."
      />
      <FacturaModal facturaId={facturaId} onClose={() => setFacturaId(null)} />
    </>
  );
}

function Cajas({ version }) {
  const [page, setPage] = useState(1);
  const { data, cargando, error } = useAsync(() => listCashSessions({ page, limit: 8 }), [page, version]);

  const columnas = [
    { key: 'abierta', header: 'Apertura', render: (c) => formatFechaHora(c.abiertaEn) },
    { key: 'cerrada', header: 'Cierre', render: (c) => (c.cerradaEn ? formatFechaHora(c.cerradaEn) : '—') },
    { key: 'inicial', header: 'Inicial', align: 'right', render: (c) => formatQ(c.montoInicial) },
    { key: 'esperado', header: 'Esperado', align: 'right', render: (c) => (c.estado === 'CERRADA' ? formatQ(c.montoEsperado) : '—') },
    { key: 'contado', header: 'Contado', align: 'right', render: (c) => (c.estado === 'CERRADA' ? formatQ(c.montoContado) : '—') },
    {
      key: 'diferencia',
      header: 'Diferencia',
      align: 'right',
      render: (c) => {
        if (c.estado !== 'CERRADA') return '—';
        const est = estiloDiferencia(c.diferencia);
        return (
          <span className={`font-semibold ${est.texto}`} title={est.mensaje}>
            {formatQ(c.diferencia)}
          </span>
        );
      },
    },
    { key: 'estado', header: 'Estado', render: (c) => <Badge tone={c.estado === 'ABIERTA' ? 'indigo' : 'slate'}>{c.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada'}</Badge> },
  ];

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}
      <Table
        bare
        columns={columnas}
        data={data?.items || []}
        loading={cargando}
        pagination={data && { page: data.page, pages: data.pages, total: data.total, onPageChange: setPage }}
        emptyIcon={Wallet}
        emptyTitle="Aún no has abierto cajas"
        emptyDescription="Aquí verás el arqueo de cada turno."
      />
    </>
  );
}

// Ventas del POS y arqueo de las cajas anteriores
export default function HistorialPos({ version }) {
  const [tab, setTab] = useState('ventas');
  return (
    <Card title="Historial" padding={false}>
      <Tabs
        className="px-3"
        tabs={[
          { value: 'ventas', label: 'Ventas' },
          { value: 'cajas', label: 'Cajas' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'ventas' ? <Ventas version={version} /> : <Cajas version={version} />}
    </Card>
  );
}
