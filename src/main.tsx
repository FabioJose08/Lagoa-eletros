import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Ordem importa (veja src/styles/index.css): reset -> tokens -> loja -> componentes -> painel -> utilitários
import './styles/tw-base.css';
import './styles/tokens.css';
import './styles/store.css';
import './styles/components.css';
import './styles/admin.css';
import './styles/tw-utilities.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
