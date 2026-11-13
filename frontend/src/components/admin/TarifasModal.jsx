import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { updateTarifas } from '../../api/admin';
import { getErrorMessage } from '../../api/axios';
import { DEPARTAMENTOS } from '../../utils/constants';

const INPUT = 'h-9 w-full rounded-lg border bg-white px-2.5 text-sm focus:outline-none focus:ring-2';
const claseCampo = (error) => `${INPUT} ${error ? 'border-danger focus:border-danger focus:ring-red-100' : 'border-slate-300 focus:border-primary focus:ring-primary-100'}`;

const aFilas = (carrier) => {
  const porDepto = new Map(carrier.tarifas.map((t) => [t.departamento, t]));
  return Object.fromEntries(DEPARTAMENTOS.map((d) => [d, { precio: porDepto.get(d)?.precio ?? '', dias: porDepto.get(d)?.dias ?? '' }]));
};

const validarFila = ({ precio, dias }) => {
  const errores = {};
  if (precio === '' && dias === '') return errores;
  if (precio === '' || !(Number(precio) > 0)) errores.precio = 'Mayor a 0';
  else if (Number(precio) > 5000) errores.precio = 'Máx. Q 5,000';
  if (dias === '' || !Number.isInteger(Number(dias)) || Number(dias) < 1 || Number(dias) > 30) errores.dias = 'De 1 a 30';
  return errores;
};

// Editor de las tarifas por departamento (precio y días estimados) de una transportadora
export default function TarifasModal({ carrier, onClose, onSaved }) {
  const [filas, setFilas] = useState({});
  const [masivo, setMasivo] = useState({ precio: '', dias: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (carrier) {
      setFilas(aFilas(carrier));
      setMasivo({ precio: '', dias: '' });
      setErrores({});
      setError('');
    }
  }, [carrier]);

  if (!carrier) return null;

  const cambiar = (depto, campo, valor) => {
    setFilas((f) => ({ ...f, [depto]: { ...f[depto], [campo]: valor } }));
    setErrores((e) => ({ ...e, [depto]: undefined }));
    setError('');
  };

  const aplicarATodos = () => {
    const errorMasivo = validarFila(masivo);
    if (!masivo.precio && !masivo.dias) return;
    if (Object.keys(errorMasivo).length) {
      setError('Para aplicar a todos escribe un precio mayor a 0 y los días (de 1 a 30)');
      return;
    }
    setFilas((f) => Object.fromEntries(Object.keys(f).map((d) => [d, { ...masivo }])));
    setErrores({});
    setError('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    const encontrados = Object.fromEntries(Object.entries(filas).map(([d, fila]) => [d, validarFila(fila)]).filter(([, er]) => Object.keys(er).length));
    setErrores(encontrados);
    if (Object.keys(encontrados).length) {
      setError('Revisa los departamentos marcados en rojo');
      return;
    }
    const tarifas = Object.entries(filas)
      .filter(([, f]) => f.precio !== '')
      .map(([departamento, f]) => ({ departamento, precio: Number(f.precio), dias: Number(f.dias) }));
    if (!tarifas.length) {
      setError('Define la tarifa de al menos un departamento');
      return;
    }
    setEnviando(true);
    try {
      await updateTarifas(carrier._id, tarifas);
      toast.success(`Tarifas de ${carrier.nombre} actualizadas`);
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = () => !enviando && onClose();
  const sinTarifa = Object.values(filas).filter((f) => f.precio === '').length;

  return (
    <Modal
      open
      onClose={cerrar}
      size="lg"
      title={`Tarifas de ${carrier.nombre}`}
      description="Precio de envío en quetzales y días estimados de entrega por departamento."
      footer={
        <>
          <Button variant="secondary" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-tarifas" icon={Save} loading={enviando}>
            Guardar tarifas
          </Button>
        </>
      }
    >
      <form id="form-tarifas" onSubmit={guardar} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        {sinTarifa > 0 && <Alert tone="warning">Los departamentos sin tarifa no se cotizan: los clientes no podrán elegir esta transportadora para ellos.</Alert>}

        <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 grid-cols-2 gap-2">
            <label className="text-xs font-medium text-slate-600">
              Precio para todos (Q)
              <input type="number" min="0" step="0.01" inputMode="decimal" value={masivo.precio} onChange={(e) => setMasivo((m) => ({ ...m, precio: e.target.value }))} className={`mt-1 ${claseCampo(false)}`} />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Días para todos
              <input type="number" min="1" max="30" step="1" inputMode="numeric" value={masivo.dias} onChange={(e) => setMasivo((m) => ({ ...m, dias: e.target.value }))} className={`mt-1 ${claseCampo(false)}`} />
            </label>
          </div>
          <Button variant="secondary" onClick={aplicarATodos}>
            Aplicar a todos
          </Button>
        </div>

        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {DEPARTAMENTOS.map((d) => (
            <li key={d} className="grid grid-cols-[minmax(0,1fr)_6.5rem_5rem] items-start gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_8rem_6rem]">
              <span className="pt-2 text-sm font-medium text-slate-700">{d}</span>
              <div>
                <input type="number" min="0" step="0.01" inputMode="decimal" aria-label={`Precio en ${d} (Q)`} placeholder="Q" value={filas[d]?.precio ?? ''} onChange={(e) => cambiar(d, 'precio', e.target.value)} className={claseCampo(errores[d]?.precio)} />
                {errores[d]?.precio && <p className="mt-1 text-xs font-medium text-danger">{errores[d].precio}</p>}
              </div>
              <div>
                <input type="number" min="1" max="30" step="1" inputMode="numeric" aria-label={`Días de entrega en ${d}`} placeholder="Días" value={filas[d]?.dias ?? ''} onChange={(e) => cambiar(d, 'dias', e.target.value)} className={claseCampo(errores[d]?.dias)} />
                {errores[d]?.dias && <p className="mt-1 text-xs font-medium text-danger">{errores[d].dias}</p>}
              </div>
            </li>
          ))}
        </ul>
      </form>
    </Modal>
  );
}
