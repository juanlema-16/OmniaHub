import api from './axios';

const data = (res) => res.data.data;

export const getMyStore = () => api.get('/my-store').then(data);
export const updateMyStore = (formData) => api.patch('/my-store', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(data);
