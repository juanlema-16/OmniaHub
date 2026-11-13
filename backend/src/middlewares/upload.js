import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');

const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const PDF_TYPES = { 'application/pdf': '.pdf' };

export const uploadPath = (folder, filename) => path.join(UPLOADS_DIR, folder, filename);

export const imageUpload = (folder, { maxMB = 5, allowPdf = false } = {}) => {
  const dir = path.join(UPLOADS_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  const types = allowPdf ? { ...IMAGE_TYPES, ...PDF_TYPES } : IMAGE_TYPES;

  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${types[file.mimetype]}`),
    }),
    limits: { fileSize: maxMB * 1024 * 1024, files: 5 },
    fileFilter: (req, file, cb) => {
      if (types[file.mimetype]) return cb(null, true);
      cb(ApiError.badRequest(`"${file.fieldname}" debe ser una imagen JPG, PNG o WEBP${allowPdf ? ' o un PDF' : ''}`));
    },
  });
};

export const fileUrl = (folder, filename) => `/uploads/${folder}/${filename}`;

export const removeUploadedFiles = (files) => {
  const list = Array.isArray(files) ? files : Object.values(files || {}).flat();
  for (const file of list) fs.rm(file.path, { force: true }, () => {});
};

// Borra archivos guardados a partir de su URL pública (/uploads/carpeta/archivo)
export const removeFilesByUrl = (urls = []) => {
  for (const url of urls) {
    const match = /^\/uploads\/([a-z-]+)\/([\w.-]+)$/i.exec(url || '');
    if (match) fs.rm(uploadPath(match[1], match[2]), { force: true }, () => {});
  }
};
