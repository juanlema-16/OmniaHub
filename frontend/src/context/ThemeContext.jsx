import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CLAVE = 'omniahub_tema';

const guardado = () => {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
};

// La primera vez se usa la preferencia del sistema; después manda lo que la persona elija
const inicial = () => guardado() || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(inicial);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark');
    document.documentElement.style.colorScheme = tema;
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((actual) => {
      const siguiente = actual === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(CLAVE, siguiente);
      } catch {
        // Sin almacenamiento: el cambio vale mientras la pestaña esté abierta
      }
      return siguiente;
    });
  }, []);

  const value = useMemo(() => ({ tema, oscuro: tema === 'dark', alternar }), [tema, alternar]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
};
