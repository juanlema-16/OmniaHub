import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Field, { controlClass } from './Field';

const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, prefix, type = 'text', required, className = '', id: idProp, ...props },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;
  const [visible, setVisible] = useState(false);
  const esPassword = type === 'password';

  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{prefix}</span>}
        <input
          ref={ref}
          id={id}
          type={esPassword && visible ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={controlClass(error, `h-10 ${Icon ? 'pl-10' : prefix ? (String(prefix).length > 2 ? 'pl-14' : 'pl-8') : 'pl-3'} ${esPassword ? 'pr-10' : 'pr-3'}`)}
          {...props}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </Field>
  );
});

export default Input;
