import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, TriangleAlert, Undo2 } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listOrders } from '../../api/orders';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import OrderQuickView from '../../components/orders/OrderQuickView';
import AccionesGuia from '../../components/transportadora/AccionesGuia';
import AccionOrdenModal from '../../components/transportadora/AccionOrdenModal';
import { formatFechaHora, formatRelativa } from '../../utils/dates';

export default function NovedadesPage() {
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [page, setPage] = useState(1);
  const [ver, setVer] = useState(null);
  const [devolver, setDevolver] = useState(null);
  const consulta = { novedad: true, search: search || undefined, page, limit: 10 };
  const novedades = useAsync(() => listOrders(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [search]);

  const columnas = [
    {
      key: 'guia',
      header: 'Guía',
      render: (o) => (
        <div>
          <p className="font-semibold text-slate-900">{o.guia}</p>
          <p className="text-xs text-slate-500">{o.numero}</p>
        </div>
      ),
    },
    {
      key: 'fecha',
      header: 'Reportada',
      render: (o) => (
        <div>
          <p className="text-slate-800">{formatRelativa(o.novedad.reportadaEn)}</p>
          <p className="text-xs text-slate-500">{formatFechaHora(o.novedad.reportadaEn)}</p>
        </div>
      ),
    },
    {
      key: 'motivo',
      header: 'Motivo',
      render: (o) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-orange-700">
          <TriangleAlert className="h-4 w-4" aria-hidden="true" /> {o.novedad.motivo}
        </span>
      ),
    },
    {
      key: 'solucion',
      header: 'Solución del dropshipper',
      render: (o) => <span className="text-slate-500">{o.novedad.solucion || 'Esperando respuesta'}</span>,
    },
    {
      key: 'cliente',
      header: 'Destinatario',
      render: (o) => (
        <div className="max-w-64">
          <p className="text-slate-800">
            {o.cliente.nombres} {o.cliente.apellidos} · {o.cliente.telefono}
          </p>
          <p className="truncate text-xs text-slate-500">
            {o.destino.direccion}, {o.destino.municipio}, {o.destino.departamento}
          </p>
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (o) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" icon={Eye} onClick={() => setVer(o._id)} aria-label={`Ver detalle de ${o.numero}`}>
            Ver
          </Button>
          <Button size="sm" variant="secondary" icon={Undo2} onClick={() => setDevolver(o)}>
            Devolución
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Novedades" description="Entregas con problemas. Cuando el dropshipper responde, la guía vuelve sola a En tránsito para reintentar la entrega." />
      <Alert tone="info">
        Si el dropshipper no puede resolver la novedad, envía la guía a devolución y el paquete regresa a la bodega del proveedor.
      </Alert>
      {novedades.error && <Alert tone="error">{novedades.error}</Alert>}
      <Table
        columns={columnas}
        data={novedades.data?.items || []}
        loading={novedades.cargando}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por orden, guía o teléfono' }}
        pagination={novedades.data && { page: novedades.data.page, pages: novedades.data.pages, total: novedades.data.total, onPageChange: setPage }}
        emptyIcon={CheckCircle2}
        emptyTitle={search ? 'No hay novedades con esa búsqueda' : 'No tienes novedades activas'}
        emptyDescription={search ? 'Prueba con otro número de guía o teléfono.' : 'Las guías con problemas de entrega aparecerán aquí.'}
      />

      <OrderQuickView
        orderId={ver}
        onClose={() => setVer(null)}
        renderAcciones={(orden, { recargar }) => (
          <AccionesGuia
            orden={orden}
            onChange={() => {
              recargar();
              novedades.recargar();
            }}
          />
        )}
      />
      <AccionOrdenModal orden={devolver} accion="DEVOLUCION" onClose={() => setDevolver(null)} onDone={novedades.recargar} />
    </div>
  );
}
