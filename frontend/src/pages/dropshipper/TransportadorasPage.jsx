import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Clock, MapPin, Search, Star, X } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { deletePreference, getCarriers, getPreferences, setPreference } from '../../api/shipping';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import { DEPARTAMENTOS } from '../../utils/constants';
import { formatQ } from '../../utils/formatQ';
import { plural } from '../../utils/plural';

const sinAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function TransportadorasPage() {
  const carriers = useAsync(getCarriers, []);
  const preferencias = useAsync(getPreferences, []);
  const [buscar, setBuscar] = useState('');
  const [guardando, setGuardando] = useState('');

  const favoritas = useMemo(() => Object.fromEntries((preferencias.data || []).map((p) => [p.departamento, p.carrier?._id])), [preferencias.data]);
  const tarifa = (carrier, depto) => carrier.tarifas.find((t) => t.departamento === depto);
  const departamentos = DEPARTAMENTOS.filter((d) => sinAcentos(d).includes(sinAcentos(buscar.trim())));

  const elegir = async (departamento, carrier) => {
    setGuardando(departamento);
    try {
      await setPreference({ departamento, carrier: carrier._id });
      toast.success(`${carrier.nombre} es tu favorita para ${departamento}`);
      await preferencias.recargar();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGuardando('');
    }
  };

  const quitar = async (departamento) => {
    setGuardando(departamento);
    try {
      await deletePreference(departamento);
      toast.success(`Quitaste la favorita de ${departamento}`);
      await preferencias.recargar();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGuardando('');
    }
  };

  // Solo la primera carga muestra skeleton; al guardar, la lista se actualiza sin parpadear
  const cargando = (carriers.cargando && !carriers.data) || (preferencias.cargando && !preferencias.data);
  const lista = carriers.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Transportadoras" description="Elige tu transportadora favorita por departamento: quedará preseleccionada al crear órdenes." />
      {(carriers.error || preferencias.error) && <Alert tone="error">{carriers.error || preferencias.error}</Alert>}

      <div className="grid gap-4 md:grid-cols-2">
        {cargando && [0, 1].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        {!cargando &&
          lista.map((c) => {
            const precios = c.tarifas.map((t) => t.precio);
            const dias = c.tarifas.map((t) => t.dias);
            const usos = Object.values(favoritas).filter((id) => id === c._id).length;
            return (
              <div key={c._id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <img src={c.logo} alt="" className="h-14 w-14 rounded-xl border border-slate-200 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{c.nombre}</p>
                  <p className="text-sm text-slate-500">
                    {plural(c.tarifas.length, 'departamento')} · desde {formatQ(Math.min(...precios))} hasta {formatQ(Math.max(...precios))}
                  </p>
                  <p className="text-xs text-slate-400">
                    Entrega en {Math.min(...dias)} a {plural(Math.max(...dias), 'día', 'días')}
                  </p>
                </div>
                {usos > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> {usos}
                  </span>
                )}
              </div>
            );
          })}
      </div>

      <Card
        title="Transportadora favorita por departamento"
        description={`${plural(Object.keys(favoritas).length, 'departamento', 'departamentos')} con favorita. Donde no elijas, se preselecciona la más barata.`}
        padding={false}
      >
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar departamento"
              aria-label="Buscar departamento"
              className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
        {cargando && (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {!cargando && !departamentos.length && <EmptyState icon={MapPin} title="No hay departamentos con ese nombre" compact />}
        {!cargando && departamentos.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {departamentos.map((depto) => {
              const favorita = favoritas[depto];
              const opciones = lista.map((c) => ({ carrier: c, tarifa: tarifa(c, depto) })).filter((o) => o.tarifa);
              const masBarata = Math.min(...opciones.map((o) => o.tarifa.precio));
              return (
                <li key={depto} className={`flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center ${guardando === depto ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2 lg:w-56">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="font-medium text-slate-900">{depto}</span>
                  </div>
                  <div className="flex flex-1 flex-wrap gap-2" role="radiogroup" aria-label={`Transportadora favorita para ${depto}`}>
                    {opciones.map(({ carrier, tarifa: t }) => {
                      const activa = favorita === carrier._id;
                      return (
                        <button
                          key={carrier._id}
                          type="button"
                          role="radio"
                          aria-checked={activa}
                          disabled={Boolean(guardando)}
                          onClick={() => !activa && elegir(depto, carrier)}
                          className={`flex min-w-52 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-wait ${
                            activa ? 'border-primary bg-primary-50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${activa ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>
                            {activa && <Check className="h-3 w-3" aria-hidden="true" />}
                          </span>
                          <span className="flex-1 font-medium text-slate-800">{carrier.nombre}</span>
                          <span className="text-right">
                            <span className={`block font-semibold ${t.precio === masBarata ? 'text-success' : 'text-slate-900'}`}>{formatQ(t.precio)}</span>
                            <span className="flex items-center justify-end gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" aria-hidden="true" /> {plural(t.dias, 'día', 'días')}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="lg:w-28 lg:text-right">
                    {favorita ? (
                      <button type="button" onClick={() => quitar(depto)} disabled={Boolean(guardando)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-danger">
                        <X className="h-3.5 w-3.5" aria-hidden="true" /> Quitar favorita
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Sin favorita</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
