import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Percent, Save, Wallet } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getSettings, updateSettings } from '../../api/admin';
import { getErrorMessage } from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import ConfirmarModal from '../../components/admin/ConfirmarModal';
import { formatQ } from '../../utils/formatQ';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const ESQUEMA = {
  comisionPorcentaje: [
    reglas.requerido('La comisión', 'a'),
    (v) => (v !== '' && Number(v) < 0 ? 'La comisión no puede ser negativa' : null),
    (v) => (Number(v) > 30 ? 'La comisión máxima es 30%' : null),
  ],
  montoMinimoRetiro: [
    reglas.requerido('El monto mínimo'),
    (v) => (v !== '' && Number(v) < 1 ? 'El monto mínimo debe ser al menos Q 1' : null),
    (v) => (Number(v) > 10000 ? 'El monto mínimo no puede ser mayor a Q 10,000' : null),
  ],
};

export default function ConfiguracionPage() {
  const settings = useAsync(getSettings, []);
  const [form, setForm] = useState({ comisionPorcentaje: '', montoMinimoRetiro: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    if (settings.data) setForm({ comisionPorcentaje: String(settings.data.comisionPorcentaje), montoMinimoRetiro: String(settings.data.montoMinimoRetiro) });
  }, [settings.data]);

  const cambiar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrores((er) => ({ ...er, [e.target.name]: undefined }));
    setError('');
  };

  const sinCambios = settings.data && Number(form.comisionPorcentaje) === settings.data.comisionPorcentaje && Number(form.montoMinimoRetiro) === settings.data.montoMinimoRetiro;
  const ejemplo = Number(form.comisionPorcentaje) >= 0 && form.comisionPorcentaje !== '' ? (100 * Number(form.comisionPorcentaje)) / 100 : null;

  const revisar = (e) => {
    e.preventDefault();
    const encontrados = validar(ESQUEMA, form);
    setErrores(encontrados);
    if (!Object.keys(encontrados).length) setConfirmar(true);
  };

  const guardar = async () => {
    try {
      const actualizada = await updateSettings({ comisionPorcentaje: Number(form.comisionPorcentaje), montoMinimoRetiro: Number(form.montoMinimoRetiro) });
      settings.setData(actualizada);
      toast.success('Configuración guardada');
    } catch (err) {
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
      setConfirmar(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Reglas de dinero de la plataforma. Los cambios aplican a partir de ahora." />
      {settings.error && <Alert tone="error">{settings.error}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={revisar} noValidate className="grid gap-6 lg:grid-cols-2">
        <Card title="Comisión de la plataforma" description="Porcentaje del total de cada orden que se acredita a la billetera de la plataforma al entregarse.">
          {settings.cargando ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="space-y-3">
              <Input label="Comisión (%)" name="comisionPorcentaje" type="number" inputMode="decimal" min="0" max="30" step="0.1" icon={Percent} value={form.comisionPorcentaje} onChange={cambiar} error={errores.comisionPorcentaje} hint="Entre 0% y 30%" required />
              {ejemplo !== null && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  En una orden de {formatQ(100)} la plataforma gana <strong className="text-success">{formatQ(ejemplo)}</strong>.
                </p>
              )}
              <p className="text-xs text-slate-500">Afecta la ganancia que ven los dropshippers al crear órdenes nuevas. Las órdenes ya creadas conservan su comisión.</p>
            </div>
          )}
        </Card>

        <Card title="Retiro mínimo" description="Monto más bajo que un usuario puede solicitar retirar de su billetera.">
          {settings.cargando ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="space-y-3">
              <Input label="Monto mínimo de retiro" name="montoMinimoRetiro" type="number" inputMode="decimal" min="1" max="10000" step="1" icon={Wallet} value={form.montoMinimoRetiro} onChange={cambiar} error={errores.montoMinimoRetiro} hint="Entre Q 1 y Q 10,000" required />
              <p className="text-xs text-slate-500">Se valida en la pantalla de retiros de proveedores, dropshippers y transportadoras. Los retiros ya solicitados no cambian.</p>
            </div>
          )}
        </Card>

        <div className="lg:col-span-2">
          <Button type="submit" icon={Save} disabled={settings.cargando || Boolean(sinCambios)}>
            Guardar cambios
          </Button>
        </div>
      </form>

      <ConfirmarModal open={confirmar} onClose={() => setConfirmar(false)} title="Guardar configuración" confirmLabel="Guardar" icon={Save} onConfirm={guardar}>
        <p className="text-sm text-slate-600">
          La comisión será <strong>{form.comisionPorcentaje}%</strong> y el retiro mínimo <strong>{formatQ(form.montoMinimoRetiro)}</strong>. Se registrará en la auditoría.
        </p>
      </ConfirmarModal>
    </div>
  );
}
