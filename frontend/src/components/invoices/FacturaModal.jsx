import { Printer } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getInvoice } from '../../api/invoices';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Skeleton from '../ui/Skeleton';
import { FacturaDocumento, FacturaParaImprimir } from './FacturaDocumento';

export default function FacturaModal({ facturaId, onClose }) {
  const { data: factura, cargando, error } = useAsync(() => (facturaId ? getInvoice(facturaId) : Promise.resolve(null)), [facturaId]);

  return (
    <Modal
      open={Boolean(facturaId)}
      onClose={onClose}
      size="lg"
      title={factura ? `Factura ${factura.numero}` : 'Factura'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button icon={Printer} disabled={!factura} onClick={() => window.print()}>
            Imprimir
          </Button>
        </>
      }
    >
      {cargando && !factura && <Skeleton className="h-72 w-full" />}
      {error && <Alert tone="error">{error}</Alert>}
      {factura && (
        <>
          <FacturaDocumento factura={factura} />
          <FacturaParaImprimir factura={factura} />
        </>
      )}
    </Modal>
  );
}
