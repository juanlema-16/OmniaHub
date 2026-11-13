import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { createTicket } from '../../api/tickets';
import { listOrders } from '../../api/orders';
import { getErrorMessage } from '../../api/axios';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Alert from '../ui/Alert';
import { TICKET_CATEGORIA, TICKET_PRIORIDAD } from '../../utils/constants';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const VACIO = { asunto: '', categoria: '', prioridad: 'MEDIA', order: '', mensaje: '' };

const ESQUEMA = {
  asunto: [reglas.requerido('El asunto'), reglas.minimo('El asunto', 5)],
  categoria: [(v) => (!v ? 'Elige una categoría' : null)],
  mensaje: [reglas.requerido('El mensaje'), reglas.minimo('El mensaje', 10)],
};

export default function TicketNuevoModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Orden relacionada: solo se ofrece a quien tiene órdenes propias (el admin no)
  const ordenes = useAsync(() => (open && user.role !== 'admin' ? listOrders({ limit: 20 }) : Promise.resolve(null)), [open, user.role]);

  useEffect(() => {
    if (open) {
      setForm(VACIO);
      setErrores({});
      setError('');
    }
  }, [open]);

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
      const ticket = await createTicket({ asunto: form.asunto.trim(), categoria: form.categoria, prioridad: form.prioridad, mensaje: form.mensaje.trim(), ...(form.order ? { order: form.order } : {}) });
      toast.success(`Ticket ${ticket.numero} creado. Te responderemos pronto`);
      onCreated(ticket);
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
      onClose={() => !enviando && onClose()}
      title="Nuevo ticket de soporte"
      description="Cuéntanos qué pasó y el equipo de OmniaHub te responde por aquí."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-ticket" icon={Send} loading={enviando}>
            Enviar ticket
          </Button>
        </>
      }
    >
      <form id="form-ticket" onSubmit={enviar} className="space-y-4" noValidate>
        {error && !Object.values(errores).some(Boolean) && <Alert tone="error">{error}</Alert>}
        <Input label="Asunto" name="asunto" value={form.asunto} onChange={cambiar} error={errores.asunto} maxLength={120} placeholder="Ej. No me llegó mi pedido" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Categoría" name="categoria" value={form.categoria} onChange={cambiar} error={errores.categoria} placeholder="Selecciona" options={Object.entries(TICKET_CATEGORIA).map(([value, label]) => ({ value, label }))} required />
          <Select label="Prioridad" name="prioridad" value={form.prioridad} onChange={cambiar} error={errores.prioridad} options={Object.entries(TICKET_PRIORIDAD).map(([value, p]) => ({ value, label: p.label }))} />
        </div>
        {ordenes.data?.items?.length > 0 && (
          <Select
            label="Orden relacionada (opcional)"
            name="order"
            value={form.order}
            onChange={cambiar}
            error={errores.order}
            placeholder="Ninguna"
            options={ordenes.data.items.map((o) => ({ value: o._id, label: `${o.numero} · ${o.items[0]?.nombre ?? ''}` }))}
          />
        )}
        <Textarea label="Mensaje" name="mensaje" value={form.mensaje} onChange={cambiar} error={errores.mensaje} rows={5} maxLength={2000} placeholder="Describe el problema con el mayor detalle posible" required />
      </form>
    </Modal>
  );
}
