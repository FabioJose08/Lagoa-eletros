import { useEffect, useState, type FormEvent } from 'react';
import { ImageOff, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { SingleImagePicker } from '@/components/admin/SingleImagePicker';
import { FormAlert, FormField, fieldA11y } from '@/components/common/FormField';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/PageState';
import { CATEGORY_ICONS, CATEGORY_ICON_KEYS, CategoryIcon, Icon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { firebaseErrorMessage } from '@/firebase/firestore';
import { useSubscription } from '@/hooks/useSubscription';
import { deleteCategory, saveCategory, setCategoryActive, subscribeAllCategories } from '@/services/categoryService';
import { subscribeAllProducts } from '@/services/productService';
import type { Category, Product } from '@/types';
import { validateCategoryName } from '@/utils/validation';

function CategoryDialog({ category, open, onClose }: { category: Category | null; open: boolean; onClose: () => void }): JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('zap');
  const [active, setActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? ''); setDescription(category?.description ?? ''); setIcon(category?.icon ?? 'zap');
    setActive(category?.active ?? true); setFile(null); setRemoved(false); setNameError(undefined); setFormError('');
  }, [open, category]);

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const err = validateCategoryName(name);
    setNameError(err ?? undefined);
    if (err) { document.getElementById('cat-name')?.focus(); return; }
    setBusy(true);
    setFormError('');
    try {
      await saveCategory({ name, description, icon, active }, { existing: category, imageFile: file, removeImage: removed });
      toast.success(category ? 'Categoria atualizada.' : 'Categoria cadastrada.');
      onClose();
    } catch (e2) { setFormError(firebaseErrorMessage(e2)); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }} title={category ? 'Editar categoria' : 'Nova categoria'}
      footer={<><Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" form="category-form" loading={busy}>Salvar</Button></>}>
      <form id="category-form" className="form-grid" onSubmit={(e) => void submit(e)} noValidate>
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        <FormField id="cat-name" label="Nome" error={nameError}>
          <Input {...fieldA11y('cat-name', nameError)} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField id="cat-desc" label="Descrição" optional>
          <Textarea id="cat-desc" rows={3} value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <div>
          <span className="label" id="cat-icon-label">Ícone</span>
          <div className="icon-picker" role="group" aria-labelledby="cat-icon-label">
            {CATEGORY_ICON_KEYS.map((k) => (
              <button key={k} type="button" aria-pressed={icon === k} aria-label={`Ícone ${k}`} onClick={() => setIcon(k)}><CategoryIcon name={k} size={22} /></button>
            ))}
          </div>
        </div>
        <SingleImagePicker label="Imagem da categoria" currentUrl={category?.imageUrl ?? ''} file={file} removed={removed} onFile={setFile} onRemove={setRemoved} onError={setFormError} />
        <div className="switch-row">
          <span className="switch-row__text" id="cat-active-label">Categoria ativa<small>Desativada, some da loja.</small></span>
          <Switch aria-labelledby="cat-active-label" checked={active} onCheckedChange={setActive} />
        </div>
      </form>
    </Dialog>
  );
}

export function CategoriesAdminPage(): JSX.Element {
  const { data: categories, loading, error } = useSubscription<Category[]>(subscribeAllCategories, []);
  const { data: products } = useSubscription<Product[]>(subscribeAllProducts, []);
  const [editing, setEditing] = useState<{ category: Category | null } | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const toggle = async (c: Category): Promise<void> => {
    try { await setCategoryActive(c.id, !c.active); toast.success(c.active ? 'Categoria desativada.' : 'Categoria ativada.'); } catch (e) { toast.error(firebaseErrorMessage(e)); }
  };
  const confirmDelete = async (): Promise<void> => {
    if (!toDelete) return;
    setBusy(true);
    try { await deleteCategory(toDelete); toast.success('Categoria excluída.'); setToDelete(null); } catch (e) { toast.error(firebaseErrorMessage(e)); setToDelete(null); } finally { setBusy(false); }
  };

  return (
    <>
      <AdminPageHead title="Categorias" lead="Organize os produtos da loja. Categorias desativadas não aparecem para o cliente."
        actions={<Button onClick={() => setEditing({ category: null })}><Icon as={Plus} size={18} />Nova categoria</Button>} />
      {error ? <FormAlert>{error}</FormAlert> : null}
      {loading ? <LoadingScreen label="Carregando categorias…" /> : null}
      {!loading && !error && categories.length === 0 ? <EmptyState title="Nenhuma categoria cadastrada." actions={<Button onClick={() => setEditing({ category: null })}>Cadastrar categoria</Button>} /> : null}
      {sorted.length > 0 ? (
        <Table aria-label="Lista de categorias">
          <TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead className="data-table__num">Produtos</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader>
          <TableBody>
            {sorted.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="cell-product">
                    <span className="thumb">{c.imageUrl ? <img src={c.imageUrl} alt="" /> : CATEGORY_ICONS[c.icon] ? <CategoryIcon name={c.icon} size={22} /> : <Icon as={ImageOff} size={20} />}</span>
                    <div><div className="cell-product__name">{c.name}</div><div className="data-table__muted">/{c.slug}{c.demo ? ' · DEMO' : ''}</div></div>
                  </div>
                </TableCell>
                <TableCell className="data-table__num">{products.filter((p) => p.categoryId === c.id).length}</TableCell>
                <TableCell>{c.active ? <Badge variant="success">Ativa</Badge> : <Badge variant="neutral">Inativa</Badge>}</TableCell>
                <TableCell>
                  <div className="data-table__actions">
                    <Button variant="ghost" size="icon" aria-label={`Editar ${c.name}`} onClick={() => setEditing({ category: c })}><Icon as={Pencil} size={18} /></Button>
                    <Button variant="ghost" size="icon" aria-label={c.active ? `Desativar ${c.name}` : `Ativar ${c.name}`} aria-pressed={c.active} onClick={() => void toggle(c)}><Icon as={Power} size={18} /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Excluir ${c.name}`} onClick={() => setToDelete(c)}><Icon as={Trash2} size={18} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
      <CategoryDialog open={editing !== null} category={editing?.category ?? null} onClose={() => setEditing(null)} />
      <ConfirmDialog open={toDelete !== null} onOpenChange={(v) => { if (!v) setToDelete(null); }} title="Excluir categoria?"
        description={`“${toDelete?.name ?? ''}” será excluída. Só é possível excluir categorias sem produtos; caso contrário, desative-a.`}
        confirmLabel="Excluir" destructive loading={busy} onConfirm={() => void confirmDelete()} />
    </>
  );
}
