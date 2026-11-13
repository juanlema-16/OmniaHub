import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import usePrivateImage from '../../hooks/usePrivateImage';
import Skeleton from '../ui/Skeleton';
import Modal from '../ui/Modal';

// Imagen protegida con token (KYC): miniatura y, al hacer clic, vista ampliada
export default function ImagenPrivada({ url, label }) {
  const { src, error } = usePrivateImage(url);
  const [ampliada, setAmpliada] = useState(false);

  return (
    <figure>
      <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {src ? (
          <button type="button" onClick={() => setAmpliada(true)} className="group relative block h-full w-full" aria-label={`Ampliar ${label}`}>
            <img src={src} alt={label} className="h-full w-full object-cover" />
            <span className="absolute right-2 top-2 rounded-md bg-slate-900/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        ) : error ? (
          <p className="p-4 text-xs text-slate-500">No se pudo cargar la imagen</p>
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
      </div>
      <figcaption className="mt-1.5 text-xs text-slate-500">{label}</figcaption>
      <Modal open={ampliada} onClose={() => setAmpliada(false)} title={label} size="xl">
        {src && <img src={src} alt={label} className="mx-auto max-h-[70vh] w-auto rounded-lg object-contain" />}
      </Modal>
    </figure>
  );
}
