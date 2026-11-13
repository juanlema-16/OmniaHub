import Alert from '../ui/Alert';
import Button from '../ui/Button';

// Aviso de lo que cambió al revisar el carrito (producto quitado, precio o stock distintos)
export default function AvisosCarrito({ avisos, onCerrar, className = '' }) {
  if (!avisos.length) return null;
  return (
    <Alert
      tone="warning"
      title={avisos.length === 1 ? 'Actualizamos tu carrito' : 'Actualizamos tu carrito con estos cambios'}
      className={className}
      action={
        <Button size="sm" variant="secondary" onClick={onCerrar}>
          Entendido
        </Button>
      }
    >
      <ul className="list-disc space-y-0.5 pl-4">
        {avisos.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </Alert>
  );
}
