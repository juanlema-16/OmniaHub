import api from './axios';

export const listCustomers = (params) => api.get('/customers', { params }).then((res) => res.data.data);
