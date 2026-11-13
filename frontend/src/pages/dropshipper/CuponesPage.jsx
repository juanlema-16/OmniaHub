import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Ticket, Trash2 } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { createCoupon, listCoupons, removeCoupon, updateCoupon } from '../../api/coupons';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import { formatQ } from '../../utils/formatQ';
import { formatFecha, isoDate } from '../../utils/dates';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const ESTADOS = {
  VIGENTE: { label: 'Vigente', tone: 'green' },
  VENCIDO: { label: 'Vencido', tone: 'red' },
  AGOTADO: { label: 'Agotado', tone: 'amber' },
  INACTIVO: { label: 'Inactivo', tone: 'slate' },
};

const VACIO = { codigo: '', tipo: 'PORCENTAJE', valor: '', minimoCompra: '0', usosMaximos: '', venceEn: '', activo: true };

const esquema = (tipo) => ({
  codigo: [reglas.requerido('El código'), (v) => (v && !/^[A-Za-z0-9]{3,20}$/.test(v.trim()) ? 'De 3 a 20 letras o números, sin espacios' : null)],
  valor: [reglas.requerido('El valor'), reglas.positivo('El valor'), (v) => (tipo === 'PORCENTAJE' && Number(v) > 100 ? 'El porcentaje no puede ser mayor a 100' : null)],
  minimoCompra: [(v) => (v !== '' && Number(v) < 0 ? 'La compra mínima no puede ser negativa' : null)],
  usosMaximos: [(v) => (v !== '' && !(Number.isInteger(Number(v)) && Number(v) >= 1) ? 'Debe ser un número entero mayor a 0' : null)],
  venceEn: [(v) => (v && v <= isoDate() ? 'La fecha debe ser posterior a hoy' : null)],
});

function CuponModal({ cupon, onClose, onSaved }) {
  const editando = Boolean(cupon?._id);
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cupon) return;
    setForm(
      editando
        ? {
            codigo: cupon.codigo,
            tipo: cupon.tipo,
            valor: String(cupon.valor),
            minimoCompra: String(cupon.minimoCompra ?? 0),
            usosMaximos: cupon.usosMaximos ? String(cupon.usosMaximos) : '',
            venceEn: cupon.venceEn ? isoDate(cupon.venceEn) : '',
            activo: cupon.activo,
          }
        : VACIO
    );
    setErrores({});
    setError('');
  }, [cupon, editando]);

  if (!cupon) return null;
  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'codigo' ? value.toUpperCase().replace(/\s/g, '') : value }));
    setErrores((er) => ({ ...er, [name]: undefined }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    const encontrados = validar(esquema(form.tipo), form);
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;
    const body = {
      codigo: form.codigo.trim(),
      tipo: form.tipo,
      valor: Number(form.valor),
      minimoCompra: Number(form.minimoCompra || 0),
      usosMaximos: form.usosMaximos ? Number(form.usosMaximos) : null,
      venceEn: form.venceEn ? new Date(`${form.venceEn}T23:59:59-06:00`).toISOString() : null,
      activo: form.activo,
    };
    setEnviando(true);
    try {
      const guardado = editando ? await updateCoupon(cupon._id, body) : await createCoupon(body);
      toast.success(editando ? `Cupón ${guardado.codigo} actualizado` : `Cupón ${guardado.codigo} creado`);
      onSaved();
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
      title={editando ? `Editar cupón ${cupon.codigo}` : 'Nuevo cupón'}
      description="El descuento se aplica en el checkout de tu tienda y sale de tu ganancia."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-cupon" loading={enviando}>
            {editando ? 'Guardar cambios' : 'Crear cupón'}
          </Button>
        </>
      }
    >
      <form id="form-cupon" onSubmit={guardar} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Input label="Código" name="codigo" icon={Ticket} value={form.codigo} onChange={cambiar} error={errores.codigo} maxLength={20} placeholder="Ej. VERANO15" hint="Tus clientes lo escriben en el checkout" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tipo"
            name="tipo"
            value={form.tipo}
            onChange={cambiar}
            options={[
              { value: 'PORCENTAJE', label: 'Porcentaje (%)' },
              { value: 'FIJO', label: 'Monto fijo (Q)' },
            ]}
            required
          />
          <Input label="Valor" name="valor" type="number" min="0" step="0.01" prefix={form.tipo === 'PORCENTAJE' ? '%' : 'Q'} value={form.valor} onChange={cambiar} error={errores.valor} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Compra mínima" name="minimoCompra" type="number" min="0" step="0.01" prefix="Q" value={form.minimoCompra} onChange={cambiar} error={errores.minimoCompra} />
          <Input label="Usos máximos" name="usosMaximos" type="number" min="1" step="1" value={form.usosMaximos} onChange={cambiar} error={errores.usosMaximos} placeholder="Sin límite" />
        </div>
        <Input label="Vence el" name="venceEn" type="date" min={isoDate(Date.now() + 86_400_000)} value={form.venceEn} onChange={cambiar} error={errores.venceEn} hint="Déjalo vacío para que no venza" />
        <Switch checked={form.activo} onChange={(v) => setForm((f) => ({ ...f, activo: v }))} label="Cupón activo" />
      </form>
    </Modal>
  );
}

