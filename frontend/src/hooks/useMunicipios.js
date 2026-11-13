import { useEffect, useState } from 'react';
import { getMunicipios } from '../api/public';

// La lista vive en el backend (fuente única que también valida los destinos); se pide una sola vez por sesión
let cache = null;
let pendiente = null;

export default function useMunicipios() {
  const [mapa, setMapa] = useState(cache);

  useEffect(() => {
    if (cache) return undefined;
    pendiente ??= getMunicipios()
      .then((datos) => {
        cache = datos;
        return datos;
      })
      .catch(() => {
        pendiente = null;
        return null;
      });
    let activo = true;
    pendiente.then((datos) => activo && datos && setMapa(datos));
    return () => {
      activo = false;
    };
  }, []);

  return { municipiosDe: (departamento) => mapa?.[departamento] || [], cargando: !mapa };
}
