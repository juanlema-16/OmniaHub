import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, CreditCard, FileUp, Landmark, Paperclip, X } from 'lucide-react';
import { createTopUp } from '../../api/wallet';
import { getErrorMessage } from '../../api/axios';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { erroresDeApi, reglas, validar } from '../../utils/validation';
import { formatQ } from '../../utils/formatQ';

const MIN = 10;
const MAX = 50_000;
const MAX_MB = 5;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const METODOS = [
  { value: 'TRANSFERENCIA', label: 'Transferencia bancaria', detalle: 'Sube el comprobante de tu depósito', icon: Landmark },
  { value: 'TARJETA', label: 'Tarjeta', detalle: 'Pago simulado, sin datos reales', icon: CreditCard },
];

const esquema = (metodo) => ({
  monto: [
    reglas.requerido('El monto'),
    (v) => (v !== '' && !(Number(v) > 0) ? 'El monto debe ser mayor a 0' : null),
    (v) => (Number(v) > 0 && Number(v) < MIN ? `La recarga mínima es ${formatQ(MIN)}` : null),
    (v) => (Number(v) > MAX ? `La recarga máxima es ${formatQ(MAX)}` : null),
  ],
  comprobante: [(v) => (metodo === 'TRANSFERENCIA' && !v ? 'Sube el comprobante de la transferencia' : null)],
});

export default function RecargaModal({ open, onClose, onCreated }) {
  const [metodo, setMetodo] = useState('TRANSFERENCIA');
  const [monto, setMonto] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const input = useRef(null);

  useEffect(() => {
    if (!open) return;
    setMetodo('TRANSFERENCIA');
    setMonto('');
    setArchivo(null);
    setErrores({});
    setError('');
  }, [open]);

  const elegirArchivo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!TIPOS.includes(file.type)) return setErrores((er) => ({ ...er, comprobante: 'El comprobante debe ser JPG, PNG, WEBP o PDF' }));
    if (file.size > MAX_MB * 1024 * 1024) return setErrores((er) => ({ ...er, comprobante: `El comprobante no puede pesar más de ${MAX_MB} MB` }));
    setErrores((er) => ({ ...er, comprobante: undefined }));
    setArchivo(file);
    return undefined;
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(esquema(metodo), { monto, comprobante: archivo });
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;
    const form = new FormData();
    form.append('metodo', metodo);
    form.append('monto', monto);
    if (metodo === 'TRANSFERENCIA') form.append('comprobante', archivo);
    setEnviando(true);
    try {
      await createTopUp(form);
      toast.success('Recarga enviada. Un administrador la revisará pronto');
      onCreated();
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
      open={open}
      onClose={onClose}
      title="Recargar saldo"
      description="Las recargas se acreditan cuando un administrador las aprueba, hasta 24 horas hábiles."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-recarga" icon={Banknote} loading={enviando}>
            Enviar recarga
          </Button>
        </>
      }
    >
      <form id="form-recarga" onSubmit={enviar} className="space-y-5" noValidate>
        {error && <Alert tone="error">{error}</Alert>}

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Método de pago</legend>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Método de pago">
            {METODOS.map((m) => {
              const activo = metodo === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  onClick={() => {
                    setMetodo(m.value);
                    setErrores((er) => ({ ...er, comprobante: undefined }));
                  }}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${activo ? 'border-primary bg-primary-50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${activo ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                    {activo && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <m.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{m.label}</span>
                    <span className="block text-xs text-slate-500">{m.detalle}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {metodo === 'TRANSFERENCIA' && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium text-slate-800">Deposita a esta cuenta de ejemplo</p>
            <p>Banco Industrial · Monetaria 000-123456-7 · OmniaHub, S. A.</p>
            <p className="mt-1 text-xs text-slate-500">Cuenta ficticia para la demostración: no se mueve dinero real.</p>
          </div>
        )}

        <Input
          label="Monto a recargar"
          name="monto"
          type="number"
          inputMode="decimal"
          min={MIN}
          max={MAX}
          step="0.01"
          prefix="Q"
          value={monto}
          onChange={(e) => {
            setMonto(e.target.value);
            setErrores((er) => ({ ...er, monto: undefined }));
          }}
          error={errores.monto}
          hint={`Desde ${formatQ(MIN)} hasta ${formatQ(MAX)}`}
          required
        />

        {metodo === 'TRANSFERENCIA' && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">
              Comprobante <span className="text-danger">*</span>
            </p>
            <input ref={input} type="file" accept={TIPOS.join(',')} className="sr-only" onChange={elegirArchivo} aria-label="Elegir comprobante" />
            {archivo ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <Paperclip className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-slate-700">{archivo.name}</span>
                <button type="button" onClick={() => setArchivo(null)} className="rounded p-1 text-slate-400 hover:text-danger" aria-label="Quitar comprobante">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => input.current?.click()}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-sm font-medium transition-colors ${
                  errores.comprobante ? 'border-danger bg-red-50 text-danger' : 'border-slate-300 bg-slate-50 text-slate-600 hover:border-primary hover:bg-primary-50 hover:text-primary'
                }`}
              >
                <FileUp className="h-5 w-5" aria-hidden="true" /> Subir comprobante
              </button>
            )}
            {errores.comprobante ? <p className="mt-1.5 text-xs font-medium text-danger">{errores.comprobante}</p> : <p className="mt-1.5 text-xs text-slate-500">JPG, PNG, WEBP o PDF, hasta {MAX_MB} MB</p>}
          </div>
        )}

        {metodo === 'TARJETA' && <Alert tone="info">El pago con tarjeta es una simulación: no pedimos número de tarjeta. Tu recarga queda pendiente hasta que un administrador la apruebe.</Alert>}
      </form>
    </Modal>
  );
}
