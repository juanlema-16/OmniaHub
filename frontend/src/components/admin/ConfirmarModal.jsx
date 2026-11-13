import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Alert from '../ui/Alert';
import { getErrorMessage } from '../../api/axios';

// Confirmación de una acción del admin, con motivo (obligatorio o no). onConfirm(motivo) debe lanzar si falla.
export default function ConfirmarModal({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel = 'Confirmar',
  variant = 'primary',
  icon,
  motivo = false,
  motivoLabel = 'Motivo',
  motivoMinimo = 5,
  onConfirm,
}) {
  const [texto, setTexto] = useState('');
  const [errorCampo, setErrorCampo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) {
      setTexto('');
      setErrorCampo('');
      setError('');
    }
  }, [open]);

  const cerrar = () => !enviando && onClose();

  const enviar = async (e) => {
    e.preventDefault();
    const limpio = texto.trim();
    if (motivo && limpio.length < motivoMinimo) {
      setErrorCampo(limpio ? `El motivo debe tener al menos ${motivoMinimo} caracteres` : 'Indica el motivo');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await onConfirm(limpio || undefined);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={cerrar}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-confirmar" variant={variant} icon={icon} loading={enviando}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form id="form-confirmar" onSubmit={enviar} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        {children}
        {motivo && (
          <Textarea
            label={motivoLabel}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setErrorCampo('');
            }}
            error={errorCampo}
            maxLength={300}
            rows={3}
            required
          />
        )}
      </form>
    </Modal>
  );
}
