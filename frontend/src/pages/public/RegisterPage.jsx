import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Check, Lock, Mail, Phone, ShoppingBag, Store, User } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { register } from '../../api/auth';
import { getErrorMessage } from '../../api/axios';
import { ROLES_REGISTRO } from '../../utils/constants';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const ICONOS = { dropshipper: Store, proveedor: Building2, cliente: ShoppingBag };

const INICIAL = { role: 'dropshipper', nombre: '', apellido: '', email: '', telefono: '', password: '', confirmar: '', tiendaNombre: '', empresaNombre: '' };

const esquemaPara = (role) => ({
  nombre: [reglas.requerido('El nombre'), reglas.minimo('El nombre', 2)],
  apellido: [reglas.requerido('El apellido'), reglas.minimo('El apellido', 2)],
  email: [reglas.requerido('El correo'), reglas.email],
  telefono: [reglas.requerido('El teléfono'), reglas.telefono],
  password: [reglas.requerido('La contraseña', 'a'), reglas.password],
  confirmar: [reglas.requerido('La confirmación', 'a'), reglas.igual('password', 'Las contraseñas no coinciden')],
  ...(role === 'dropshipper' ? { tiendaNombre: [reglas.minimo('El nombre de la tienda', 3)] } : {}),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrores((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(esquemaPara(form.role), form);
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    try {
      const { confirmar, tiendaNombre, empresaNombre, ...datos } = form;
      const payload = {
        ...datos,
        email: datos.email.trim(),
        telefono: datos.telefono.replace(/[\s-]/g, ''),
        ...(form.role === 'dropshipper' && tiendaNombre.trim() ? { tiendaNombre: tiendaNombre.trim() } : {}),
        ...(form.role === 'proveedor' && empresaNombre.trim() ? { empresaNombre: empresaNombre.trim() } : {}),
      };
      const { user, devCode } = await register(payload);
      toast.success('Cuenta creada. Revisa tu correo');
      navigate('/verificar-correo', { state: { email: user.email, devCode } });
    } catch (err) {
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Elige cómo quieres usar OmniaHub."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-5" noValidate>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Quiero registrarme como</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {ROLES_REGISTRO.map((r) => {
              const Icon = ICONOS[r.value];
              const activo = form.role === r.value;
              return (
                <label
                  key={r.value}
                  className={`relative flex cursor-pointer flex-col rounded-xl border p-3 transition-colors ${
                    activo ? 'border-primary bg-primary-50 ring-1 ring-primary' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input type="radio" name="role" value={r.value} checked={activo} onChange={cambiar} className="sr-only" />
                  <span className="flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${activo ? 'text-primary' : 'text-slate-400'}`} aria-hidden="true" />
                    {activo && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
                  </span>
                  <span className="mt-2 text-sm font-semibold text-slate-900">{r.label}</span>
                  <span className="mt-0.5 text-xs leading-snug text-slate-500">{r.descripcion}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" name="nombre" icon={User} autoComplete="given-name" value={form.nombre} onChange={cambiar} error={errores.nombre} required />
          <Input label="Apellido" name="apellido" autoComplete="family-name" value={form.apellido} onChange={cambiar} error={errores.apellido} required />
        </div>
        <Input label="Correo electrónico" name="email" type="email" icon={Mail} autoComplete="email" value={form.email} onChange={cambiar} error={errores.email} placeholder="nombre@correo.com" required />
        <Input
          label="Teléfono"
          name="telefono"
          type="tel"
          inputMode="numeric"
          icon={Phone}
          autoComplete="tel-national"
          value={form.telefono}
          onChange={cambiar}
          error={errores.telefono}
          placeholder="5555 1234"
          hint="8 dígitos, sin el +502"
          maxLength={9}
          required
        />
        {form.role === 'dropshipper' && (
          <Input label="Nombre de tu tienda" name="tiendaNombre" icon={Store} value={form.tiendaNombre} onChange={cambiar} error={errores.tiendaNombre} placeholder="Ej. Tienda Chapina" hint="Puedes cambiarlo después" />
        )}
        {form.role === 'proveedor' && (
          <Input label="Nombre de tu empresa" name="empresaNombre" icon={Building2} value={form.empresaNombre} onChange={cambiar} error={errores.empresaNombre} placeholder="Ej. Distribuidora Maya" />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Contraseña" name="password" type="password" icon={Lock} autoComplete="new-password" value={form.password} onChange={cambiar} error={errores.password} hint="Mínimo 8, con letras y números" required />
          <Input label="Confirmar contraseña" name="confirmar" type="password" autoComplete="new-password" value={form.confirmar} onChange={cambiar} error={errores.confirmar} required />
        </div>

        <Button type="submit" fullWidth size="lg" loading={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
        <p className="text-center text-xs text-slate-500">
          Al registrarte aceptas los Términos y condiciones y la Política de privacidad de OmniaHub.
        </p>
      </form>
    </AuthLayout>
  );
}
