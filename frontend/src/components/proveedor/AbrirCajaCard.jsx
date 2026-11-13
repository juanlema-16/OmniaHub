import { useState } from 'react';
import toast from 'react-hot-toast';
import { Store } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { openCash } from '../../api/pos';
import { getErrorMessage } from '../../api/axios';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const esquema = {
  montoInicial: [reglas.requerido('El monto inicial'), (v) => (v !== '' && Number(v) < 0 ? 'El monto inicial no puede ser negativo' : null)],
};

// Estado "sin caja abierta": se abre con el efectivo con el que empieza el turno
export default function AbrirCajaCard({ onOpened }) {
  const [monto, setMonto] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const abrir = async (e) => {
    e.preventDefault();
    const encontrados = validar(esquema, { montoInicial: monto });
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      await openCash({ montoInicial: Number(monto) });
      toast.success('Caja abierta. ¡Buenas ventas!');
      onOpened();
    } catch (err) {
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card className="mx-auto max-w-lg">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary">
          <Store className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">No tienes una caja abierta</h2>
        <p className="mt-1 text-sm text-slate-500">Abre la caja con el efectivo inicial para empezar a vender en tu punto de venta.</p>
      </div>
      <form onSubmit={abrir} className="mt-6 space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Input
          label="Monto inicial"
          type="number"
          min="0"
          step="0.01"
          prefix="Q"
          value={monto}
          onChange={(e) => {
            setMonto(e.target.value);
            setErrores({});
          }}
          error={errores.montoInicial}
          hint="El efectivo que dejas en caja para dar cambio"
          required
        />
        <Button type="submit" fullWidth loading={enviando}>
          Abrir caja
        </Button>
      </form>
    </Card>
  );
}
