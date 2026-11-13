import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import Field, { controlClass } from './Field';

// options: [{ value, label }] o arreglo de textos
const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder, required, className = '', id: idProp, ...props },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;
  const opciones = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={controlClass(error, 'h-10 appearance-none pl-3 pr-9')}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {opciones.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      </div>
    </Field>
  );
});

export default Select;
