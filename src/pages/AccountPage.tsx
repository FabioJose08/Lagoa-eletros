import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ClipboardList, Heart, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { FormAlert, FormField, fieldA11y } from '@/components/common/FormField';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { firebaseErrorMessage } from '@/firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { updateUserProfile, uploadProfilePhoto } from '@/services/userService';
import { onlyDigits } from '@/utils/format';
import { validateImageFile } from '@/utils/image';
import { ROLE_LABEL } from '@/utils/labels';

export function AccountPage(): JSX.Element {
  useDocumentMeta({ title: 'Minha conta', noindex: true });
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name ?? user?.displayName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!user) return <></>;

  const photo = profile?.photoURL || user.photoURL;
  const initials = (name || user.email).trim().charAt(0).toUpperCase();

  const onSave = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const errs: { name?: string; phone?: string } = {};
    if (name.trim().length < 2) errs.name = 'Informe seu nome.';
    if (phone.trim() && (onlyDigits(phone).length < 10 || onlyDigits(phone).length > 13)) errs.phone = 'Telefone inválido. Use DDD + número.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFormError(null);
    try {
      await updateUserProfile(user.uid, { name, phone });
      await refreshProfile();
      toast.success('Dados atualizados.');
    } catch (err) { setFormError(firebaseErrorMessage(err)); } finally { setBusy(false); }
  };

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) { toast.error(problem); return; }
    setPhotoBusy(true);
    try {
      const url = await uploadProfilePhoto(user.uid, file);
      await updateUserProfile(user.uid, { name, phone, photoURL: url });
      await refreshProfile();
      toast.success('Foto atualizada.');
    } catch (err) { toast.error(firebaseErrorMessage(err, 'Não foi possível enviar a foto.')); } finally { setPhotoBusy(false); }
  };

  return (
    <>
      <div className="container page-head">
        <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Minha conta' }]} />
        <h1 className="page-title" tabIndex={-1}>Minha conta</h1>
      </div>
      <div className="container section section--tight">
        <div className="account">
          <section className="auth__card" style={{ width: '100%' }} aria-labelledby="profile-title">
            <div className="account__who">
              {photo ? <img className="avatar" src={photo} alt="Sua foto de perfil" width={64} height={64} /> : <span className="avatar" aria-hidden="true">{initials}</span>}
              <div>
                <h2 className="ui-card__title" id="profile-title">{name || 'Cliente'}</h2>
                <p className="ui-card__desc">{user.email}</p>
                <p className="ui-card__desc">{profile ? ROLE_LABEL[profile.role] : 'Cliente'}</p>
              </div>
            </div>
            <div>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" id="photo-input" onChange={(e) => void onPhoto(e)} />
              <Button variant="outline" size="sm" loading={photoBusy} onClick={() => fileRef.current?.click()}>Trocar foto</Button>
            </div>
            <form onSubmit={(e) => void onSave(e)} noValidate>
              {formError ? <FormAlert>{formError}</FormAlert> : null}
              <FormField id="acc-name" label="Nome" error={errors.name}>
                <Input {...fieldA11y('acc-name', errors.name)} value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField id="acc-email" label="E-mail" hint="O e-mail não pode ser alterado por aqui.">
                <Input id="acc-email" value={user.email} readOnly disabled />
              </FormField>
              <FormField id="acc-phone" label="Telefone / WhatsApp" optional error={errors.phone}>
                <Input {...fieldA11y('acc-phone', errors.phone)} type="tel" inputMode="tel" value={phone} autoComplete="tel" onChange={(e) => setPhone(e.target.value)} />
              </FormField>
              <Button type="submit" loading={busy}>Salvar alterações</Button>
            </form>
          </section>

          <section className="auth__card" style={{ width: '100%' }} aria-labelledby="quick-title">
            <h2 className="ui-card__title" id="quick-title">Atalhos</h2>
            <Button asChild variant="outline" size="lg" block><Link to="/orders"><Icon as={ClipboardList} size={20} />Meus pedidos</Link></Button>
            <Button asChild variant="outline" size="lg" block><Link to="/favorites"><Icon as={Heart} size={20} />Favoritos</Link></Button>
            <Button variant="ghost" size="lg" block onClick={() => { void signOut().then(() => navigate('/')); }}><Icon as={LogOut} size={20} />Sair da conta</Button>
          </section>
        </div>
      </div>
    </>
  );
}
