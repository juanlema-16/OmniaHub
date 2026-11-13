import api from './axios';

const data = (res) => res.data.data;

export const listNotifications = (params) => api.get('/notifications', { params }).then(data);
export const unreadCount = () => api.get('/notifications/unread-count').then((res) => res.data.data.noLeidas);
export const markRead = (id) => api.patch(`/notifications/${id}/read`).then(data);
export const markAllRead = () => api.patch('/notifications/read-all').then(data);
