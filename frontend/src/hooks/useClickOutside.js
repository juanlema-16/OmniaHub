import { useEffect } from 'react';

export default function useClickOutside(ref, onOutside, activo = true) {
  useEffect(() => {
    if (!activo) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    const esc = (e) => e.key === 'Escape' && onOutside();
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [ref, onOutside, activo]);
}
