// "1 pedido", "3 pedidos", "2 notificaciones": plural en español sin "(s)" ni "(es)"
export const pluralDe = (palabra) => {
  if (/ión$/.test(palabra)) return palabra.replace(/ión$/, 'iones');
  if (/[aeiouáéó]$/i.test(palabra)) return `${palabra}s`;
  if (/z$/.test(palabra)) return palabra.replace(/z$/, 'ces');
  return `${palabra}es`;
};

export const plural = (n, singular, formaPlural = pluralDe(singular)) => `${n} ${n === 1 ? singular : formaPlural}`;
