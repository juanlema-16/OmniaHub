import api from './axios';

export const getSummary = (params) => api.get('/reports/summary', { params }).then((res) => res.data.data);

// Descarga el CSV de órdenes del período (el backend agrega BOM para que Excel respete los acentos)
export const exportOrders = async (params) => {
  const res = await api.get('/reports/orders/export', { params, responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ordenes-${params.desde || 'periodo'}-${params.hasta || 'hoy'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
