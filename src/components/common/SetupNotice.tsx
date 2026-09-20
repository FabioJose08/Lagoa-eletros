import { Settings } from 'lucide-react';
import { Icon } from '@/components/icons';

/** Mostrada no lugar do site enquanto o arquivo .env ainda não foi preenchido. */
export function SetupNotice(): JSX.Element {
  return (
    <main className="setup">
      <Icon as={Settings} size={40} />
      <h1>Falta conectar o Firebase</h1>
      <p>
        O site da Lagoa Eletros está instalado, mas ainda não sabe qual é o seu projeto do Firebase.
        Siga os passos abaixo (o passo a passo completo está no arquivo <code>README.md</code>):
      </p>
      <ol>
        <li>Crie um projeto no <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">Console do Firebase</a> e registre um app da Web.</li>
        <li>Copie o arquivo <code>.env.example</code> para <code>.env</code> (na pasta do projeto).</li>
        <li>Cole no <code>.env</code> os valores do app da Web (apiKey, projectId, appId...).</li>
        <li>Pare o servidor (Ctrl + C) e rode <code>npm run dev</code> de novo.</li>
      </ol>
    </main>
  );
}
