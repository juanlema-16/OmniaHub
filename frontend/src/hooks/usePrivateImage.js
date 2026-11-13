import { useEffect, useState } from 'react';
import { fetchPrivateFile } from '../api/files';

// Las imágenes privadas (/api/...) necesitan el token; las públicas se usan tal cual
export default function usePrivateImage(url) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return undefined;
    if (!url.startsWith('/api/')) {
      setSrc(url);
      return undefined;
    }
    let objectUrl;
    let cancelado = false;
    fetchPrivateFile(url)
      .then((blob) => {
        if (cancelado) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => !cancelado && setError(true));
    return () => {
      cancelado = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { src, error };
}
