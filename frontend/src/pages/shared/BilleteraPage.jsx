import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Clock, Plus, Wallet } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { getWallet } from '../../api/wallet';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import MovimientosTab from '../../components/wallet/MovimientosTab';
import RecargasTab from '../../components/wallet/RecargasTab';
import RetirosTab from '../../components/wallet/RetirosTab';
import CuentasTab from '../../components/wallet/CuentasTab';
import RecargaModal from '../../components/wallet/RecargaModal';
import { formatQ } from '../../utils/formatQ';
import { plural } from '../../utils/plural';

// Billetera compartida por proveedor, dropshipper, transportadora y admin.
// El admin solo ve su saldo y sus movimientos: aprueba recargas y retiros desde su propio módulo.
export default function BilleteraPage() {
  const { user, refresh } = useAuth();
  const [params, setParams] = useSearchParams();
  const [version, setVersion] = useState(0);
  const [recargar, setRecargar] = useState(false);
  const esAdmin = user.role === 'admin';

  const { data: resumen, cargando, error } = useAsync(getWallet, [version]);

  const alCambiar = () => {
    setVersion((v) => v + 1);
    refresh();
  };

  const tabs = [
    { value: 'movimientos', label: 'Movimientos' },
    ...(esAdmin
      ? []
      : [
          { value: 'recargas', label: 'Recargas', count: resumen?.recargasPendientes.cantidad || undefined },
          { value: 'retiros', label: 'Retiros', count: resumen?.retirosPendientes || undefined },
          { value: 'cuentas', label: 'Datos bancarios' },
        ]),
  ];
  const pedida = params.get('tab');
  const tab = tabs.some((t) => t.value === pedida) ? pedida : 'movimientos';
  const irA = (valor) => setParams(valor === 'movimientos' ? {} : { tab: valor }, { replace: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billetera"
        description={esAdmin ? 'Las comisiones de la plataforma y todos tus movimientos.' : 'Tu dinero disponible, tus recargas, retiros y cuentas bancarias.'}
        actions={
          !esAdmin && (
            <Button icon={Plus} onClick={() => setRecargar(true)}>
              Recargar saldo
            </Button>
          )
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo disponible" value={formatQ(resumen?.saldoDisponible)} icon={Wallet} tone="green" loading={cargando && !resumen} hint={esAdmin ? "Comisiones acumuladas de la plataforma" : "Lo que puedes usar o retirar ahora"} />
        <StatCard
          label="Saldo reservado"
          value={formatQ(resumen?.saldoReservado)}
          icon={Clock}
          tone="amber"
          loading={cargando && !resumen}
          hint={resumen?.retirosPendientes ? `En ${plural(resumen.retirosPendientes, 'retiro pendiente', 'retiros pendientes')}` : 'Sin retiros pendientes'}
        />
        <StatCard label="Total de entradas" value={formatQ(resumen?.totalEntradas)} icon={ArrowDownLeft} tone="sky" loading={cargando && !resumen} hint={esAdmin ? "Comisiones recibidas" : "Dinero que ha llegado a tu billetera"} />
        <StatCard label="Total de salidas" value={formatQ(resumen?.totalSalidas)} icon={ArrowUpRight} tone="red" loading={cargando && !resumen} hint="Dinero que ha salido de tu billetera" />
      </div>

      <Tabs tabs={tabs} value={tab} onChange={irA} />

      {tab === 'movimientos' && <MovimientosTab role={user.role} version={version} />}
      {tab === 'recargas' && <RecargasTab version={version} onRecargar={() => setRecargar(true)} />}
      {tab === 'retiros' && <RetirosTab role={user.role} resumen={resumen} version={version} onChange={alCambiar} onIrACuentas={() => irA('cuentas')} />}
      {tab === 'cuentas' && <CuentasTab version={version} onChange={alCambiar} />}

      {!esAdmin && <RecargaModal open={recargar} onClose={() => setRecargar(false)} onCreated={() => { alCambiar(); irA('recargas'); }} />}
    </div>
  );
}
