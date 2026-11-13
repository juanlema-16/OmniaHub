import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import { listTopUps, listWithdrawals } from '../../api/admin';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import SolicitudesTabla from '../../components/admin/SolicitudesTabla';

export default function SolicitudesPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'retiros' ? 'retiros' : 'recargas';
  const [version, setVersion] = useState(0);

  // Pendientes de cada pestaña (limit 1: solo interesa el total)
  const pendientes = useAsync(async () => {
    const [recargas, retiros] = await Promise.all([listTopUps({ estado: 'PENDIENTE', limit: 1 }), listWithdrawals({ estado: 'PENDIENTE', limit: 1 })]);
    return { recargas: recargas.total, retiros: retiros.total };
  }, [version]);

  const tabs = [
    { value: 'recargas', label: 'Recargas', count: pendientes.data?.recargas },
    { value: 'retiros', label: 'Retiros', count: pendientes.data?.retiros },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Recargas y retiros" description="Aprueba o rechaza los movimientos de dinero que piden los usuarios. El número de cada pestaña son las solicitudes pendientes." />
      <Tabs tabs={tabs} value={tab} onChange={(value) => setParams({ tab: value }, { replace: true })} />
      <SolicitudesTabla key={tab} tipo={tab === 'recargas' ? 'recarga' : 'retiro'} version={version} onChange={() => setVersion((v) => v + 1)} />
    </div>
  );
}
