import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { adjustStock } from '../../api/inventory';
import { getErrorMessage } from '../../api/axios';
import { erroresDeApi, reglas, validar } from '../../utils/validation';
import { plural } from '../../utils/plural';

const esquema = (stock) => ({
  cantidad: [
    reglas.requerido('La cantidad', 'a'),
    (v) => (v !== '' && !Number.isInteger(Number(v)) ? 'La cantidad debe ser un número entero' : null),
    (v) => (v !== '' && Number(v) === 0 ? 'La cantidad no puede ser 0' : null),
    (v) => (v !== '' && Number.isInteger(Number(v)) && stock + Number(v) < 0 ? `No puedes restar más de ${plural(stock, 'unidad', 'unidades')}` : null),
  ],
  motivo: [reglas.requerido('El motivo'), reglas.minimo('El motivo', 3)],
});

// Ajuste manual de stock: cantidad positiva suma, negativa resta
export default function AjusteStockModal({ producto, onClose, onSaved }) {
  const [form, setForm] = useState({ cantidad: '', motivo: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setForm({ cantidad: '', motivo: '' });
    setErrores({});
    setError('');
  }, [producto]);

  if (!producto) return null;

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrores((er) => ({ ...er, [name]: undefined }));
  };

  const resultado = form.cantidad !== '' && Number.isInteger(Number(form.cantidad)) ? producto.stock + Number(form.cantidad) : null;

  const guardar = async (e) => {
    e.preventDefault();
    const encontrados = validar(esquema(producto.stock), form);
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      await adjustStock({ product: producto._id, cantidad: Number(form.cantidad), motivo: form.motivo.trim() });
      toast.success(`Stock de "${producto.nombre}" ajustado`);
      onSaved();
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
      open
      onClose={onClose}
      size="sm"
      title="Ajustar stock"
      description={`${producto.nombre} · stock actual: ${producto.stock}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-ajuste" loading={enviando}>
            Guardar ajuste
          </Button>
        </>
      }
    >
      <form id="form-ajuste" onSubmit={guardar} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Input
          label="Cantidad"
          name="cantidad"
          type="number"
          step="1"
          value={form.cantidad}
          onChange={cambiar}
          error={errores.cantidad}
          hint={resultado !== null && resultado >= 0 ? `El stock quedará en ${plural(resultado, 'unidad', 'unidades')}` : 'Positiva para sumar, negativa para restar (ej. -3)'}
          required
        />
        <Input label="Motivo" name="motivo" value={form.motivo} onChange={cambiar} error={errores.motivo} maxLength={200} placeholder="Ej. Conteo físico, producto dañado" required />
      </form>
    </Modal>
  );
}
