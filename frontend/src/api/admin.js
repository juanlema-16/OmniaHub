import api from './axios';

const data = (res) => res.data.data;
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

// Usuarios
export const listUsers = (params) => api.get('/admin/users', { params }).then(data);
export const getUser = (id) => api.get(`/admin/users/${id}`).then(data);
export const createUser = (body) => api.post('/admin/users', body).then(data);
export const setUserStatus = (id, body) => api.patch(`/admin/users/${id}/status`, body).then(data);

// KYC
export const listKyc = (params) => api.get('/admin/kyc', { params }).then(data);
export const reviewKyc = (userId, body) => api.patch(`/admin/kyc/${userId}`, body).then(data);

// Recargas y retiros
export const listTopUps = (params) => api.get('/admin/topups', { params }).then(data);
export const reviewTopUp = (id, body) => api.patch(`/admin/topups/${id}`, body).then(data);
export const listWithdrawals = (params) => api.get('/admin/withdrawals', { params }).then(data);
export const reviewWithdrawal = (id, body) => api.patch(`/admin/withdrawals/${id}`, body).then(data);

// Configuración
export const getSettings = () => api.get('/admin/settings').then(data);
export const updateSettings = (body) => api.put('/admin/settings', body).then(data);

// Transportadoras
export const listCarriers = () => api.get('/admin/carriers').then(data);
export const updateCarrier = (id, body) => api.patch(`/admin/carriers/${id}`, body).then(data);
export const updateTarifas = (id, tarifas) => api.put(`/admin/carriers/${id}/tarifas`, { tarifas }).then(data);

// Banners (la imagen viaja como multipart)
export const listBanners = () => api.get('/admin/banners').then(data);
export const createBanner = (form) => api.post('/admin/banners', form, MULTIPART).then(data);
export const updateBanner = (id, form) => api.patch(`/admin/banners/${id}`, form, MULTIPART).then(data);
export const deleteBanner = (id) => api.delete(`/admin/banners/${id}`).then(data);

// Políticas y auditoría
export const listPolicies = () => api.get('/admin/policies').then(data);
export const updatePolicy = (slug, body) => api.put(`/admin/policies/${slug}`, body).then(data);
export const listAudit = (params) => api.get('/admin/audit', { params }).then(data);
