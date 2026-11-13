import { Link } from 'react-router-dom';
import { Building2, CalendarDays, Copy, ExternalLink, Mail, Phone, ShieldCheck, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Badge, { KycBadge } from '../../components/ui/Badge';
import { ROLES, necesitaKyc } from '../../utils/constants';
import { formatFecha } from '../../utils/dates';
import { formatQ } from '../../utils/formatQ';

const Fila = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3 py-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-slate-800">{children}</dd>
    </div>
  </div>
);

export default function PerfilPage() {
  const { user, wallet } = useAuth();
  const linkTienda = user.tienda?.slug ? `${window.location.origin}/tienda/${user.tienda.slug}` : null;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(linkTienda);
      toast.success('Link de tu tienda copiado');
    } catch {
      toast.error('No se pudo copiar el link');
    }
  };

  return (
    <div>
      <PageHeader title="Mi perfil" description="Los datos de tu cuenta en OmniaHub." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar nombre={user.nombre} apellido={user.apellido} src={user.avatar} size="lg" />
            <p className="mt-3 text-lg font-semibold text-slate-900">
              {user.nombre} {user.apellido}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Badge tone="indigo">{ROLES[user.role]?.label}</Badge>
              <Badge tone={user.accountStatus === 'activo' ? 'green' : 'red'}>{user.accountStatus === 'activo' ? 'Cuenta activa' : 'Cuenta bloqueada'}</Badge>
            </div>
            {wallet && (
              <div className="mt-5 w-full rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Saldo disponible</p>
                <p className="text-xl font-bold text-slate-900">{formatQ(wallet.saldoDisponible)}</p>
                {wallet.saldoReservado > 0 && <p className="text-xs text-slate-500">Reservado por retiros: {formatQ(wallet.saldoReservado)}</p>}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Datos de contacto">
            <dl className="divide-y divide-slate-100">
              <Fila icon={Mail} label="Correo">
                {user.email}
              </Fila>
              <Fila icon={Phone} label="Teléfono">
                +502 {user.telefono?.replace(/(\d{4})(\d{4})/, '$1 $2')}
              </Fila>
              <Fila icon={CalendarDays} label="Miembro desde">
                {formatFecha(user.createdAt)}
              </Fila>
            </dl>
          </Card>

          {user.tienda?.nombre && (
            <Card title="Mi tienda en línea">
              <dl className="divide-y divide-slate-100">
                <Fila icon={Store} label="Nombre">
                  {user.tienda.nombre}
                </Fila>
                <Fila icon={ExternalLink} label="Link público">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs">{linkTienda}</span>
                    <button type="button" onClick={copiar} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover">
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </button>
                  </span>
                </Fila>
              </dl>
            </Card>
          )}

          {user.empresa?.nombre && (
            <Card title="Empresa">
              <dl className="divide-y divide-slate-100">
                <Fila icon={Building2} label="Nombre">
                  {user.empresa.nombre}
                </Fila>
                {user.empresa.nit && (
                  <Fila icon={Building2} label="NIT">
                    {user.empresa.nit}
                  </Fila>
                )}
                {user.empresa.bodega && (
                  <Fila icon={Building2} label="Bodega">
                    {user.empresa.bodega}
                  </Fila>
                )}
              </dl>
            </Card>
          )}

          {necesitaKyc(user.role) && (
            <Card
              title="Verificación de identidad"
              actions={
                <Link to={`/${user.role}/kyc`} className="text-sm font-medium text-primary hover:text-primary-hover">
                  Ver detalle
                </Link>
              }
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <KycBadge status={user.kyc?.status} />
                {user.kyc?.revisadoEn && <span className="text-sm text-slate-500">Revisado el {formatFecha(user.kyc.revisadoEn)}</span>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
