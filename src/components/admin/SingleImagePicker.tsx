import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { ACCEPT_ATTR, validateImageFile } from '@/utils/image';

export interface SingleImagePickerProps {
  label: string;
  currentUrl: string;
  file: File | null;
  removed: boolean;
  onFile: (file: File | null) => void;
  onRemove: (removed: boolean) => void;
  onError: (message: string) => void;
}

/** Uma imagem só (logo da marca ou imagem da categoria). O envio ocorre ao salvar. */
export function SingleImagePicker({ label, currentUrl, file, removed, onFile, onRemove, onError }: SingleImagePickerProps): JSX.Element {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview || (removed ? '' : currentUrl);
  const onPick = (e: ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const problem = validateImageFile(f);
    if (problem) { onError(problem); return; }
    onError('');
    onRemove(false);
    onFile(f);
  };

  return (
    <div className="uploader">
      <span className="label">{label} <span className="label__opt">(opcional)</span></span>
      <div className="cell-product">
        <span className="thumb" style={{ width: 72, height: 72 }}>{shown ? <img src={shown} alt={`Prévia: ${label}`} /> : <Icon as={ImagePlus} size={24} />}</span>
        <div className="admin-actions">
          <input ref={ref} type="file" accept={ACCEPT_ATTR} className="sr-only" aria-label={`Escolher ${label.toLowerCase()}`} onChange={onPick} />
          <Button variant="outline" size="sm" onClick={() => ref.current?.click()}>{shown ? 'Trocar' : 'Escolher imagem'}</Button>
          {shown ? <Button variant="ghost" size="sm" onClick={() => { onFile(null); onRemove(true); }}><Icon as={Trash2} size={14} />Remover</Button> : null}
        </div>
      </div>
      <p className="form-hint">JPG, PNG ou WEBP · até 10 MB. A imagem é otimizada automaticamente.</p>
    </div>
  );
}
