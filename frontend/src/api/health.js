import api from './axios';

export const getHealth = () => api.get('/health').then((res) => res.data.data);
