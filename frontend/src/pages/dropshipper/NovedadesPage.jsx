import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Eye, MapPin, Phone, TriangleAlert, Wrench } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listOrders, solveNovedad } from '../../api/orders';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import OrderQuickView from '../../components/orders/OrderQuickView';
import { formatFechaHora, formatRelativa } from '../../utils/dates';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const SOLUCIONES = ['Volver a visitar al cliente', 'El cliente confirmó su dirección', 'Entregar en otro horario', 'Coordinar por teléfono antes de llegar'];

const ESQUEMA = {
  solucion: [reglas.requerido('La solución', 'a'), reglas.minimo('La solución', 5)],
  direccion: [reglas.minimo('La dirección', 5)],
  telefono: [reglas.telefono],
};

function SolucionarModal({ orden, onClose, onSolved }) {
  const [form, setForm] = useState({ solucion: '', direccion: '', referencias: '', telefono: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setForm({ solucion: '', direccion: '', referencias: '', telefono: '' });
    setErrores({});
    setError('');
  }, [orden]);

  if (!orden) return null;
  const cambiar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrores((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(ESQUEMA, form);
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      await solveNovedad(orden._id, {
        solucion: form.solucion.trim(),
        direccion: form.direccion.trim() || undefined,
        referencias: form.referencias.trim() || undefined,
        telefono: form.telefono.replace(/[\s-]/g, '') || undefined,
      });
      toast.success(`Novedad de ${orden.numero} solucionada: la orden vuelve a tránsito`);
      onSolved();
      onClose();
    } catch (err) {
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Solucionar novedad · ${orden.numero}`}
      description="La transportadora recibirá tu solución y volverá a intentar la entrega."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-novedad" icon={CheckCircle2} loading={enviando}>
            Enviar solución
          </Button>
        </>
      }
    >
      <form id="form-novedad" onSubmit={enviar} className="space-y-4" noValidate>
        <Alert tone="warning" title={orden.novedad.motivo}>
          Reportada {formatRelativa(orden.novedad.reportadaEn)} por {orden.transportadora?.nombre}.
        </Alert>
        {error && <Alert tone="error">{error}</Alert>}
        <div>
          <Textarea label="Solución" name="solucion" value={form.solucion} onChange={cambiar} error={errores.solucion} maxLength={300} placeholder="Cuéntale a la transportadora qué hacer" required />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SOLUCIONES.map((s) => (
              <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, solucion: s }))} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-primary hover:text-primary">
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="mb-3 text-xs text-slate-500">
            Dirección actual: <strong className="text-slate-700">{orden.destino.direccion}, {orden.destino.municipio}</strong>. Llena solo lo que cambie.
          </p>
          <div className="space-y-3">
            <Input label="Nueva dirección" name="direccion" icon={MapPin} value={form.direccion} onChange={cambiar} error={errores.direccion} placeholder="Opcional" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Referencias" name="referencias" value={form.referencias} onChange={cambiar} placeholder="Opcional" />
              <Input label="Nuevo teléfono" name="telefono" type="tel" inputMode="numeric" maxLength={9} icon={Phone} value={form.telefono} onChange={cambiar} error={errores.telefono} placeholder="Opcional" />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function NovedadesPage() {
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [page, setPage] = useState(1);
  const [solucionar, setSolucionar] = useState(null);
  const [ver, setVer] = useState(null);
  const consulta = { novedad: true, search: search || undefined, page, limit: 10 };
  const novedades = useAsync(() => listOrders(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [search]);

  const columnas = [
    {
      key: 'numero',
      header: 'Orden',
      render: (o) => (
        <div>
          <p className="font-semibold text-slate-900">{o.numero}</p>
          <p className="text-xs text-slate-500">{o.guia}</p>
        </div>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha de novedad',
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
      key: 'datos',
      header: 'Cliente y dirección',
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
    { key: 'transportadora', header: 'Transportadora', render: (o) => o.transportadora?.nombre },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (o) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" icon={Eye} onClick={() => setVer(o._id)} aria-label={`Ver detalle de ${o.numero}`}>
            Ver
          </Button>
          <Button size="sm" icon={Wrench} onClick={() => setSolucionar(o)}>
            Solucionar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Novedades" description="Pedidos que la transportadora no pudo entregar. Soluciónalos para que vuelvan a ruta." />
      {novedades.error && <Alert tone="error">{novedades.error}</Alert>}
      <Table
        columns={columnas}
        data={novedades.data?.items || []}
        loading={novedades.cargando}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por orden, guía o teléfono' }}
        pagination={novedades.data && { page: novedades.data.page, pages: novedades.data.pages, total: novedades.data.total, onPageChange: setPage }}
        emptyIcon={CheckCircle2}
        emptyTitle={search ? 'No hay novedades con esa búsqueda' : 'No tienes novedades pendientes'}
        emptyDescription={search ? 'Prueba con otro número de orden o teléfono.' : 'Cuando una entrega tenga un problema aparecerá aquí.'}
      />
      <SolucionarModal orden={solucionar} onClose={() => setSolucionar(null)} onSolved={novedades.recargar} />
      <OrderQuickView orderId={ver} onClose={() => setVer(null)} />
    </div>
  );
}
