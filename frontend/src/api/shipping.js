import api from './axios';

const data = (res) => res.data.data;

export const quoteShipping = (departamento) => api.get('/shipping/quote', { params: { departamento } }).then(data);
export const getCarriers = () => api.get('/shipping/carriers').then(data);
export const getPreferences = () => api.get('/shipping/preferences').then(data);
export const setPreference = (body) => api.put('/shipping/preferences', body).then(data);
export const deletePreference = (departamento) => api.delete(`/shipping/preferences/${encodeURIComponent(departamento)}`).then(data);