export default function CuponesPage() {
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 350);
  const [page, setPage] = useState(1);
  const [editar, setEditar] = useState(null);
  const [eliminar, setEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const consulta = { search: search || undefined, page, limit: 10 };
  const cupones = useAsync(() => listCoupons(consulta), [JSON.stringify(consulta)]);

  useEffect(() => setPage(1), [search]);

  const alternar = async (c) => {
    try {
      await updateCoupon(c._id, { activo: !c.activo });
      toast.success(c.activo ? `Cupón ${c.codigo} desactivado` : `Cupón ${c.codigo} activado`);
      cupones.recargar();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const confirmarEliminar = async () => {
    setEliminando(true);
    try {
      const res = await removeCoupon(eliminar._id);
      toast.success(res.message);
      setEliminar(null);
      cupones.recargar();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEliminando(false);
    }
  };

  const columnas = [
    { key: 'codigo', header: 'Código', render: (c) => <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-sm font-semibold text-slate-900">{c.codigo}</span> },
    { key: 'valor', header: 'Descuento', render: (c) => <span className="font-semibold text-slate-900">{c.tipo === 'PORCENTAJE' ? `${c.valor}%` : formatQ(c.valor)}</span> },
    { key: 'minimo', header: 'Compra mínima', render: (c) => (c.minimoCompra ? formatQ(c.minimoCompra) : 'Sin mínimo') },
    { key: 'usos', header: 'Usos', render: (c) => `${c.usos} / ${c.usosMaximos ?? '∞'}` },
    { key: 'vence', header: 'Vence', render: (c) => (c.venceEn ? formatFecha(c.venceEn) : 'No vence') },
    { key: 'estado', header: 'Estado', render: (c) => <Badge tone={ESTADOS[c.estadoActual].tone} dot>{ESTADOS[c.estadoActual].label}</Badge> },
    { key: 'activo', header: 'Activo', align: 'center', render: (c) => <Switch checked={c.activo} onChange={() => alternar(c)} label={<span className="sr-only">Activar {c.codigo}</span>} /> },
    {
      key: 'acciones',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => setEditar(c)} aria-label={`Editar ${c.codigo}`}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEliminar(c)} aria-label={`Eliminar ${c.codigo}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cupones"
        description="Descuentos para los clientes de tu tienda en línea."
        actions={
          <Button icon={Plus} onClick={() => setEditar({})}>
            Nuevo cupón
          </Button>
        }
      />
      {cupones.error && <Alert tone="error">{cupones.error}</Alert>}
      <Table
        columns={columnas}
        data={cupones.data?.items || []}
        loading={cupones.cargando}
        search={{ value: texto, onChange: setTexto, placeholder: 'Buscar por código' }}
        pagination={cupones.data && { page: cupones.data.page, pages: cupones.data.pages, total: cupones.data.total, onPageChange: setPage }}
        emptyIcon={Ticket}
        emptyTitle={search ? 'No hay cupones con ese código' : 'Aún no tienes cupones'}
        emptyDescription={search ? undefined : 'Crea uno para atraer a tus clientes con un descuento.'}
      />
      <CuponModal cupon={editar} onClose={() => setEditar(null)} onSaved={cupones.recargar} />
      <Modal
        open={Boolean(eliminar)}
        onClose={() => setEliminar(null)}
        size="sm"
        title={`¿Eliminar el cupón ${eliminar?.codigo ?? ''}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEliminar(null)} disabled={eliminando}>
              Cancelar
            </Button>
            <Button variant="danger" icon={Trash2} loading={eliminando} onClick={confirmarEliminar}>
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">{eliminar?.usos ? 'Este cupón ya se usó en órdenes, así que se desactivará en lugar de borrarse.' : 'El cupón se borrará y ya no se podrá usar en tu tienda.'}</p>
      </Modal>
    </div>
  );
}
