import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { FormAlert, FormField, fieldA11y } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authErrorMessage, requestPasswordReset } from '@/firebase/auth';
import { isGoogleLoginEnabled } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import type { FormErrors } from '@/types';
import { isEmail, validateLogin, validateRegister, type AuthFormValues } from '@/utils/validation';

/** Só aceita caminhos internos (evita redirecionar para outro site). */
export function safeRedirect(from: unknown, fallback = '/account'): string {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/admin') ? from : fallback;
}

function useFrom(): string {
  const { state } = useLocation();
  return safeRedirect((state as { from?: string } | null)?.from);
}

export function LoginPage(): JSX.Element {
  useDocumentMeta({ title: 'Entrar', noindex: true });
  const { user, signIn, signInWithGoogle } = useAuth();
  const from = useFrom();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors<AuthFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setInfo(null);
    const errs = validateLogin({ email, password });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFormError(null);
    try { await signIn(email, password); } catch (err) { setFormError(authErrorMessage(err)); } finally { setBusy(false); }
  };

  const onForgot = async (): Promise<void> => {
    setFormError(null);
    if (!isEmail(email)) { setErrors({ email: 'Digite seu e-mail acima para receber o link de nova senha.' }); return; }
    try { await requestPasswordReset(email); setInfo('Enviamos um e-mail com o link para criar uma nova senha. Confira também a caixa de spam.'); }
    catch (err) { setFormError(authErrorMessage(err)); }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <div>
          <h1 className="auth__title" tabIndex={-1}>Entrar</h1>
          <p className="auth__lead">Acesse sua conta para finalizar pedidos e acompanhar suas compras.</p>
        </div>
        <form onSubmit={(e) => void onSubmit(e)} noValidate>
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          {info ? <FormAlert tone="success">{info}</FormAlert> : null}
          <FormField id="login-email" label="E-mail" error={errors.email}>
            <Input {...fieldA11y('login-email', errors.email)} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField id="login-password" label="Senha" error={errors.password}>
            <Input {...fieldA11y('login-password', errors.password)} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormField>
          <Button type="submit" size="lg" block loading={busy}>Entrar</Button>
          <Button type="button" variant="ghost" onClick={() => void onForgot()}>Esqueci minha senha</Button>
        </form>
        {isGoogleLoginEnabled ? (
          <>
            <div className="auth__divider">ou</div>
            <Button variant="outline" size="lg" block onClick={() => void signInWithGoogle().catch((err: unknown) => setFormError(authErrorMessage(err)))}>Entrar com Google</Button>
          </>
        ) : null}
        <p className="auth__alt">Ainda não tem conta? <Link to="/register" state={{ from }}>Criar conta</Link></p>
      </div>
    </div>
  );
}

export function RegisterPage(): JSX.Element {
  useDocumentMeta({ title: 'Criar conta', noindex: true });
  const { user, register } = useAuth();
  const from = useFrom();
  const [v, setV] = useState<AuthFormValues>({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [errors, setErrors] = useState<FormErrors<AuthFormValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof AuthFormValues) => (e: { target: { value: string } }): void => setV((cur) => ({ ...cur, [k]: e.target.value }));

  if (user) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const errs = validateRegister(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setFormError(null);
    try { await register({ name: v.name, email: v.email, password: v.password, phone: v.phone }); } catch (err) { setFormError(authErrorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <div>
          <h1 className="auth__title" tabIndex={-1}>Criar conta</h1>
          <p className="auth__lead">Leva menos de um minuto. Sua conta é de cliente da loja.</p>
        </div>
        <form onSubmit={(e) => void onSubmit(e)} noValidate>
          {formError ? <FormAlert>{formError}</FormAlert> : null}
          <FormField id="reg-name" label="Nome" error={errors.name}>
            <Input {...fieldA11y('reg-name', errors.name)} autoComplete="name" value={v.name} onChange={set('name')} />
          </FormField>
          <FormField id="reg-email" label="E-mail" error={errors.email}>
            <Input {...fieldA11y('reg-email', errors.email)} type="email" autoComplete="email" value={v.email} onChange={set('email')} />
          </FormField>
          <FormField id="reg-phone" label="Telefone / WhatsApp" optional error={errors.phone} hint="Com DDD. Ajuda a loja a falar com você sobre o pedido.">
            <Input {...fieldA11y('reg-phone', errors.phone, true)} type="tel" inputMode="tel" autoComplete="tel" value={v.phone} onChange={set('phone')} />
          </FormField>
          <FormField id="reg-password" label="Senha" error={errors.password} hint="Mínimo de 6 caracteres.">
            <Input {...fieldA11y('reg-password', errors.password, true)} type="password" autoComplete="new-password" value={v.password} onChange={set('password')} />
          </FormField>
          <FormField id="reg-confirm" label="Repita a senha" error={errors.confirm}>
            <Input {...fieldA11y('reg-confirm', errors.confirm)} type="password" autoComplete="new-password" value={v.confirm} onChange={set('confirm')} />
          </FormField>
          <Button type="submit" size="lg" block loading={busy}>Criar conta</Button>
        </form>
        <p className="auth__alt">Já tem conta? <Link to="/login" state={{ from }}>Entrar</Link></p>
      </div>
    </div>
  );
}
