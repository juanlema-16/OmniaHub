import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Wrench } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Alert from '../ui/Alert';
import { OrderStatusBadge } from '../ui/Badge';
import { changeOrderStatus } from '../../api/orders';
import { getErrorMessage } from '../../api/axios';
import { ORDER_STATUS } from '../../utils/constants';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const ESQUEMA = {
  estado: [reglas.requerido('El estado destino')],
  nota: [reglas.requerido('La nota', 'a'), reglas.minimo('La nota', 5)],
};

// Una orden entregada ya repartió el dinero: el backend no permite sacarla de ENTREGADO
// Entregada, cancelada o devuelta, la orden ya liquidó su dinero y no se puede reabrir
export const puedeCorregir = (orden) => !['ENTREGADO', 'CANCELADO', 'DEVOLUCION'].includes(orden.estado) && !orden.efectos?.repartido;

// Corrección manual del estado de una orden. Queda en la auditoría con la nota.
export default function CorregirEstadoModal({ orden, onClose, onDone }) {
  const [form, setForm] = useState({ estado: '', nota: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setForm({ estado: '', nota: '' });
    setErrores({});
    setError('');
  }, [orden?._id]);

  if (!orden) return null;

  const cambiar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrores((er) => ({ ...er, [e.target.name]: undefined }));
    setError('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(ESQUEMA, form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      await changeOrderStatus(orden._id, { estado: form.estado, nota: form.nota.trim(), motivo: form.estado === 'NOVEDAD' ? form.nota.trim() : undefined });
      toast.success(`Estado de ${orden.numero} corregido a ${ORDER_STATUS[form.estado].label}`);
      onDone();
      onClose();
    } catch (err) {
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = () => !enviando && onClose();
  const destinos = Object.entries(ORDER_STATUS).filter(([value]) => value !== orden.estado).map(([value, s]) => ({ value, label: s.label }));

  return (
    <Modal
      open
      onClose={cerrar}
      title={`Corregir estado · ${orden.numero}`}
      description="Úsalo solo para resolver errores operativos. Queda registrado en la auditoría."
      footer={
        <>
          <Button variant="secondary" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-corregir-estado" icon={Wrench} loading={enviando}>
            Corregir estado
          </Button>
        </>
      }
    >
      <form id="form-corregir-estado" onSubmit={enviar} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          Estado actual: <OrderStatusBadge estado={orden.estado} />
        </div>
        <Select label="Nuevo estado" name="estado" value={form.estado} onChange={cambiar} error={errores.estado} placeholder="Elige el estado destino" options={destinos} required />
        <Alert tone="warning">
          Pasar a Entregado reparte el dinero y no se puede deshacer. Pasar a Cancelado o Devolución devuelve el stock y mueve dinero según el tipo de pago.
        </Alert>
        <Textarea label="Motivo de la corrección" name="nota" value={form.nota} onChange={cambiar} error={errores.nota} maxLength={300} rows={3} placeholder="Explica por qué cambias el estado" required />
      </form>
    </Modal>
  );
}
