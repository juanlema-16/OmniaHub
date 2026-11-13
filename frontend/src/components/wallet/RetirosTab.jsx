import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HandCoins, Landmark, Send } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { listBankAccounts } from '../../api/bankAccounts';
import { createWithdrawal, listWithdrawals } from '../../api/wallet';
import { getErrorMessage } from '../../api/axios';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Alert from '../ui/Alert';
import { SOLICITUD_ESTADO, TIPO_CUENTA } from '../../utils/constants';
import { formatFechaHora } from '../../utils/dates';
import { formatQ } from '../../utils/formatQ';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

export const etiquetaCuenta = (c) => `${c.banco} · ${TIPO_CUENTA[c.tipoCuenta] || c.tipoCuenta} ···· ${c.numeroCuenta.slice(-4)}`;

const VACIO = { monto: '', bankAccount: '', concepto: '' };

export default function RetirosTab({ role, resumen, version, onChange, onIrACuentas }) {
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);

  const cuentas = useAsync(listBankAccounts, [version]);
  const retiros = useAsync(() => listWithdrawals({ estado: estado || undefined, page, limit: 10 }), [estado, page, version]);
  useEffect(() => setPage(1), [estado]);

  const minimo = resumen?.montoMinimoRetiro ?? 100;
  const disponible = resumen?.saldoDisponible ?? 0;
  const puedeRetirar = resumen?.puedeRetirar !== false;
  const sinCuentas = cuentas.data && cuentas.data.length === 0;

  const esquema = {
    monto: [
      reglas.requerido('El monto'),
      reglas.positivo('El monto'),
      (v) => (Number(v) > 0 && Number(v) < minimo ? `El retiro mínimo es ${formatQ(minimo)}` : null),
      (v) => (Number(v) > disponible ? `Solo tienes ${formatQ(disponible)} disponibles` : null),
    ],
    bankAccount: [(v) => (!v ? 'Selecciona una cuenta bancaria' : null)],
    concepto: [reglas.requerido('El concepto'), reglas.minimo('El concepto', 3)],
  };

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrores((er) => ({ ...er, [name]: undefined }));
    setError('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(esquema, form);
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      await createWithdrawal({ monto: Number(form.monto), bankAccount: form.bankAccount, concepto: form.concepto.trim() });
      toast.success(`Retiro solicitado. ${formatQ(form.monto)} quedan reservados hasta su aprobación`);
      setForm(VACIO);
      onChange();
    } catch (err) {
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  const columnas = [
    { key: 'fecha', header: 'Fecha', render: (r) => <span className="whitespace-nowrap text-slate-600">{formatFechaHora(r.createdAt)}</span> },
    { key: 'monto', header: 'Monto', align: 'right', render: (r) => <span className="font-semibold text-slate-900">{formatQ(r.monto)}</span> },
    { key: 'cuenta', header: 'Cuenta', render: (r) => (r.bankAccount ? <span className="whitespace-nowrap">{etiquetaCuenta(r.bankAccount)}</span> : <span className="text-slate-400">Cuenta eliminada</span>) },
    { key: 'concepto', header: 'Concepto', render: (r) => <span className="block max-w-xs truncate" title={r.concepto}>{r.concepto}</span> },
    {
      key: 'estado',
      header: 'Estado',
      render: (r) => (
        <Badge tone={SOLICITUD_ESTADO[r.estado].tone} dot>
          {SOLICITUD_ESTADO[r.estado].label}
        </Badge>
      ),
    },
    {
      key: 'detalle',
      header: 'Detalle',
      render: (r) => (
        <div className="max-w-xs text-xs text-slate-500">
          {r.estado === 'RECHAZADA' && r.motivo && <p className="text-danger">Motivo: {r.motivo}</p>}
          {r.estado === 'PENDIENTE' ? <p>El monto está reservado</p> : r.revisadoPor && <p>Revisó {r.revisadoPor.nombre} {r.revisadoPor.apellido}</p>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card title="Solicitar un retiro" description={`Mínimo ${formatQ(minimo)}. Tienes ${formatQ(disponible)} disponibles.`}>
        {!puedeRetirar && (
          <Alert tone="warning" title="Verifica tu identidad para retirar" className="mb-4" action={<Link to={`/${role}/kyc`} className="inline-flex h-8 items-center rounded-lg bg-white px-3 text-xs font-medium text-amber-800 shadow-sm ring-1 ring-amber-200 hover:bg-amber-100">Ir a verificación</Link>}>
            Necesitas el KYC aprobado para pedir retiros.
          </Alert>
        )}
        {sinCuentas && (
          <Alert tone="info" title="Aún no tienes cuentas bancarias" className="mb-4" action={<Button size="sm" variant="secondary" onClick={onIrACuentas}>Agregar cuenta</Button>}>
            Registra una cuenta para decirnos adónde enviar tu dinero.
          </Alert>
        )}
        {error && <Alert tone="error" className="mb-4">{error}</Alert>}
        <form onSubmit={enviar} className="grid gap-4 md:grid-cols-2" noValidate>
          <Input label="Monto a retirar" name="monto" type="number" inputMode="decimal" min="0" step="0.01" prefix="Q" value={form.monto} onChange={cambiar} error={errores.monto} disabled={!puedeRetirar} required />
          <Select
            label="Cuenta bancaria"
            name="bankAccount"
            value={form.bankAccount}
            onChange={cambiar}
            error={errores.bankAccount}
            placeholder="Selecciona una cuenta"
            options={(cuentas.data || []).map((c) => ({ value: c._id, label: etiquetaCuenta(c) }))}
            disabled={!puedeRetirar}
            required
          />
          <Input className="md:col-span-2" label="Concepto del retiro" name="concepto" icon={Landmark} value={form.concepto} onChange={cambiar} error={errores.concepto} maxLength={200} placeholder="Ej. Ganancias de la semana" disabled={!puedeRetirar} required />
          <div className="flex justify-end md:col-span-2">
            <Button type="submit" icon={Send} loading={enviando} disabled={!puedeRetirar}>
              Solicitar retiro
            </Button>
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Historial de retiros</h2>
        {retiros.error && <Alert tone="error" className="mb-3">{retiros.error}</Alert>}
        <Table
          columns={columnas}
          data={retiros.data?.items || []}
          loading={retiros.cargando}
          filters={<Select aria-label="Estado del retiro" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Todos los estados" options={Object.entries(SOLICITUD_ESTADO).map(([value, s]) => ({ value, label: s.label }))} className="w-48" />}
          pagination={retiros.data && { page: retiros.data.page, pages: retiros.data.pages, total: retiros.data.total, onPageChange: setPage }}
          emptyIcon={HandCoins}
          emptyTitle={estado ? 'No hay retiros con ese estado' : 'Aún no has pedido retiros'}
          emptyDescription={estado ? undefined : 'Cuando solicites uno aparecerá aquí con su estado.'}
        />
      </div>
    </div>
  );
}
