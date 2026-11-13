// Reglas de formularios (sección 15). Cada regla devuelve un mensaje en español o null.
export const reglas = {
  // genero: 'o' (el correo es obligatorio) o 'a' (la contraseña es obligatoria)
  requerido: (label, genero = 'o') => (v) =>
    v === undefined || v === null || String(v).trim() === '' ? `${label} es obligatori${genero}` : null,
  minimo: (label, n) => (v) => (v && String(v).trim().length < n ? `${label} debe tener al menos ${n} caracteres` : null),
  email: (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) ? 'Ingresa un correo válido (ej. nombre@correo.com)' : null),
  telefono: (v) => (v && !/^\d{8}$/.test(String(v).replace(/[\s-]/g, '')) ? 'El teléfono debe tener 8 dígitos' : null),
  password: (v) => {
    if (!v) return null;
    if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Za-z]/.test(v)) return 'La contraseña debe tener al menos una letra';
    if (!/\d/.test(v)) return 'La contraseña debe tener al menos un número';
    return null;
  },
  igual: (otro, mensaje) => (v, valores) => (v !== valores[otro] ? mensaje : null),
  positivo: (label) => (v) => (v !== '' && v !== undefined && !(Number(v) > 0) ? `${label} debe ser mayor a 0` : null),
  codigo6: (v) => (v && !/^\d{6}$/.test(v) ? 'El código tiene 6 dígitos' : null),
};

// Aplica las reglas de un esquema { campo: [regla, ...] } y devuelve { campo: mensaje }
export const validar = (esquema, valores) =>
  Object.fromEntries(
    Object.entries(esquema)
      .map(([campo, lista]) => [campo, lista.map((regla) => regla(valores[campo], valores)).find(Boolean)])
      .filter(([, mensaje]) => mensaje)
  );

// Convierte los errores de la API ([{ campo, mensaje }]) al formato de los formularios
export const erroresDeApi = (error) => {
  const lista = error?.response?.data?.errors;
  if (!Array.isArray(lista)) return {};
  return Object.fromEntries(lista.filter((e) => e.campo).map((e) => [e.campo.split('.').pop(), e.mensaje]));
};
