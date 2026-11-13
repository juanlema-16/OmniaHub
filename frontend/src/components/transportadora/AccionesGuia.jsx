import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import AccionOrdenModal from './AccionOrdenModal';
import { ACCIONES, accionesPermitidas } from './acciones';

// Botones del pie del detalle de una guía según su estado
export default function AccionesGuia({ orden, onChange }) {
  const { refresh } = useAuth();
  const [accion, setAccion] = useState(null);
  const permitidas = accionesPermitidas(orden);
  if (!permitidas.length) return null;

  return (
    <>
      {permitidas.map((a) => (
        <Button key={a} variant={ACCIONES[a].variant} icon={ACCIONES[a].icon} onClick={() => setAccion(a)}>
          {ACCIONES[a].label}
        </Button>
      ))}
      <AccionOrdenModal orden={orden} accion={accion} onClose={() => setAccion(null)} onDone={() => {
          onChange();
          refresh();
        }} />
    </>
  );
}
