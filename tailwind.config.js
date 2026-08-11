/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Noto Sans SC (chinês) e Noto Sans Devanagari (hindi) entram como
        // fallback: o navegador usa a primeira fonte da pilha que tenha o glifo,
        // então zh-CN/hi-IN renderizam sem "tofu" sem troca por locale.
        inter: ['Inter', 'Noto Sans SC', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'Noto Sans SC', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        'lumi-primary': '#762075',
        'lumi-primary-hover': '#5E195D',
        'lumi-label': '#C964C5',
        'lumi-label-alt': '#8B5CF6',
        'lumi-action': '#1D6FBF',
        'lumi-action-hover': '#1558A0',
        'dark-header': '#1F2937',
        'dark-background': '#0F1116',
        'dark-card': '#181B23',
        'dark-elev': '#1F232C',
        lumi: {
          50: '#FBF3FB',
          100: '#F3E5F5',
          200: '#E1BEE7',
          300: '#CE93D8',
          400: '#9D4D9C',
          500: '#762075',
          600: '#5E195D',
          700: '#4A1448',
          800: '#3A0F39',
          900: '#260825',
        },
        // Neutros de papel e tinta, usados SÓ pelas superfícies públicas
        // (landing + autenticação). O painel interno continua nos `gray-*` do
        // Tailwind: trocar lá seria repintar tela por tela, fora deste escopo.
        //
        // Motivo da escala: cinza frio de template (`#F9FAFB`, `#6B7280`) é o
        // que faz uma página parecer gerada. Papel levemente amarelado e tinta
        // quente conversam com o assunto — e, por serem menos azuis, deixam o
        // roxo da marca ler como cor, não como mais um tom do mesmo cinza.
        //
        // Todos os pares de texto foram medidos contra o fundo em que são
        // usados: 500 é o degrau mais claro que ainda passa AA em corpo pequeno
        // sobre `paper-200` (4,56:1); de 400 para baixo é filete e borda, nunca
        // texto.
        paper: {
          50: '#FFFDF9',
          100: '#F8F5EE',
          200: '#F0EBE0',
          300: '#E4DCCB',
          400: '#C4B9A3',
          500: '#726957',
          600: '#5A5245',
          700: '#3E382E',
          800: '#2A2721',
          900: '#1A1814',
        },
        ink: {
          // Tinta no escuro: a mesma família roxo-preta que já existia, com dois
          // degraus a mais para separar fundo, faixa recuada e ficha.
          100: '#F5F1E8',
          200: '#D8D2C6',
          400: '#A79F92',
          700: '#211C2B',
          800: '#191424',
          900: '#13101B',
          950: '#0B0810',
        },
      },
      borderRadius: {
        // Escala de raio das superfícies públicas, por PAPEL do elemento (não
        // por componente): controle < cartão < moldura de tela. Os valores moram
        // em variáveis CSS (ver `:root` em index.css) para haver um lugar só de
        // calibragem — o que a classe `.ficha` também lê. Antes a hierarquia era
        // 2·6·12px e o conjunto lia como duro; agora é generosa, mas mantém a
        // tela como a coisa mais arredondada.
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
        frame: 'var(--radius-frame)',
      },
      boxShadow: {
        soft: '0 4px 14px rgba(15, 17, 22, 0.06)',
        card: '0 8px 24px -8px rgba(118, 32, 117, 0.18), 0 2px 6px rgba(15, 17, 22, 0.04)',
        cardDark: '0 8px 28px -8px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset',
        glow: '0 16px 36px -10px rgba(118, 32, 117, 0.55)',
        glowSoft: '0 6px 16px -4px rgba(201,100,197,0.35)',
        ring: '0 0 0 4px rgba(201,100,197,0.18)',
      },
      backgroundImage: {
        'lumi-gradient':
          'linear-gradient(135deg,#5E195D 0%,#762075 45%,#9D4D9C 100%)',
        'lumi-gradient-soft':
          'linear-gradient(135deg, rgba(118,32,117,0.10) 0%, rgba(201,100,197,0.10) 100%)',
        'lumi-radial':
          'radial-gradient(60% 60% at 70% 0%, rgba(201,100,197,0.18) 0%, transparent 60%), radial-gradient(45% 45% at 10% 100%, rgba(29,111,191,0.10) 0%, transparent 60%)',
        'sidebar-gradient':
          'linear-gradient(180deg,#5E195D 0%,#762075 55%,#4A1448 100%)',
      },
      animation: {
        marquee: 'marquee 35s linear infinite',
        float: 'float 6s ease-in-out infinite',
        popIn: 'popIn 280ms cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      gridTemplateAreas: {
        'layout-desktop': ['header header', 'sidebar main'],
      },
      gridTemplateColumns: {
        'layout-desktop': 'auto 1fr',
      },
      gridTemplateRows: {
        'layout-desktop': '4rem 1fr',
      },
    },
  },
  plugins: [require('@savvywombat/tailwindcss-grid-areas')],
};
