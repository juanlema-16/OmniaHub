export const sendOk = (res, data = null, message = 'OK', status = 200) =>
  res.status(status).json({ ok: true, data, message });
