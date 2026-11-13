import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { closeCash } from '../../api/pos';
import { getErrorMessage } from '../../api/axios';
import { formatQ } from '../../utils/formatQ';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const esquema = {
  montoContado: [reglas.requerido('El monto contado'), (v) => (v !== '' && Number(v) < 0 ? 'El monto contado no puede ser negativo' : null)],
};

// Diferencia del arqueo: verde si cuadra, rojo si falta dinero, ámbar si sobra
export const estiloDiferencia = (d) => {
  if (d === 0) return { texto: 'text-success', fondo: 'bg-emerald-50', mensaje: 'La caja cuadra' };
  if (d < 0) return { texto: 'text-danger', fondo: 'bg-red-50', mensaje: 'Falta dinero en caja' };
  return { texto: 'text-warning', fondo: 'bg-amber-50', mensaje: 'Sobra dinero en caja' };
};

const Fila = ({ label, valor, fuerte = false }) => (
  <div className={`flex justify-between gap-3 ${fuerte ? 'text-base font-semibold text-slate-900' : 'text-slate-600'}`}>
    <span>{label}</span>
    <span>{valor}</span>
  </div>
);

// Cierre de caja con arqueo: compara lo esperado con lo contado
export default function CerrarCajaModal({ open, caja, resumen, onClose, onClosed }) {
  const [monto, setMonto] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (!open) return;
    setMonto('');
    setErrores({});
    setError('');
    setResultado(null);
  }, [open]);

  const esperado = resumen?.montoEsperado ?? 0;
  const diferenciaVivo = monto !== '' && Number(monto) >= 0 ? Math.round((Number(monto) - esperado) * 100) / 100 : null;

  const cerrar = async (e) => {
    e.preventDefault();
    const encontrados = validar(esquema, { montoContado: monto });
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      const { caja: cerrada } = await closeCash({ montoContado: Number(monto) });
      setResultado(cerrada);
      toast.success('Caja cerrada');
    } catch (err) {
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  if (resultado) {
    const est = estiloDiferencia(resultado.diferencia);
    return (
      <Modal open={open} onClose={onClosed} size="sm" title="Caja cerrada" footer={<Button onClick={onClosed}>Listo</Button>}>
        <div className="space-y-4">
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${est.fondo} ${est.texto}`}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {est.mensaje}
          </div>
          <div className="space-y-2 text-sm">
            <Fila label="Monto esperado" valor={formatQ(resultado.montoEsperado)} />
            <Fila label="Monto contado" valor={formatQ(resultado.montoContado)} />
            <div className={`flex justify-between border-t border-slate-100 pt-2 text-base font-bold ${est.texto}`}>
              <span>Diferencia</span>
              <span>{formatQ(resultado.diferencia)}</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  const est = diferenciaVivo === null ? null : estiloDiferencia(diferenciaVivo);

  return (
    <Modal
      open={open}
      onClose={enviando ? () => {} : onClose}
      size="sm"
      title="Cerrar caja"
      description="Cuenta el efectivo que hay en caja y compáralo con lo esperado."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-cierre" loading={enviando}>
            Cerrar caja
          </Button>
        </>
      }
    >
      <form id="form-cierre" onSubmit={cerrar} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
          <Fila label="Monto inicial" valor={formatQ(caja?.montoInicial)} />
          <Fila label="Ventas en efectivo" valor={formatQ(resumen?.totalEfectivo)} />
          <Fila label="Monto esperado" valor={formatQ(esperado)} fuerte />
        </div>
        <Input
          label="Monto contado"
          type="number"
          min="0"
          step="0.01"
          prefix="Q"
          value={monto}
          onChange={(e) => {
            setMonto(e.target.value);
            setErrores({});
          }}
          error={errores.montoContado}
          hint="El efectivo que contaste físicamente"
          required
        />
        {est && (
          <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${est.fondo} ${est.texto}`} role="status">
            Diferencia: {formatQ(diferenciaVivo)} · {est.mensaje}
          </p>
        )}
      </form>
    </Modal>
  );
}
