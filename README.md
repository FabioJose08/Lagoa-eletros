# Lagoa Eletros — loja online (React + TypeScript + Firebase)

Loja da **Lagoa Eletros** (Lagoa do Carro - PE) com **área do cliente** e **painel administrativo** separados.
O administrador cadastra produtos, fotos, preços, estoque e promoções pelo painel, **sem mexer em código**,
e o site do cliente mostra tudo automaticamente (o Firebase liga as duas áreas).

> **Este projeto é a evolução do site HTML anterior.** O design, o logo e os textos foram preservados.
> O HTML original está guardado, intacto, em `legacy-html/`.

---

## 1. O que você precisa
- Um computador com **Node.js 18 ou mais novo** (baixe em https://nodejs.org, versão "LTS").
- Um **editor de código** (recomendado: VS Code).
- Uma conta Google (para o Firebase, que tem plano gratuito para começar).

## 2. Instalar e abrir o projeto
Abra o terminal **dentro da pasta do projeto** (no VS Code: menu *Terminal > Novo Terminal*) e rode:

```bash
npm install        # baixa as dependências (só na primeira vez)
npm run dev        # abre o site em http://localhost:5173
```
Sem o Firebase configurado, o site mostra uma tela com os passos. É normal: siga as seções abaixo.

## 3. Criar o projeto no Firebase (passo a passo)
1. Acesse https://console.firebase.google.com e clique em **Adicionar projeto**. Dê um nome (ex.: `lagoa-eletros`).
2. **Registrar o app da Web:** na página inicial do projeto, clique no ícone **`</>` (Web)**, dê um apelido e clique em *Registrar app*.
   Aparecerá um bloco `firebaseConfig` com `apiKey`, `projectId`, `appId`... **deixe essa tela aberta**.
3. **Authentication:** menu *Build > Authentication > Vamos começar > Método de login* → ative **E-mail/senha**.
   (Google é opcional e só para o futuro: ative o provedor e ponha `VITE_ENABLE_GOOGLE_LOGIN=true` no `.env`.)
4. **Firestore:** *Build > Firestore Database > Criar banco de dados* → escolha um local (ex.: `southamerica-east1`) e
   **modo de produção**. (As regras corretas entram no passo 5.)
5. **Storage (imagens):** *Build > Storage > Vamos começar* → modo de produção.
   > O Firebase pode pedir para você mudar para o plano **Blaze** (pago conforme o uso, com uma cota gratuita
   > generosa). Confira no console; para uma loja pequena o custo costuma ser muito baixo.

## 4. Configurar o arquivo `.env`
1. Na pasta do projeto, **copie** `.env.example` para `.env`.
2. Preencha com os valores do `firebaseConfig` do passo 3.2:
```
VITE_FIREBASE_API_KEY=...            (apiKey)
VITE_FIREBASE_AUTH_DOMAIN=...        (authDomain)
VITE_FIREBASE_PROJECT_ID=...         (projectId)
VITE_FIREBASE_STORAGE_BUCKET=...     (storageBucket)
VITE_FIREBASE_MESSAGING_SENDER_ID=...(messagingSenderId)
VITE_FIREBASE_APP_ID=...             (appId)
```
3. Pare o servidor (`Ctrl + C`) e rode `npm run dev` de novo.
O `.env` **não** vai para o GitHub (está no `.gitignore`). Nunca coloque chaves privadas nele.

## 5. Publicar as Security Rules (OBRIGATÓRIO antes de usar de verdade)
As regras são o que protege os dados. Estão nos arquivos `firestore.rules` e `storage.rules`.

**Jeito mais fácil (copiar e colar):**
- *Firestore Database > Regras*: apague o conteúdo, cole o de `firestore.rules` e clique em **Publicar**.
- *Storage > Regras*: apague o conteúdo, cole o de `storage.rules` e clique em **Publicar**.

**Ou pela linha de comando:** `npm install -g firebase-tools`, depois `firebase login`, `firebase use --add` (escolha seu projeto)
e `npm run deploy:rules`.

O que as regras garantem: visitantes só veem produtos **ativos**; cliente só edita o **próprio perfil**
(nome, telefone e foto); só administrador altera produtos, preços, estoque, categorias, marcas, promoções e
imagens; pedidos só são vistos pelo dono e pelo admin. Nenhuma regra usa `allow read, write: if true`.

## 6. Criar o primeiro administrador
Ninguém vira administrador pelo site (de propósito). O acesso de admin é um "carimbo" que só o servidor consegue colocar:
1. Rode o site (`npm run dev`), abra **/register** e **crie a conta** que será a administradora.
2. No Firebase: *Configurações do projeto (engrenagem) > Contas de serviço > Gerar nova chave privada*.
   Salve o arquivo baixado como **`scripts/serviceAccountKey.json`** (é SECRETO: nunca envie ao GitHub; já está no `.gitignore`).
3. No terminal: `npm run set-admin -- email-da-conta@exemplo.com`
4. Saia e entre de novo no site. Agora acesse **/admin/login**.

Para tirar o acesso: `npm run set-admin -- email@exemplo.com --remove`.

## 7. Como o administrador cadastra produtos (dia a dia)
1. Entre em **/admin/login** com a conta de admin.
2. **Categorias** e **Marcas**: cadastre (com imagem/logo se quiser). Ex.: Celulares, Apple.
3. **Produtos > Novo produto**: nome, SKU, categoria, marca, condição (novo/usado/recondicionado), preço, estoque, descrição.
   Escolha as **imagens** (JPG/PNG/WEBP): a primeira é a principal; dá para trocar a principal, excluir e enviar várias.
   As imagens são otimizadas automaticamente e enviadas ao Firebase Storage. Deixe **Ativo na loja** ligado e clique em **Cadastrar produto**.
4. O produto aparece na loja **na hora**, sem recarregar. Para esconder, use o botão de **liga/desliga** na lista (ou exclua).
5. **Promoções**: defina preço promocional (ou % de desconto) e, se quiser, início e fim. O cliente vê o preço anterior riscado,
   o novo preço e o percentual.
6. **Pedidos**: veja os pedidos dos clientes e mude o status. O **estoque acompanha**:
   *Confirmado* reserva • *Concluído* baixa • *Cancelado* devolve.
7. **Dashboard** mostra números reais do banco. O botão **Carregar dados DEMO** cria produtos de exemplo (marcados DEMO) para testar,
   e **Remover dados DEMO** apaga só eles.

## 8. Rotas
Cliente: `/` `/products` `/products/:slug` `/categories` `/categories/:slug` `/offers` `/cart` `/favorites` `/about` `/location` `/login` `/register` `/account` `/orders`  
Admin: `/admin/login` `/admin` `/admin/dashboard` `/admin/products` `/admin/products/new` `/admin/products/:id/edit` `/admin/orders` `/admin/categories` `/admin/brands` `/admin/promotions` `/admin/users`

## 9. Build e publicação (deploy)
```bash
npm run build          # gera a pasta dist/
npm run preview        # testa o build localmente
firebase deploy        # publica no Firebase Hosting (precisa: npm i -g firebase-tools; firebase login; firebase init hosting já está configurado em firebase.json)
```
Depois de publicar, no Firebase: *Authentication > Configurações > Domínios autorizados* — confira se o seu domínio está na lista.
Para o Open Graph (prévia ao compartilhar), troque em `index.html` o `og:image` por a URL completa (ex.: `https://SEU-DOMINIO/brand/og-image.png`).

## 10. Estrutura
```
src/
  components/  ui/ (shadcn/ui adaptado) · store/ (loja) · admin/ (painel) · common/
  pages/       públicas + admin/
  layouts/     PublicLayout · AdminLayout (separados)
  routes/      AppRoutes · ProtectedRoute · AdminRoute
  contexts/    Auth · Catalog (Firestore em tempo real) · Cart · Favorites
  services/    product · category · brand · promotion · order · user · seed
  firebase/    config · auth · firestore · storage
  types/  utils/ (preço, estoque, busca, imagem, validação)  lib/  hooks/  styles/ (tokens → componentes)
firestore.rules · storage.rules · firebase.json · scripts/set-admin.mjs · legacy-html/ (versão HTML original)
```
**Design system:** `src/styles/tokens.css` (Primitivo → Semântico → Componente). Tailwind está configurado e lê esses tokens
(`tailwind.config.js`); o visual da loja vem do CSS migrado do projeto original (`store.css`), mantido intacto.

## 11. Testes e o que foi (e não foi) verificado — leia
O código foi escrito e verificado **em um ambiente sem acesso ao npm nem ao Firebase**. Por isso:
- ✅ `npm test` roda **49 testes de lógica** (preço/promoção, estoque×pedidos, busca, filtros, validação, WhatsApp).
- ✅ O app inteiro foi empacotado e executado em um navegador contra uma **simulação do Firebase** (com as mesmas regras de permissão),
  cobrindo o fluxo: admin cadastra produto com imagem → aparece para o cliente → carrinho → pedido → admin muda status → estoque acompanha
  (45 verificações), sem rolagem lateral de 320 a 1440 px, no site e no painel.
- ⚠️ **Não testado com o Firebase real** e **não rodou `npm install`/`vite build`/`tsc`** aqui. Ao instalar, se algo divergir, rode
  `npm run typecheck` (mostra erros de tipo sem bloquear o site) e me envie a mensagem.
- ⚠️ As **Security Rules não foram testadas no emulador do Firebase.** Teste em `firebase emulators:start` antes de vender de verdade.
- `npm run build` usa só o Vite (não trava por erro de tipo). `npm run build:strict` roda o TypeScript antes.

## 12. Limitações conhecidas (honestas)
- **Pagamento online não existe ainda** (sem Pix/cartão). O pedido é registrado e o pagamento é combinado com a loja (WhatsApp/retirada).
  A estrutura aceita Mercado Pago/Stripe no futuro, mas o certo será validar valores num servidor (Cloud Functions).
- Os **preços do pedido são calculados no navegador** (as regras validam a conta, mas não conseguem conferir cada item com o produto).
  O admin vê o pedido completo antes de confirmar. Para escalar/pagar online, mova a criação do pedido para Cloud Functions.
- Site de página única: o Google indexa menos que um site renderizado no servidor. Título, descrição, Open Graph e dados estruturados
  já estão por página; para mais SEO, considere Next.js/pré-renderização.
- Carrinho e favoritos ficam **no aparelho** (localStorage), não na conta.
- O catálogo carrega todos os produtos ativos de uma vez (ótimo até algumas centenas). Acima disso, use paginação.
- Não há avaliações, redes sociais, "anos de loja" ou garantias inventadas. Só dados fornecidos pela loja.
