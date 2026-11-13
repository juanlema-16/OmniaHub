import api from './axios';

export const getSummary = (params) => api.get('/reports/summary', { params }).then((res) => res.data.data);
