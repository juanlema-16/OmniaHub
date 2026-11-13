import { useState } from 'react';
import toast from 'react-hot-toast';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { deleteBanner, listBanners, updateBanner } from '../../api/admin';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Switch from '../../components/ui/Switch';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmarModal from '../../components/admin/ConfirmarModal';
import BannerFormModal, { UBICACIONES } from '../../components/admin/BannerFormModal';
import { formatFecha } from '../../utils/dates';

// Estado real según activo y fechas de vigencia
const vigencia = (b) => {
  const ahora = Date.now();
  if (!b.activo) return { label: 'Inactivo', tone: 'slate' };
  if (b.inicio && new Date(b.inicio).getTime() > ahora) return { label: 'Programado', tone: 'sky' };
  if (b.fin && new Date(b.fin).getTime() < ahora) return { label: 'Vencido', tone: 'amber' };
  return { label: 'Visible', tone: 'green' };
};

export default function BannersPage() {
  const banners = useAsync(listBanners, []);
  const [form, setForm] = useState({ open: false, banner: null });
  const [eliminar, setEliminar] = useState(null);
  const [cambiando, setCambiando] = useState('');

  const alternarActivo = async (b, activo) => {
    setCambiando(b._id);
    try {
      const datos = new FormData();
      datos.append('activo', String(activo));
      await updateBanner(b._id, datos);
      toast.success(activo ? 'Banner activado' : 'Banner desactivado');
      banners.recargar();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCambiando('');
    }
  };

  const confirmarEliminar = async () => {
    await deleteBanner(eliminar._id);
    toast.success('Banner eliminado');
    banners.recargar();
  };

  const lista = banners.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publicidad"
        description="Banners que aparecen en la página de inicio y en el inicio de los paneles."
        actions={
          <Button icon={Plus} onClick={() => setForm({ open: true, banner: null })}>
            Nuevo banner
          </Button>
        }
      />
      {banners.error && <Alert tone="error">{banners.error}</Alert>}

      {banners.cargando && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      )}

      {!banners.cargando && !banners.error && lista.length === 0 && (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="Aún no hay banners"
            description="Crea el primero para promocionar ofertas o novedades."
            action={
              <Button icon={Plus} onClick={() => setForm({ open: true, banner: null })}>
                Nuevo banner
              </Button>
            }
          />
        </Card>
      )}

      {!banners.cargando && lista.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((b) => {
            const v = vigencia(b);
            return (
              <li key={b._id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <img src={b.imagen} alt={`Banner ${b.titulo}`} className="aspect-[3/1] w-full bg-slate-100 object-cover" />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate font-semibold text-slate-900">{b.titulo}</h2>
                      <Badge tone={v.tone} dot>
                        {v.label}
                      </Badge>
                    </div>
                    {b.subtitulo && <p className="mt-0.5 truncate text-sm text-slate-500">{b.subtitulo}</p>}
                  </div>
                  <dl className="space-y-1 text-xs text-slate-500">
                    <div className="flex gap-1.5">
                      <dt className="font-medium text-slate-600">Ubicación:</dt>
                      <dd>{b.ubicacion.map((u) => UBICACIONES[u]).join(' y ')}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="font-medium text-slate-600">Vigencia:</dt>
                      <dd>
                        {formatFecha(b.inicio)} {b.fin ? `al ${formatFecha(b.fin)}` : 'sin fecha de fin'}
                      </dd>
                    </div>
                    {b.link && (
                      <div className="flex gap-1.5">
                        <dt className="font-medium text-slate-600">Enlace:</dt>
                        <dd className="truncate">{b.link}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <Switch checked={b.activo} disabled={cambiando === b._id} onChange={(activo) => alternarActivo(b, activo)} label="Activo" />
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" icon={Pencil} onClick={() => setForm({ open: true, banner: b })} aria-label={`Editar banner ${b.titulo}`} />
                      <Button size="icon" variant="ghost" icon={Trash2} onClick={() => setEliminar(b)} aria-label={`Eliminar banner ${b.titulo}`} />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <BannerFormModal open={form.open} banner={form.banner} onClose={() => setForm((f) => ({ ...f, open: false }))} onSaved={banners.recargar} />
      <ConfirmarModal
        open={Boolean(eliminar)}
        onClose={() => setEliminar(null)}
        title="Eliminar banner"
        description={eliminar?.titulo}
        confirmLabel="Eliminar"
        variant="danger"
        icon={Trash2}
        onConfirm={confirmarEliminar}
      >
        <p className="text-sm text-slate-600">El banner y su imagen se eliminan de forma permanente.</p>
      </ConfirmarModal>
    </div>
  );
}
