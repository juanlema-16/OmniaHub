import api from './axios';

const data = (res) => res.data.data;

export const listMovements = (params) => api.get('/inventory/movements', { params }).then(data);
export const getLowStock = () => api.get('/inventory/low-stock').then(data);
export const adjustStock = (body) => api.post('/inventory/adjust', body).then(data);
