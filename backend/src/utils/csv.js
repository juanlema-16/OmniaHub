// Evita que Excel interprete un texto como fórmula (inyección CSV)
export const celda = (valor) => {
  let texto = valor === undefined || valor === null ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
};

// CSV con BOM para que Excel abra bien los acentos
export const toCsv = (encabezado, filas) =>
  `﻿${[encabezado, ...filas].map((fila) => fila.map(celda).join(',')).join('\r\n')}\r\n`;

export const sendCsv = (res, nombre, contenido) => {
  const fecha = new Date().toISOString().slice(0, 10);
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${nombre}-${fecha}.csv"`,
    'Cache-Control': 'no-store',
  });
  res.send(contenido);
};

export const fechaGt = (fecha) =>
  fecha ? new Date(fecha).toLocaleString('es-GT', { timeZone: 'America/Guatemala' }) : '';
