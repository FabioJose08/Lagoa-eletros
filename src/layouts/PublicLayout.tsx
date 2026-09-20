import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { DemoBar } from '@/components/store/DemoBar';
import { FloatingWhatsApp } from '@/components/store/FloatingWhatsApp';
import { Footer } from '@/components/store/Footer';
import { Header } from '@/components/store/Header';

/** Layout do CLIENTE: visual comercial, foco em produtos e compra. */
export function PublicLayout(): JSX.Element {
  const { pathname, state } = useLocation();
  const first = useRef(true);

  // Acessibilidade: ao trocar de página, volta ao topo e move o foco para o título.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('#conteudo h1')?.focus({ preventScroll: true });
  }, [pathname]);

  // Na página do produto (celular) existe uma barra fixa de compra; o botão flutuante se esconde.
  useEffect(() => {
    document.body.dataset.route = pathname.startsWith('/products/') ? 'produto' : 'loja';
    return () => { delete document.body.dataset.route; };
  }, [pathname]);

  useEffect(() => {
    if ((state as { denied?: boolean } | null)?.denied) toast.error('Acesso restrito a administradores.');
  }, [state]);

  return (
    <>
      <a className="skip-link" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>Pular para o conteúdo</a>
      <DemoBar />
      <Header />
      <main id="conteudo" tabIndex={-1}><Outlet /></main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
