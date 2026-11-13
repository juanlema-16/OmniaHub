import api from './axios';

const data = (res) => res.data.data;

export const listOrders = (params) => api.get('/orders', { params }).then(data);
export const getOrder = (id) => api.get(`/orders/${id}`).then(data);
export const previewOrder = (body) => api.post('/orders/preview', body).then(data);
export const createOrder = (body) => api.post('/orders', body).then(data);
export const changeOrderStatus = (id, body) => api.patch(`/orders/${id}/status`, body).then(data);
export const solveNovedad = (id, body) => api.post(`/orders/${id}/novedad/solucion`, body).then(data);
