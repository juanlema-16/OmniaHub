// Convierte **texto** en negrita
const conNegritas = (texto) => texto.split(/\*\*(.+?)\*\*/g).map((parte, i) => (i % 2 ? <strong key={i} className="font-semibold text-slate-900">{parte}</strong> : parte));

// Contenido de una política: títulos "## ", listas "- ", negritas **así** y párrafos separados por línea en blanco
export default function PoliticaVista({ titulo, contenido }) {
  const bloques = contenido
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <article className="space-y-3 text-sm leading-relaxed text-slate-700">
      <h2 className="text-xl font-bold text-slate-900">{titulo}</h2>
      {bloques.map((bloque, i) => {
        const lineas = bloque.split('\n');
        const esTitulo = lineas[0].startsWith('## ');
        const resto = esTitulo ? lineas.slice(1) : lineas;
        return (
          <section key={i} className="space-y-1.5">
            {esTitulo && <h3 className="text-base font-semibold text-slate-900">{lineas[0].replace(/^##\s+/, '')}</h3>}
            {resto.every((l) => l.startsWith('- ')) && resto.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5">
                {resto.map((l, j) => (
                  <li key={j}>{conNegritas(l.slice(2))}</li>
                ))}
              </ul>
            ) : (
              resto.length > 0 && <p className="whitespace-pre-line">{resto.join('\n')}</p>
            )}
          </section>
        );
      })}
    </article>
  );
}
