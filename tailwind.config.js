/** @type {import('tailwindcss').Config} */
// As cores/raios/fontes abaixo NÃO são valores soltos: apontam para os design tokens
// definidos em src/styles/tokens.css (Primitivo -> Semântico -> Componente).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--c-bg)',
        surface: 'var(--c-surface)',
        'surface-2': 'var(--c-surface-2)',
        border: 'var(--c-border)',
        foreground: 'var(--c-text)',
        'muted-foreground': 'var(--c-text-muted)',
        primary: { DEFAULT: 'var(--c-primary)', hover: 'var(--c-primary-hover)', foreground: 'var(--c-on-primary)' },
        whatsapp: { DEFAULT: 'var(--c-whatsapp)', foreground: 'var(--c-on-whatsapp)' },
        accent: { DEFAULT: 'var(--c-accent)', foreground: 'var(--c-on-accent)' },
        destructive: 'var(--c-danger)',
      },
      fontFamily: { sans: 'var(--font-sans)' },
      borderRadius: {
        sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)',
      },
    },
  },
  plugins: [],
};
