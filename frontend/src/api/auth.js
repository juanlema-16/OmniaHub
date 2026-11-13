import api from './axios';

const data = (res) => res.data.data;

export const login = (credenciales) => api.post('/auth/login', credenciales).then(data);
export const register = (datos) => api.post('/auth/register', datos).then(data);
export const verifyEmail = (email, code) => api.post('/auth/verify-email', { email, code }).then(data);
export const resendCode = (email) => api.post('/auth/resend-code', { email }).then(data);
export const me = () => api.get('/auth/me').then(data);
