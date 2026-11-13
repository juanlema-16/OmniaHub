import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Landmark, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { createBankAccount, listBankAccounts, removeBankAccount, updateBankAccount } from '../../api/bankAccounts';
import { getErrorMessage } from '../../api/axios';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import { BANCOS, TIPO_CUENTA } from '../../utils/constants';
import { erroresDeApi, reglas, validar } from '../../utils/validation';
import { plural } from '../../utils/plural';

const MAX_CUENTAS = 5;
const VACIO = { banco: '', tipoCuenta: 'MONETARIA', numeroCuenta: '', titular: '' };

const ESQUEMA = {
  banco: [(v) => (!v ? 'Selecciona un banco' : null)],
  tipoCuenta: [(v) => (!v ? 'Selecciona el tipo de cuenta' : null)],
  numeroCuenta: [reglas.requerido('El número de cuenta'), (v) => (v && !/^\d{6,20}$/.test(v.replace(/[\s-]/g, '')) ? 'El número de cuenta debe tener entre 6 y 20 dígitos' : null)],
  titular: [reglas.requerido('El titular'), reglas.minimo('El titular', 3)],
};

function CuentaModal({ cuenta, onClose, onSaved }) {
  const editando = Boolean(cuenta?._id);
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cuenta) return;
    setForm(editando ? { banco: cuenta.banco, tipoCuenta: cuenta.tipoCuenta, numeroCuenta: cuenta.numeroCuenta, titular: cuenta.titular } : VACIO);
    setErrores({});
    setError('');
  }, [cuenta, editando]);

  if (!cuenta) return null;

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrores((er) => ({ ...er, [name]: undefined }));
    setError('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    const encontrados = validar(ESQUEMA, form);
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;
    const body = { ...form, numeroCuenta: form.numeroCuenta.replace(/[\s-]/g, ''), titular: form.titular.trim() };
    setEnviando(true);
    try {
      if (editando) await updateBankAccount(cuenta._id, body);
      else await createBankAccount(body);
      toast.success(editando ? 'Cuenta actualizada' : 'Cuenta agregada');
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
      title={editando ? 'Editar cuenta bancaria' : 'Agregar cuenta bancaria'}
      description="Aquí recibirás el dinero de tus retiros. Verifica que los datos sean correctos."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-cuenta" loading={enviando}>
            {editando ? 'Guardar cambios' : 'Agregar cuenta'}
          </Button>
        </>
      }
    >
      <form id="form-cuenta" onSubmit={guardar} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Banco" name="banco" value={form.banco} onChange={cambiar} error={errores.banco} placeholder="Selecciona" options={BANCOS} required />
          <Select label="Tipo de cuenta" name="tipoCuenta" value={form.tipoCuenta} onChange={cambiar} error={errores.tipoCuenta} options={Object.entries(TIPO_CUENTA).map(([value, label]) => ({ value, label }))} required />
        </div>
        <Input label="Número de cuenta" name="numeroCuenta" inputMode="numeric" icon={Landmark} value={form.numeroCuenta} onChange={cambiar} error={errores.numeroCuenta} maxLength={24} placeholder="Solo números" required />
        <Input label="Titular de la cuenta" name="titular" icon={UserRound} value={form.titular} onChange={cambiar} error={errores.titular} maxLength={120} placeholder="Nombre completo del titular" required />
      </form>
    </Modal>
  );
}

export default function CuentasTab({ version, onChange }) {
  const cuentas = useAsync(listBankAccounts, [version]);
  const [editar, setEditar] = useState(null);
  const [eliminar, setEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const lista = cuentas.data || [];
  const llena = lista.length >= MAX_CUENTAS;

  const confirmarEliminar = async () => {
    setEliminando(true);
    try {
      await removeBankAccount(eliminar._id);
      toast.success('Cuenta eliminada');
      setEliminar(null);
      onChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{cuentas.data ? `${plural(lista.length, 'cuenta registrada', 'cuentas registradas')} de ${MAX_CUENTAS} permitidas.` : 'Cargando tus cuentas…'}</p>
        <Button icon={Plus} onClick={() => setEditar({})} disabled={llena} title={llena ? `Puedes registrar máximo ${MAX_CUENTAS} cuentas` : undefined}>
          Agregar cuenta
        </Button>
      </div>
      {cuentas.error && <Alert tone="error">{cuentas.error}</Alert>}

      {cuentas.cargando && !cuentas.data && (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}
      {cuentas.data && !lista.length && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <EmptyState icon={Landmark} title="Aún no tienes cuentas bancarias" description="Agrega una para poder solicitar retiros." />
        </div>
      )}
      {lista.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {lista.map((c) => (
            <article key={c._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <Landmark className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{c.banco}</p>
                  <p className="font-mono text-sm text-slate-700">{c.numeroCuenta}</p>
                  <p className="truncate text-sm text-slate-500">{c.titular}</p>
                </div>
                <Badge tone="slate">{TIPO_CUENTA[c.tipoCuenta]}</Badge>
              </div>
              <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3">
                <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditar(c)} aria-label={`Editar la cuenta de ${c.banco} terminada en ${c.numeroCuenta.slice(-4)}`}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setEliminar(c)} aria-label={`Eliminar la cuenta de ${c.banco} terminada en ${c.numeroCuenta.slice(-4)}`}>
                  Eliminar
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <CuentaModal cuenta={editar} onClose={() => setEditar(null)} onSaved={onChange} />
      <Modal
        open={Boolean(eliminar)}
        onClose={() => setEliminar(null)}
        size="sm"
        title="¿Eliminar esta cuenta?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEliminar(null)} disabled={eliminando}>
              Cancelar
            </Button>
            <Button variant="danger" icon={Trash2} loading={eliminando} onClick={confirmarEliminar}>
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {eliminar?.banco} · {eliminar?.numeroCuenta}. Tus retiros anteriores conservan su historial, pero ya no podrás usarla en nuevos retiros.
        </p>
      </Modal>
    </div>
  );
}
