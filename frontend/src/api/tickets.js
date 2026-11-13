import api from './axios';

const data = (res) => res.data.data;

export const listTickets = (params) => api.get('/tickets', { params }).then(data);
export const getTicket = (id) => api.get(`/tickets/${id}`).then(data);
export const createTicket = (body) => api.post('/tickets', body).then(data);
export const replyTicket = (id, texto) => api.post(`/tickets/${id}/messages`, { texto }).then(data);
export const changeTicketStatus = (id, estado) => api.patch(`/tickets/${id}/status`, { estado }).then(data);
