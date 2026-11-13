import { useState } from 'react';
import { Banknote, CreditCard, Lock, Receipt, Wallet } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getCurrentCash } from '../../api/pos';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import AbrirCajaCard from '../../components/proveedor/AbrirCajaCard';
import CerrarCajaModal from '../../components/proveedor/CerrarCajaModal';
import PosProductos from '../../components/proveedor/PosProductos';
import PosCarrito from '../../components/proveedor/PosCarrito';
import FacturaModal from '../../components/invoices/FacturaModal';
import HistorialPos from '../../components/proveedor/HistorialPos';
import { formatQ } from '../../utils/formatQ';
import { formatFechaHora } from '../../utils/dates';
import { plural } from '../../utils/plural';

export default function PosPage() {
  const actual = useAsync(getCurrentCash, []);
  const [carrito, setCarrito] = useState([]);
  const [version, setVersion] = useState(0);
  const [facturaId, setFacturaId] = useState(null);
  const [cerrando, setCerrando] = useState(false);

  const caja = actual.data?.caja;
  const resumen = actual.data?.resumen;
  const enCarrito = Object.fromEntries(carrito.map((i) => [i.product._id, i.cantidad]));

  const agregar = (p) =>
    setCarrito((items) => {
      const existe = items.find((i) => i.product._id === p._id);
      if (!existe) return [...items, { product: p, cantidad: 1 }];
      return items.map((i) => (i.product._id === p._id ? { ...i, cantidad: Math.min(p.stock, i.cantidad + 1) } : i));
    });

  const alVender = (venta) => {
    setCarrito([]);
    setVersion((v) => v + 1);
    actual.recargar();
    if (venta.invoice?._id) setFacturaId(venta.invoice._id);
  };

  const alCerrar = () => {
    setCerrando(false);
    setCarrito([]);
    setVersion((v) => v + 1);
    actual.recargar();
  };

  const acciones = caja && (
    <Button variant="secondary" icon={Lock} onClick={() => setCerrando(true)}>
      Cerrar caja
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Caja y POS" description="Vende en tu punto físico, cobra y genera la factura al instante." actions={acciones} />

      {actual.error && <Alert tone="error">{actual.error}</Alert>}
      {actual.cargando && !actual.data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {actual.data && !caja && <AbrirCajaCard onOpened={actual.recargar} />}

      {caja && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ventas del turno" value={resumen?.ventas ?? 0} icon={Receipt} tone="indigo" hint={`Abierta ${formatFechaHora(caja.abiertaEn)}`} />
            <StatCard label="Total vendido" value={formatQ(resumen?.totalVendido)} icon={Wallet} tone="green" hint={`Monto inicial ${formatQ(caja.montoInicial)}`} />
            <StatCard label="En efectivo" value={formatQ(resumen?.totalEfectivo)} icon={Banknote} tone="sky" hint={plural(resumen?.ventas ?? 0, 'venta')} />
            <StatCard label="Monto esperado en caja" value={formatQ(resumen?.montoEsperado)} icon={CreditCard} tone="amber" hint={`Tarjeta: ${formatQ(resumen?.totalTarjeta)}`} />
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <PosProductos enCarrito={enCarrito} onAdd={agregar} version={version} />
            </div>
            <div className="xl:col-span-2">
              <PosCarrito items={carrito} onChange={setCarrito} onSold={alVender} />
            </div>
          </div>
        </>
      )}

      {actual.data && <HistorialPos version={version} />}

      <FacturaModal facturaId={facturaId} onClose={() => setFacturaId(null)} />
      <CerrarCajaModal open={cerrando} caja={caja} resumen={resumen} onClose={() => setCerrando(false)} onClosed={alCerrar} />
    </div>
  );
}
