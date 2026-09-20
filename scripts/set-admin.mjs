/* Promove um usuário a ADMINISTRADOR da loja (com segurança, no servidor).
 *
 * Uso:   npm run set-admin -- email@exemplo.com
 *        npm run set-admin -- email@exemplo.com --remove     (tira o acesso)
 *
 * Requisitos:
 *  1. A pessoa já precisa ter criado conta no site (/register).
 *  2. Baixe a chave do Firebase Admin: Console > Configurações do projeto > Contas de serviço >
 *     "Gerar nova chave privada" e salve como  scripts/serviceAccountKey.json
 *     (esse arquivo é SECRETO: nunca envie para o GitHub; já está no .gitignore).
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const email = process.argv[2];
const remove = process.argv.includes('--remove');
if (!email || email.startsWith('--')) {
  console.error('Uso: npm run set-admin -- email@exemplo.com [--remove]');
  process.exit(1);
}
const keyPath = join(dirname(fileURLToPath(import.meta.url)), 'serviceAccountKey.json');
if (!existsSync(keyPath)) {
  console.error('Não encontrei scripts/serviceAccountKey.json. Veja as instruções no topo deste arquivo ou no README.');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
try {
  const user = await getAuth().getUserByEmail(email);
  await getAuth().setCustomUserClaims(user.uid, { admin: !remove });
  await getFirestore().doc(`users/${user.uid}`).set(
    { role: remove ? 'customer' : 'admin', updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  console.log(remove ? `OK: ${email} não é mais administrador.` : `OK: ${email} agora é ADMINISTRADOR.`);
  console.log('A pessoa precisa sair e entrar de novo no site para o acesso valer.');
} catch (e) {
  console.error('Não foi possível:', e.message);
  process.exit(1);
}
