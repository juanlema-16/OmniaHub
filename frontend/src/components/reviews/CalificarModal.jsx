import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Send } from 'lucide-react';
import { createReview } from '../../api/reviews';
import { getErrorMessage } from '../../api/axios';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Estrellas, { EstrellasInput } from '../ui/Estrellas';

// Califica los productos de una orden entregada. resenas: reseñas ya hechas por este cliente.
export default function CalificarModal({ orden, resenas, onClose, onSaved }) {
  const [valores, setValores] = useState({});
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setValores({});
    setErrores({});
    setError('');
  }, [orden]);

  if (!orden) return null;

  const hecha = (item) => resenas.find((r) => r.order === orden._id && r.product === item.product);
  const pendientes = orden.items.filter((i) => !hecha(i));

  const cambiar = (producto, campo, valor) => {
    setValores((v) => ({ ...v, [producto]: { ...v[producto], [campo]: valor } }));
    setErrores((e) => ({ ...e, [producto]: undefined }));
    setError('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    const nuevos = {};
    const completos = [];
    pendientes.forEach((i) => {
      const v = valores[i.product] || {};
      if (!v.rating && !v.comentario?.trim()) return;
      if (!v.rating) nuevos[i.product] = 'Elige de 1 a 5 estrellas';
      else if ((v.comentario || '').trim().length < 3) nuevos[i.product] = 'Cuéntanos tu experiencia (mínimo 3 caracteres)';
      else completos.push({ product: i.product, rating: v.rating, comentario: v.comentario.trim() });
    });
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    if (!completos.length) return setError('Elige las estrellas y escribe un comentario para al menos un producto');

    setEnviando(true);
    let enviadas = 0;
    try {
      for (const r of completos) {
        // Uno por uno: si alguna falla, las anteriores ya quedaron guardadas
        await createReview({ ...r, order: orden._id });
        enviadas += 1;
      }
      toast.success(enviadas === 1 ? '¡Gracias por tu reseña!' : `¡Gracias! Enviaste ${enviadas} reseñas`);
      onSaved();
      onClose();
    } catch (err) {
      if (enviadas) onSaved();
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
    return undefined;
  };

  return (
    <Modal
      open
      onClose={() => !enviando && onClose()}
      size="lg"
      title={`Califica tu pedido ${orden.numero}`}
      description="Tu opinión ayuda a otros clientes a comprar mejor."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            {pendientes.length ? 'Cancelar' : 'Cerrar'}
          </Button>
          {pendientes.length > 0 && (
            <Button type="submit" form="form-resenas" icon={Send} loading={enviando}>
              Enviar reseña
            </Button>
          )}
        </>
      }
    >
      <form id="form-resenas" onSubmit={enviar} noValidate className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        {orden.items.map((item) => {
          const previa = hecha(item);
          const v = valores[item.product] || {};
          return (
            <section key={item.product} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <img src={item.imagen} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover" />
                <p className="font-semibold text-slate-900">{item.nombre}</p>
              </div>
              {previa ? (
                <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm">
                  <p className="flex items-center gap-2 font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Ya calificaste este producto <Estrellas valor={previa.rating} />
                  </p>
                  <p className="mt-1 text-slate-600">{previa.comentario}</p>
                  {!previa.visible && <p className="mt-1 text-xs text-amber-700">Un administrador ocultó esta reseña.</p>}
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <EstrellasInput valor={v.rating || 0} onChange={(n) => cambiar(item.product, 'rating', n)} error={Boolean(errores[item.product]) && !v.rating} />
                  <label htmlFor={`com-${item.product}`} className="sr-only">
                    Comentario sobre {item.nombre}
                  </label>
                  <textarea
                    id={`com-${item.product}`}
                    rows={3}
                    maxLength={500}
                    value={v.comentario || ''}
                    onChange={(e) => cambiar(item.product, 'comentario', e.target.value)}
                    placeholder="¿Qué te pareció el producto?"
                    aria-invalid={Boolean(errores[item.product])}
                    className={`w-full resize-y rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errores[item.product] ? 'border-danger focus:ring-red-100' : 'border-slate-300 focus:border-primary focus:ring-primary-100'}`}
                  />
                  {errores[item.product] && <p className="text-xs font-medium text-danger">{errores[item.product]}</p>}
                </div>
              )}
            </section>
          );
        })}
      </form>
    </Modal>
  );
}
