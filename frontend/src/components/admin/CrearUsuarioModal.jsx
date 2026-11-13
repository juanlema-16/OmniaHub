import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Alert from '../ui/Alert';
import { createUser } from '../../api/admin';
import { getErrorMessage } from '../../api/axios';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const VACIO = { nombre: '', apellido: '', email: '', telefono: '', password: '', role: 'transportadora', empresaNombre: '' };

const esquema = (form) => ({
  nombre: [reglas.requerido('El nombre'), reglas.minimo('El nombre', 2)],
  apellido: [reglas.requerido('El apellido'), reglas.minimo('El apellido', 2)],
  email: [reglas.requerido('El correo'), reglas.email],
  telefono: [reglas.requerido('El teléfono'), reglas.telefono],
  password: [reglas.requerido('La contraseña', 'a'), reglas.password],
  empresaNombre: form.role === 'transportadora' ? [reglas.requerido('El nombre de la transportadora'), reglas.minimo('El nombre de la transportadora', 2)] : [],
});

// El admin crea las cuentas de transportadora y de otros administradores
export default function CrearUsuarioModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(VACIO);
      setErrores({});
      setError('');
    }
  }, [open]);

  const cambiar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrores((er) => ({ ...er, [e.target.name]: undefined }));
    setError('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(esquema(form), form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      const user = await createUser({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        telefono: form.telefono.replace(/[\s-]/g, ''),
        password: form.password,
        role: form.role,
        empresaNombre: form.role === 'transportadora' ? form.empresaNombre.trim() : undefined,
      });
      toast.success(`Cuenta de ${user.nombre} ${user.apellido} creada`);
      onCreated();
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
      open={open}
      onClose={cerrar}
      title="Crear usuario"
      description="Las transportadoras y los administradores no se registran solos."
      footer={
        <>
          <Button variant="secondary" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-crear-usuario" icon={UserPlus} loading={enviando}>
            Crear usuario
          </Button>
        </>
      }
    >
      <form id="form-crear-usuario" onSubmit={enviar} className="space-y-4" noValidate>
        {error && !Object.values(errores).some(Boolean) && <Alert tone="error">{error}</Alert>}
        <Select
          label="Rol"
          name="role"
          value={form.role}
          onChange={cambiar}
          options={[
            { value: 'transportadora', label: 'Transportadora' },
            { value: 'admin', label: 'Administrador' },
          ]}
        />
        {form.role === 'transportadora' && (
          <Input
            label="Nombre de la transportadora"
            name="empresaNombre"
            value={form.empresaNombre}
            onChange={cambiar}
            error={errores.empresaNombre}
            hint="Se crea con tarifas iniciales de Q 35.00 y 3 días; ajústalas en Transportadoras."
            required
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" name="nombre" value={form.nombre} onChange={cambiar} error={errores.nombre} autoComplete="off" required />
          <Input label="Apellido" name="apellido" value={form.apellido} onChange={cambiar} error={errores.apellido} autoComplete="off" required />
        </div>
        <Input label="Correo" name="email" type="email" value={form.email} onChange={cambiar} error={errores.email} autoComplete="off" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Teléfono" name="telefono" type="tel" inputMode="numeric" maxLength={9} prefix="+502" value={form.telefono} onChange={cambiar} error={errores.telefono} required />
          <Input label="Contraseña inicial" name="password" type="password" value={form.password} onChange={cambiar} error={errores.password} autoComplete="new-password" hint="Mínimo 8 caracteres, con letras y números" required />
        </div>
      </form>
    </Modal>
  );
}
