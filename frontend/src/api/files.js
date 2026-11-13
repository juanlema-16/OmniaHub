import api from './axios';

// Archivos privados (KYC, comprobantes): se piden con el token y se muestran como blob
export const fetchPrivateFile = (url) =>
  api.get(url.replace(/^\/api/, ''), { responseType: 'blob' }).then((res) => res.data);
