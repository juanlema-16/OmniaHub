import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { updateCarrier } from '../../api/admin';
import { getErrorMessage } from '../../api/axios';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const ESQUEMA = {
  nombre: [reglas.requerido('El nombre'), reglas.minimo('El nombre', 2)],
  logo: [(v) => (v && !/^(\/|https?:\/\/)/.test(v.trim()) ? 'El logo debe ser una ruta que empiece con / o una URL https://' : null)],
};

export default function CarrierEditModal({ carrier, onClose, onSaved }) {
  const [form, setForm] = useState({ nombre: '', logo: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (carrier) {
      setForm({ nombre: carrier.nombre, logo: carrier.logo || '' });
      setErrores({});
      setError('');
    }
  }, [carrier]);

  if (!carrier) return null;

  const cambiar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrores((er) => ({ ...er, [e.target.name]: undefined }));
    setError('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(ESQUEMA, form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      await updateCarrier(carrier._id, { nombre: form.nombre.trim(), logo: form.logo.trim() });
      toast.success('Transportadora actualizada');
      onSaved();
      onClose();
    } catch (err) {
      setErrores(erroresDeApi(err));
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
      title="Editar transportadora"
      footer={
        <>
          <Button variant="secondary" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-carrier" icon={Save} loading={enviando}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-carrier" onSubmit={enviar} className="space-y-4" noValidate>
        {error && !Object.values(errores).some(Boolean) && <Alert tone="error">{error}</Alert>}
        <Input label="Nombre" name="nombre" value={form.nombre} onChange={cambiar} error={errores.nombre} maxLength={60} required />
        <Input label="Logo (opcional)" name="logo" value={form.logo} onChange={cambiar} error={errores.logo} placeholder="https://…" hint="Ruta o URL de la imagen del logo" />
      </form>
    </Modal>
  );
}
