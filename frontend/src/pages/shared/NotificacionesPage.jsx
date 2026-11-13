import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOff, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import useAsync from '../../hooks/useAsync';
import * as notificationsApi from '../../api/notifications';
import { getErrorMessage } from '../../api/axios';
import { rutaDisponible } from '../../routes/panelConfig';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import Alert from '../../components/ui/Alert';
import { NOTIFICATION_TONE } from '../../utils/constants';
import { formatFechaHora, formatRelativa } from '../../utils/dates';
import { plural } from '../../utils/plural';

const TIPO_LABEL = { ORDEN: 'Orden', NOVEDAD: 'Novedad', KYC: 'Verificación', BILLETERA: 'Billetera', SISTEMA: 'Sistema' };

export default function NotificacionesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('todas');
  const [page, setPage] = useState(1);
  const params = { page, limit: 10, ...(filtro === 'sin-leer' ? { leida: false } : {}) };
  const { data, setData, cargando, error, recargar } = useAsync(() => notificationsApi.listNotifications(params), [filtro, page]);

  const marcar = async (n) => {
    try {
      if (!n.leida) {
        await notificationsApi.markRead(n._id);
        setData((d) => ({ ...d, noLeidas: Math.max(0, d.noLeidas - 1), items: d.items.map((x) => (x._id === n._id ? { ...x, leida: true } : x)) }));
      }
      if (rutaDisponible(user.role, n.link)) navigate(n.link);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const marcarTodas = async () => {
    try {
      const { marcadas } = await notificationsApi.markAllRead();
      toast.success(marcadas ? `${plural(marcadas, 'notificación marcada', 'notificaciones marcadas')} como leída${marcadas === 1 ? '' : 's'}` : 'No tenías notificaciones sin leer');
      recargar();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        description="Avisos de tus órdenes, billetera y cuenta."
        actions={
          data?.noLeidas > 0 && (
            <Button variant="secondary" icon={CheckCheck} onClick={marcarTodas}>
              Marcar todas como leídas
            </Button>
          )
        }
      />
      <Tabs
        className="mb-4"
        value={filtro}
        onChange={(v) => {
          setFiltro(v);
          setPage(1);
        }}
        tabs={[
          { value: 'todas', label: 'Todas' },
          { value: 'sin-leer', label: 'Sin leer', count: data?.noLeidas ?? undefined },
        ]}
      />
      {error && <Alert tone="error">{error}</Alert>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {cargando && (
          <ul className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="space-y-2 p-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-3/4" />
              </li>
            ))}
          </ul>
        )}
        {!cargando && data?.items.length === 0 && (
          <EmptyState icon={BellOff} title={filtro === 'sin-leer' ? 'Estás al día' : 'No tienes notificaciones'} description="Aquí verás los avisos de tus órdenes, pagos y cuenta." />
        )}
        {!cargando && data?.items.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {data.items.map((n) => (
              <li key={n._id}>
                <button type="button" onClick={() => marcar(n)} className={`flex w-full flex-col gap-2 p-4 text-left hover:bg-slate-50 sm:flex-row sm:items-start ${n.leida ? '' : 'bg-primary-50/40'}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm ${n.leida ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{n.titulo}</p>
                      <Badge tone={NOTIFICATION_TONE[n.tipo]}>{TIPO_LABEL[n.tipo]}</Badge>
                      {!n.leida && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Sin leer" />}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{n.mensaje}</p>
                  </div>
                  <time className="shrink-0 text-xs text-slate-400" dateTime={n.createdAt} title={formatFechaHora(n.createdAt)}>
                    {formatRelativa(n.createdAt)}
                  </time>
                </button>
              </li>
            ))}
          </ul>
        )}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <span>
              Página {data.page} de {data.pages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
