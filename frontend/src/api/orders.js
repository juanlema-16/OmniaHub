import api from './axios';

const data = (res) => res.data.data;

export const listOrders = (params) => api.get('/orders', { params }).then(data);
export const getOrder = (id) => api.get(`/orders/${id}`).then(data);
