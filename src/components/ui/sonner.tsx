import { Toaster as Sonner, toast } from 'sonner';

/** Avisos rápidos (toasts). Fica no canto inferior central para não cobrir o botão do WhatsApp. */
function Toaster(): JSX.Element {
  return <Sonner position="bottom-center" closeButton richColors duration={3500} />;
}

export { Toaster, toast };
