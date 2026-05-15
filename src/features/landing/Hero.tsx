import { Icon } from './Icon';
import { Btn } from './Btn';
import { HeroVisual } from './HeroVisual';

const HERO_STATS = [
  { label: 'Aplicacoes', value: '3' },
  { label: 'Open source', value: '100%' },
  { label: 'Sempre', value: 'R$ 0' },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern" />
      <div className="blob bg-lumi-400 w-[400px] h-[400px] -top-32 -left-20" />
      <div className="blob bg-lumi-label w-[500px] h-[500px] top-20 -right-32" />

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lumi-100 dark:bg-lumi-500/20 text-lumi-700 dark:text-lumi-200 text-xs font-bold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-lumi-500 animate-pulse-soft" />
              100% Gratuito · Open Source · MIT
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-6">
              Bibliotecas escolares,{' '}
              <span className="gradient-text">modernas de verdade.</span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-10 max-w-xl">
              Um ecossistema completo —{' '}
              <strong className="text-gray-900 dark:text-white">
                API, painel web e app mobile
              </strong>{' '}
              — para escolas publicas e privadas catalogarem, emprestarem e celebrarem leitura.
              Tudo aberto, tudo seu.
            </p>

            <div className="flex flex-wrap gap-3">
              <Btn
                href="https://github.com/n33miaz"
                target="_blank"
                rel="noreferrer"
                variant="primary"
                icon={<Icon name="github" size={16} />}
              >
                Ver no GitHub
              </Btn>
              <Btn href="#ecosystem" variant="secondary" icon={<Icon name="book-open" size={16} />}>
                Ler a documentacao
              </Btn>
            </div>

            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              {HERO_STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {s.value}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
