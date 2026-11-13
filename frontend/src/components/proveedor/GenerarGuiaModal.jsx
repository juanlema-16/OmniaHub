import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Alert from '../ui/Alert';
import { changeOrderStatus } from '../../api/orders';
import { getErrorMessage } from '../../api/axios';
import { plural } from '../../utils/plural';

// Pasa la orden de PENDIENTE a GUIA_GENERADA: el backend crea el número de guía
export default function GenerarGuiaModal({ orden, onClose, onDone }) {
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setNota('');
    setError('');
  }, [orden]);

  if (!orden) return null;

  const unidades = orden.items.reduce((s, i) => s + i.cantidad, 0);

  const generar = async () => {
    setEnviando(true);
    setError('');
    try {
      const actualizada = await changeOrderStatus(orden._id, { estado: 'GUIA_GENERADA', nota: nota.trim() || undefined });
      toast.success(`Guía ${actualizada.guia} generada para la orden ${orden.numero}`);
      onDone();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open
      onClose={enviando ? () => {} : onClose}
      size="sm"
      title="Generar guía"
      description={`Orden ${orden.numero}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button icon={FileText} onClick={generar} loading={enviando}>
            Generar guía
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <p className="text-sm text-slate-600">
          Confirma que preparaste {plural(unidades, 'unidad', 'unidades')} para <strong className="text-slate-900">{orden.cliente.nombres} {orden.cliente.apellidos}</strong> ({orden.destino.municipio}, {orden.destino.departamento}). La transportadora {orden.transportadora?.nombre} recibirá la guía para recolectar el paquete.
        </p>
        <Textarea label="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300} rows={2} placeholder="Ej. Paquete listo en bodega, horario de recolección" />
      </div>
    </Modal>
  );
}
