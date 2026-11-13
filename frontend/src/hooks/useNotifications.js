import { useCallback, useEffect, useState } from 'react';
import * as notificationsApi from '../api/notifications';

// Contador y últimas notificaciones para la campana del header (se refresca cada 30 s)
export default function useNotifications({ intervalo = 30_000 } = {}) {
  const [noLeidas, setNoLeidas] = useState(0);
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);

  const refrescarContador = useCallback(async () => {
    try {
      setNoLeidas(await notificationsApi.unreadCount());
    } catch {
      // Si falla (sin conexión), se conserva el último valor
    }
  }, []);

  const cargarUltimas = useCallback(async () => {
    setCargando(true);
    try {
      const data = await notificationsApi.listNotifications({ limit: 6 });
      setItems(data.items);
      setNoLeidas(data.noLeidas);
    } finally {
      setCargando(false);
    }
  }, []);

  const marcarLeida = useCallback(async (id) => {
    await notificationsApi.markRead(id);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, leida: true } : n)));
    setNoLeidas((n) => Math.max(0, n - 1));
  }, []);

  const marcarTodas = useCallback(async () => {
    await notificationsApi.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
  }, []);

  useEffect(() => {
    refrescarContador();
    const t = setInterval(refrescarContador, intervalo);
    return () => clearInterval(t);
  }, [refrescarContador, intervalo]);

  return { noLeidas, items, cargando, cargarUltimas, marcarLeida, marcarTodas, refrescarContador };
}
