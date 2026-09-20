import { useMemo, useState } from 'react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { FormAlert } from '@/components/common/FormField';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/PageState';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSubscription } from '@/hooks/useSubscription';
import { subscribeUsers } from '@/services/userService';
import type { UserProfile } from '@/types';
import { formatDate } from '@/utils/format';
import { ROLE_LABEL } from '@/utils/labels';
import { normalizeText } from '@/utils/search';

/** Somente leitura de propósito: promover alguém a administrador NÃO é possível pelo site (segurança). */
export function UsersAdminPage(): JSX.Element {
  const { data: users, loading, error } = useSubscription<UserProfile[]>(subscribeUsers, []);
  const [q, setQ] = useState('');
  const rows = useMemo(() => users.filter((u) => !q || normalizeText(`${u.name} ${u.email}`).includes(normalizeText(q))), [users, q]);
  return (
    <>
      <AdminPageHead title="Usuários" lead="Clientes cadastrados na loja." />
      <div style={{ marginBottom: 16 }}>
        <FormAlert tone="info">Por segurança, administradores só podem ser criados no servidor, com o comando <code>npm run set-admin -- email@exemplo.com</code> (veja o README). Nenhum botão do site consegue dar acesso de administrador.</FormAlert>
      </div>
      <div className="admin-toolbar"><Input type="search" aria-label="Buscar usuário" placeholder="Buscar por nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {error ? <FormAlert>{error}</FormAlert> : null}
      {loading ? <LoadingScreen label="Carregando usuários…" /> : null}
      {!loading && !error && users.length === 0 ? <EmptyState title="Nenhum usuário ainda." /> : null}
      {rows.length > 0 ? (
        <Table aria-label="Lista de usuários">
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Telefone</TableHead><TableHead>Perfil</TableHead><TableHead>Cadastro</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.uid}>
                <TableCell className="data-table__strong">{u.name || '—'}</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.phone || '—'}</TableCell>
                <TableCell><Badge variant={u.role === 'admin' ? 'info' : 'neutral'}>{ROLE_LABEL[u.role]}</Badge></TableCell><TableCell>{formatDate(u.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </>
  );
}
