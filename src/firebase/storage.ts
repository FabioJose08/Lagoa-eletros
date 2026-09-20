import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { getFirebaseApp, hasStorageConfigured } from './config';

const bucket = () => {
  if (!hasStorageConfigured()) {
    throw new Error('Firebase Storage não está configurado. O app está em modo sem uploads de imagem.');
  }
  return getStorage(getFirebaseApp());
};

export interface UploadedFile {
  url: string;
  path: string;
}

/** Envia um arquivo ao Cloud Storage, informando o progresso (0 a 1). Retorna a URL pública e o caminho. */
export function uploadBlob(path: string, blob: Blob, onProgress?: (fraction: number) => void): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const fileRef = ref(bucket(), path);
    const task = uploadBytesResumable(fileRef, blob, {
      contentType: blob.type,
      cacheControl: 'public,max-age=31536000',
    });
    task.on(
      'state_changed',
      (snap) => onProgress?.(snap.totalBytes ? snap.bytesTransferred / snap.totalBytes : 0),
      (err) => reject(err),
      () => {
        getDownloadURL(task.snapshot.ref).then((url) => resolve({ url, path }), reject);
      },
    );
  });
}

/** Exclui um arquivo. Se ele já não existir, ignora (não é erro). */
export async function deleteFile(path: string): Promise<void> {
  if (!path) return;
  try {
    await deleteObject(ref(bucket(), path));
  } catch (err) {
    const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
    if (code !== 'storage/object-not-found') console.warn('Não foi possível excluir', path, err);
  }
}

export async function deleteFiles(paths: Array<string | undefined>): Promise<void> {
  await Promise.all(paths.filter((p): p is string => Boolean(p)).map(deleteFile));
}
