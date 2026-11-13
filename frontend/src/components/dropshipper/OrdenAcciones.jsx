import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, TriangleAlert, XCircle } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { changeOrderStatus } from '../../api/orders';
import { getErrorMessage } from '../../api/axios';

// Lo que el dropshipper puede hacer con una orden: confirmar, cancelar (antes de la guía) o ir a la novedad
export default function OrdenAcciones({ orden, onChange }) {
  const { refresh } = useAuth();
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState('');

  const cambiar = async (estado, mensaje) => {
    setEnviando(estado);
    try {
      await changeOrderStatus(orden._id, { estado, nota: estado === 'CANCELADO' && motivo.trim() ? motivo.trim() : undefined });
      toast.success(mensaje);
      setCancelando(false);
      setMotivo('');
      refresh();
      onChange?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnviando('');
    }
  };

  const puedeConfirmar = orden.estado === 'PENDIENTE_CONFIRMACION';
  const puedeCancelar = ['PENDIENTE_CONFIRMACION', 'PENDIENTE'].includes(orden.estado);

  if (cancelando) {
    return (
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <input
          autoFocus
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={300}
          placeholder="Motivo de la cancelación (opcional)"
          aria-label="Motivo de la cancelación"
          className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCancelando(false)} disabled={Boolean(enviando)}>
            No, volver
          </Button>
          <Button
            variant="danger"
            icon={XCircle}
            loading={enviando === 'CANCELADO'}
            onClick={() => cambiar('CANCELADO', orden.tipoPago === 'SIN_RECAUDO' ? 'Orden cancelada. Te devolvimos el saldo a tu billetera.' : 'Orden cancelada')}
          >
            Sí, cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (!puedeConfirmar && !puedeCancelar && !orden.novedad?.activa) return null;

  return (
    <>
      {orden.novedad?.activa && (
        <Link to="/dropshipper/novedades" className="inline-flex h-10 items-center gap-2 rounded-lg bg-orange-50 px-4 text-sm font-medium text-orange-700 hover:bg-orange-100">
          <TriangleAlert className="h-4 w-4" aria-hidden="true" /> Solucionar novedad
        </Link>
      )}
      {puedeCancelar && (
        <Button variant="secondary" icon={XCircle} onClick={() => setCancelando(true)} disabled={Boolean(enviando)}>
          Cancelar orden
        </Button>
      )}
      {puedeConfirmar && (
        <Button icon={CheckCircle2} loading={enviando === 'PENDIENTE'} onClick={() => cambiar('PENDIENTE', 'Orden confirmada: el proveedor ya puede preparar la guía')}>
          Confirmar orden
        </Button>
      )}
    </>
  );
}
