import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Alert from '../ui/Alert';
import { changeOrderStatus } from '../../api/orders';
import { getErrorMessage } from '../../api/axios';
import { formatQ } from '../../utils/formatQ';
import { erroresDeApi, reglas, validar } from '../../utils/validation';
import { ACCIONES, MOTIVOS_NOVEDAD, cobraEfectivo } from './acciones';

const TEXTOS = {
  EN_TRANSITO: 'La guía pasa a En tránsito y el dropshipper y el cliente reciben el aviso.',
  ENTREGADO: 'Al confirmar la entrega el dinero se reparte entre proveedor, transportadora, plataforma y dropshipper. No se puede deshacer.',
  NOVEDAD: 'El dropshipper recibirá el motivo y tendrá que indicar una solución para reintentar la entrega.',
  DEVOLUCION: 'El paquete regresa a la bodega del proveedor y se cobra el flete de devolución. No se puede deshacer.',
};

const ESQUEMA_NOVEDAD = { motivo: [reglas.requerido('El motivo'), reglas.minimo('El motivo', 3)] };
const VACIO = { motivo: '', nota: '', monto: '' };

// Confirmación de un cambio de estado de la transportadora. accion: EN_TRANSITO | ENTREGADO | NOVEDAD | DEVOLUCION
export default function AccionOrdenModal({ orden, accion, onClose, onDone }) {
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setForm(VACIO);
    setErrores({});
    setError('');
  }, [orden?._id, accion]);

  if (!orden || !accion) return null;
  const cfg = ACCIONES[accion];
  const pideMonto = accion === 'ENTREGADO' && cobraEfectivo(orden);

  const cambiar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrores((er) => ({ ...er, [e.target.name]: undefined }));
    setError('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = accion === 'NOVEDAD' ? validar(ESQUEMA_NOVEDAD, form) : {};
    if (pideMonto) {
      if (form.monto === '') encontrados.monto = 'Confirma el monto que cobraste';
      else if (Math.round(Number(form.monto) * 100) !== Math.round(orden.total * 100)) encontrados.monto = `El monto cobrado debe ser ${formatQ(orden.total)}`;
    }
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    try {
      await changeOrderStatus(orden._id, {
        estado: accion,
        motivo: accion === 'NOVEDAD' ? form.motivo.trim() : undefined,
        nota: accion !== 'NOVEDAD' && form.nota.trim() ? form.nota.trim() : undefined,
        montoRecaudado: pideMonto ? Number(form.monto) : undefined,
      });
      toast.success(cfg.mensaje);
      onDone?.();
      onClose();
    } catch (err) {
      const deApi = erroresDeApi(err);
      setErrores({ ...deApi, monto: deApi.montoRecaudado });
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = () => !enviando && onClose();

  return (
    <Modal
      open
      onClose={cerrar}
      title={`${cfg.label} · ${orden.numero}`}
      description={orden.guia ? `Guía ${orden.guia}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-accion-guia" variant={cfg.variant === 'secondary' ? 'primary' : cfg.variant} icon={cfg.icon} loading={enviando}>
            Confirmar
          </Button>
        </>
      }
    >
      <form id="form-accion-guia" onSubmit={enviar} className="space-y-4" noValidate>
        <Alert tone={accion === 'ENTREGADO' || accion === 'EN_TRANSITO' ? 'info' : 'warning'}>{TEXTOS[accion]}</Alert>
        {error && <Alert tone="error">{error}</Alert>}

        {accion === 'NOVEDAD' && (
          <div>
            <Textarea label="Motivo de la novedad" name="motivo" value={form.motivo} onChange={cambiar} error={errores.motivo} maxLength={200} rows={2} placeholder="¿Qué impidió la entrega?" required />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MOTIVOS_NOVEDAD.map((m) => (
                <button key={m} type="button" onClick={() => setForm((f) => ({ ...f, motivo: m }))} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-primary hover:text-primary">
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {accion === 'ENTREGADO' && (
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {pideMonto ? (
              <p>
                Cobra al cliente en efectivo: <strong className="text-lg text-slate-900">{formatQ(orden.total)}</strong>
              </p>
            ) : (
              <p>{orden.tipoPago === 'SIN_RECAUDO' ? 'Orden prepagada: no cobres nada al cliente.' : 'El cliente pagó con tarjeta: no cobres nada al entregar.'}</p>
            )}
          </div>
        )}
        {pideMonto && (
          <Input label="Monto cobrado" name="monto" type="number" inputMode="decimal" min="0" step="0.01" prefix="Q" value={form.monto} onChange={cambiar} error={errores.monto} hint="Escribe el monto exacto que recibiste del cliente" required />
        )}

        {accion !== 'NOVEDAD' && <Textarea label="Nota (opcional)" name="nota" value={form.nota} onChange={cambiar} maxLength={300} rows={2} placeholder="Ej. recibió el portero" />}
      </form>
    </Modal>
  );
}
