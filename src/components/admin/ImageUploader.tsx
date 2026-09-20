import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { FormAlert } from '@/components/common/FormField';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { ImageDraft } from '@/types';
import { ACCEPT_ATTR, processImage, validateImageFile } from '@/utils/image';

export interface ImageUploaderProps {
  drafts: ImageDraft[];
  onChange: (drafts: ImageDraft[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const fmtSize = (bytes: number): string => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/**
 * Seleção de imagens do produto:
 * escolher -> validar (tipo/tamanho) -> otimizar no navegador (WEBP, imagem principal + miniatura) -> preview.
 * O envio ao Storage acontece ao SALVAR o produto (com barra de progresso). A 1ª imagem é a principal.
 */
export function ImageUploader({ drafts, onChange, maxImages = 8, disabled }: ImageUploaderProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(0);
  const [over, setOver] = useState(false);
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  const objectUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const addFiles = useCallback(
    async (files: File[]): Promise<void> => {
      const problems: string[] = [];
      const room = maxImages - draftsRef.current.length;
      if (files.length > room) problems.push(`Você pode ter no máximo ${maxImages} imagens por produto.`);
      const accepted: File[] = [];
      for (const f of files.slice(0, Math.max(0, room))) {
        const p = validateImageFile(f);
        if (p) problems.push(p); else accepted.push(f);
      }
      setErrors(problems);
      if (!accepted.length) return;
      setProcessing((n) => n + accepted.length);
      const created: ImageDraft[] = [];
      for (const file of accepted) {
        try {
          const img = await processImage(file);
          const previewUrl = URL.createObjectURL(img.main);
          objectUrls.current.add(previewUrl);
          created.push({ id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, kind: 'new', previewUrl, mainBlob: img.main, thumbBlob: img.thumb, fileName: file.name, sizeBytes: img.main.size });
        } catch (e) {
          problems.push(e instanceof Error ? `${file.name}: ${e.message}` : `Não foi possível ler ${file.name}.`);
          setErrors([...problems]);
        } finally {
          setProcessing((n) => n - 1);
        }
      }
      if (created.length) onChange([...draftsRef.current, ...created]);
    },
    [maxImages, onChange],
  );

  const onPick = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    void addFiles(files);
  };
  const onDrop = (e: DragEvent): void => {
    e.preventDefault();
    setOver(false);
    if (!disabled) void addFiles(Array.from(e.dataTransfer.files));
  };

  const makeMain = (id: string): void => {
    const i = drafts.findIndex((d) => d.id === id);
    if (i <= 0) return;
    onChange([drafts[i], ...drafts.filter((d) => d.id !== id)]);
  };
  const remove = (id: string): void => {
    const d = drafts.find((x) => x.id === id);
    if (d?.kind === 'new') { URL.revokeObjectURL(d.previewUrl); objectUrls.current.delete(d.previewUrl); }
    onChange(drafts.filter((x) => x.id !== id));
  };

  return (
    <div className="uploader">
      <label
        className={`uploader__drop${over ? ' is-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <input ref={inputRef} type="file" multiple accept={ACCEPT_ATTR} disabled={disabled || drafts.length >= maxImages} onChange={onPick} aria-label="Escolher imagens do produto" />
        <Icon as={ImagePlus} size={28} />
        <strong>Escolher imagens</strong>
        <span className="form-hint">ou arraste para cá · JPG, PNG ou WEBP · até 10 MB cada</span>
      </label>
      {processing > 0 ? <p className="form-hint" role="status">Otimizando {processing} {processing === 1 ? 'imagem' : 'imagens'}…</p> : null}
      {errors.length ? <FormAlert>{errors.map((e) => <p key={e}>{e}</p>)}</FormAlert> : null}
      {drafts.length ? (
        <ul className="uploader__list" aria-label="Imagens do produto">
          {drafts.map((d, i) => (
            <li key={d.id} className={`uploader__item${i === 0 ? ' is-main' : ''}`}>
              <img src={d.previewUrl} alt={i === 0 ? 'Imagem principal do produto' : `Imagem ${i + 1} do produto`} />
              {i === 0 ? <span className="uploader__tag">Principal</span> : null}
              {d.kind === 'new' ? <span className="uploader__tag uploader__tag--new">Nova</span> : null}
              {d.sizeBytes ? <span className="uploader__meta">Otimizada: {fmtSize(d.sizeBytes)}</span> : null}
              <div className="uploader__actions">
                {i !== 0 ? <Button variant="ghost" size="sm" onClick={() => makeMain(d.id)} disabled={disabled}><Icon as={Star} size={14} />Principal</Button> : <span />}
                <Button variant="ghost" size="sm" onClick={() => remove(d.id)} disabled={disabled} aria-label={`Excluir imagem ${i + 1}`}><Icon as={Trash2} size={14} />Excluir</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="form-hint">Nenhuma imagem ainda. Sem foto, a loja mostra o ícone da categoria.</p>
      )}
    </div>
  );
}
