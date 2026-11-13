import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/axios';

// Ejecuta una llamada a la API y expone { data, cargando, error, recargar }.
// Ignora respuestas viejas si las dependencias cambian antes de que termine.
export default function useAsync(fn, deps = [], { inmediato = true } = {}) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(inmediato);
  const [error, setError] = useState('');
  const ultimo = useRef(0);

  const ejecutar = useCallback(async () => {
    const id = ++ultimo.current;
    setCargando(true);
    setError('');
    try {
      const resultado = await fn();
      if (id === ultimo.current) setData(resultado);
      return resultado;
    } catch (err) {
      if (id === ultimo.current) setError(getErrorMessage(err));
      return null;
    } finally {
      if (id === ultimo.current) setCargando(false);
    }
  }, deps);

  useEffect(() => {
    if (inmediato) ejecutar();
  }, [ejecutar, inmediato]);

  return { data, setData, cargando, error, recargar: ejecutar };
}
