import { useEffect, useState, type FormEvent } from 'react';
import { ImageOff, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { SingleImagePicker } from '@/components/admin/SingleImagePicker';
import { FormAlert, FormField, fieldA11y } from '@/components/common/FormField';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/PageState';
import { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { firebaseErrorMessage } from '@/firebase/firestore';
import { useSubscription } from '@/hooks/useSubscription';
import { deleteBrand, saveBrand, setBrandActive, subscribeAllBrands } from '@/services/brandService';
import { subscribeAllProducts } from '@/services/productService';
import type { Brand, Product } from '@/types';
import { validateCategoryName } from '@/utils/validation';

function BrandDialog({ brand, open, onClose }: { brand: Brand | null; open: boolean; onClose: () => void }): JSX.Element {
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(brand?.name ?? ''); setActive(brand?.active ?? true); setFile(null); setRemoved(false); setNameError(undefined); setFormError('');
  }, [open, brand]);

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const err = validateCategoryName(name);
    setNameError(err ?? undefined);
    if (err) { document.getElementById('brand-name')?.focus(); return; }
    setBusy(true);
    setFormError('');
    try {
      await saveBrand({ name, active }, { existing: brand, logoFile: file, removeLogo: removed });
      toast.success(brand ? 'Marca atualizada.' : 'Marca cadastrada.');
      onClose();
    } catch (e2) { setFormError(firebaseErrorMessage(e2)); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }} title={brand ? 'Editar marca' : 'Nova marca'}
      footer={<><Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" form="brand-form" loading={busy}>Salvar</Button></>}>
      <form id="brand-form" className="form-grid" onSubmit={(e) => void submit(e)} noValidate>
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <FormField id="brand-name" label="Nome da marca" error={nameError}>
          <Input {...fieldA11y('brand-name', nameError)} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <SingleImagePicker label="Logo da marca" currentUrl={brand?.logoUrl ?? ''} file={file} removed={removed} onFile={setFile} onRemove={setRemoved} onError={setFormError} />
        <div className="switch-row">
          <span className="switch-row__text" id="brand-active-label">Marca ativa<small>Desativada, some dos filtros da loja.</small></span>
          <Switch aria-labelledby="brand-active-label" checked={active} onCheckedChange={setActive} />
        </div>
      </form>
    </Dialog>
  );
}

export function BrandsAdminPage(): JSX.Element {
  const { data: brands, loading, error } = useSubscription<Brand[]>(subscribeAllBrands, []);
  const { data: products } = useSubscription<Product[]>(subscribeAllProducts, []);
  const [editing, setEditing] = useState<{ brand: Brand | null } | null>(null);
  const [toDelete, setToDelete] = useState<Brand | null>(null);
  const [busy, setBusy] = useState(false);
  const sorted = [...brands].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const toggle = async (b: Brand): Promise<void> => {
    try { await setBrandActive(b.id, !b.active); toast.success(b.active ? 'Marca desativada.' : 'Marca ativada.'); } catch (e) { toast.error(firebaseErrorMessage(e)); }
  };
  const confirmDelete = async (): Promise<void> => {
    if (!toDelete) return;
    setBusy(true);
    try { await deleteBrand(toDelete); toast.success('Marca excluída.'); setToDelete(null); } catch (e) { toast.error(firebaseErrorMessage(e)); setToDelete(null); } finally { setBusy(false); }
  };

  return (
    <>
      <AdminPageHead title="Marcas" lead="As marcas cadastradas aparecem para você escolher ao cadastrar um produto e nos filtros da loja."
        actions={<Button onClick={() => setEditing({ brand: null })}><Icon as={Plus} size={18} />Nova marca</Button>} />
      {error ? <FormAlert>{error}</FormAlert> : null}
      {loading ? <LoadingScreen label="Carregando marcas…" /> : null}
      {!loading && !error && brands.length === 0 ? <EmptyState title="Nenhuma marca cadastrada." actions={<Button onClick={() => setEditing({ brand: null })}>Cadastrar marca</Button>} /> : null}
      {sorted.length > 0 ? (
        <Table aria-label="Lista de marcas">
          <TableHeader><TableRow><TableHead>Marca</TableHead><TableHead className="data-table__num">Produtos</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader>
          <TableBody>
            {sorted.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <div className="cell-product">
                    <span className="thumb">{b.logoUrl ? <img src={b.logoUrl} alt="" /> : <Icon as={ImageOff} size={20} />}</span>
                    <div><div className="cell-product__name">{b.name}</div>{b.demo ? <div className="data-table__muted">DEMO</div> : null}</div>
                  </div>
                </TableCell>
                <TableCell className="data-table__num">{products.filter((p) => p.brandId === b.id).length}</TableCell>
                <TableCell>{b.active ? <Badge variant="success">Ativa</Badge> : <Badge variant="neutral">Inativa</Badge>}</TableCell>
                <TableCell>
                  <div className="data-table__actions">
                    <Button variant="ghost" size="icon" aria-label={`Editar ${b.name}`} onClick={() => setEditing({ brand: b })}><Icon as={Pencil} size={18} /></Button>
                    <Button variant="ghost" size="icon" aria-label={b.active ? `Desativar ${b.name}` : `Ativar ${b.name}`} aria-pressed={b.active} onClick={() => void toggle(b)}><Icon as={Power} size={18} /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Excluir ${b.name}`} onClick={() => setToDelete(b)}><Icon as={Trash2} size={18} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
      <BrandDialog open={editing !== null} brand={editing?.brand ?? null} onClose={() => setEditing(null)} />
      <ConfirmDialog open={toDelete !== null} onOpenChange={(v) => { if (!v) setToDelete(null); }} title="Excluir marca?"
        description={`“${toDelete?.name ?? ''}” será excluída. Só é possível excluir marcas sem produtos; caso contrário, desative-a.`}
        confirmLabel="Excluir" destructive loading={busy} onConfirm={() => void confirmDelete()} />
    </>
  );
}
