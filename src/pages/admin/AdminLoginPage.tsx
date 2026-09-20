import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { FormAlert, FormField, fieldA11y } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authErrorMessage } from '@/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import type { FormErrors } from '@/types';
import { validateLogin, type AuthFormValues } from '@/utils/validation';

/** Login do painel: mesma autenticação do Firebase, mas só entra quem tem o "claim" de administrador. */
export function AdminLoginPage(): JSX.Element {
  useDocumentMeta({ title: 'Painel administrativo', noindex: true });
  const { user, isAdmin, signIn, signOut } = useAuth();
  const { state } = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors<AuthFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user && isAdmin) return <Navigate to={(state as { from?: string } | null)?.from?.startsWith('/admin') ? (state as { from: string }).from : '/admin/dashboard'} replace />;

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const errs = validateLogin({ email, password });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFormError(null);
    try {
      const u = await signIn(email, password);
      if (!u.isAdmin) { await signOut(); setFormError('Esta conta não tem acesso ao painel administrativo.'); }
    } catch (err) { setFormError(authErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <img src="/brand/logo-mark.webp" width={220} height={122} alt="Lagoa Eletros" />
        <div>
          <h1 className="auth__title" tabIndex={-1}>Painel administrativo</h1>
          <p className="auth__lead">Acesso restrito a administradores da loja.</p>
        </div>
        <form onSubmit={(e) => void onSubmit(e)} noValidate style={{ display: 'grid', gap: 16 }}>
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <FormField id="adm-email" label="E-mail" error={errors.email}><Input {...fieldA11y('adm-email', errors.email)} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
          <FormField id="adm-password" label="Senha" error={errors.password}><Input {...fieldA11y('adm-password', errors.password)} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></FormField>
          <Button type="submit" size="lg" block loading={busy}>Entrar no painel</Button>
        </form>
      </div>
    </div>
  );
}
