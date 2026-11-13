import { forwardRef, useId } from 'react';
import Field, { controlClass } from './Field';

const Textarea = forwardRef(function Textarea({ label, error, hint, required, className = '', id: idProp, rows = 3, ...props }, ref) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={controlClass(error, 'resize-y px-3 py-2')}
        {...props}
      />
    </Field>
  );
});

export default Textarea;
