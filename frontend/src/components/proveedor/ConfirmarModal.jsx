import Modal from '../ui/Modal';
import Button from '../ui/Button';

// Confirmación antes de una acción destructiva
export default function ConfirmarModal({ open, title, children, confirmLabel = 'Confirmar', loading = false, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">{children}</div>
    </Modal>
  );
}
