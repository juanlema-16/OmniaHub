import api from './axios';

const data = (res) => res.data.data;

export const listBankAccounts = () => api.get('/bank-accounts').then(data);
export const createBankAccount = (body) => api.post('/bank-accounts', body).then(data);
export const updateBankAccount = (id, body) => api.patch(`/bank-accounts/${id}`, body).then(data);
export const removeBankAccount = (id) => api.delete(`/bank-accounts/${id}`).then((res) => res.data);
