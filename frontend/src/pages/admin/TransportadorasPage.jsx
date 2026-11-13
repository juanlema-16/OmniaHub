import { useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Truck, Wallet } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { listCarriers, updateCarrier } from '../../api/admin';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Switch from '../../components/ui/Switch';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import ConfirmarModal from '../../components/admin/ConfirmarModal';
import CarrierEditModal from '../../components/admin/CarrierEditModal';
import TarifasModal from '../../components/admin/TarifasModal';
import { formatQ } from '../../utils/formatQ';
import { DEPARTAMENTOS } from '../../utils/constants';
import { plural } from '../../utils/plural';

export default function TransportadorasPage() {
  const carriers = useAsync(listCarriers, []);
  const [editar, setEditar] = useState(null);
  const [tarifas, setTarifas] = useState(null);
  const [desactivar, setDesactivar] = useState(null);
  const [cambiando, setCambiando] = useState('');

  const cambiarActiva = async (carrier, activa) => {
    setCambiando(carrier._id);
    try {
      await updateCarrier(carrier._id, { activa });
      toast.success(activa ? `${carrier.nombre} activada` : `${carrier.nombre} desactivada`);
      carriers.recargar();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCambiando('');
    }
  };

  const columnas = [
    {
      key: 'nombre',
      header: 'Transportadora',
      render: (c) => (
        <div className="flex items-center gap-2.5">
          {c.logo ? (
            <img src={c.logo} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <Truck className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
          <p className="font-semibold text-slate-900">{c.nombre}</p>
        </div>
      ),
    },
    {
      key: 'usuario',
      header: 'Usuario',
      render: (c) => (
        <div>
          <p className="text-slate-800">{c.user ? `${c.user.nombre} ${c.user.apellido}` : '—'}</p>
          <p className="text-xs text-slate-500">{c.user?.email}</p>
        </div>
      ),
    },
    {
      key: 'tarifas',
      header: 'Cobertura',
      render: (c) => {
        const precios = c.tarifas.map((t) => t.precio);
        return (
          <div>
            <p className="text-slate-800">
              {c.tarifas.length} de {DEPARTAMENTOS.length} departamentos
            </p>
            {precios.length > 0 && (
              <p className="text-xs text-slate-500">
                De {formatQ(Math.min(...precios))} a {formatQ(Math.max(...precios))}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (c) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={c.activa}
            disabled={cambiando === c._id}
            onChange={(activa) => (activa ? cambiarActiva(c, true) : setDesactivar(c))}
            label={<span className="sr-only">{`Transportadora ${c.nombre} activa`}</span>}
          />
          <Badge tone={c.activa ? 'green' : 'slate'}>{c.activa ? 'Activa' : 'Inactiva'}</Badge>
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" icon={Wallet} onClick={() => setTarifas(c)}>
            Tarifas
          </Button>
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditar(c)} aria-label={`Editar ${c.nombre}`}>
            Editar
          </Button>
        </div>
      ),
    },
  ];

  const total = carriers.data?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Transportadoras" description={`${plural(total, 'transportadora')} en la plataforma. Define su cobertura, tarifas y disponibilidad. Para crear una nueva, usa Usuarios.`} />
      {carriers.error && <Alert tone="error">{carriers.error}</Alert>}
      <Table
        columns={columnas}
        data={carriers.data || []}
        loading={carriers.cargando}
        emptyIcon={Truck}
        emptyTitle="Aún no hay transportadoras"
        emptyDescription="Crea un usuario con rol transportadora para empezar."
      />
      <CarrierEditModal carrier={editar} onClose={() => setEditar(null)} onSaved={carriers.recargar} />
      <TarifasModal carrier={tarifas} onClose={() => setTarifas(null)} onSaved={carriers.recargar} />
      <ConfirmarModal
        open={Boolean(desactivar)}
        onClose={() => setDesactivar(null)}
        title="Desactivar transportadora"
        description={desactivar?.nombre}
        confirmLabel="Desactivar"
        variant="danger"
        onConfirm={() => cambiarActiva(desactivar, false)}
      >
        <p className="text-sm text-slate-600">
          Dejará de aparecer en las cotizaciones y en las tiendas. Las guías que ya tiene asignadas se siguen gestionando normalmente.
        </p>
      </ConfirmarModal>
    </div>
  );
}
