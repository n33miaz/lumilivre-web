import { Icon, type IconName } from './Icon';
import { SectionHeader } from './SectionHeader';

interface Pillar {
  icon: IconName;
  tag: string;
  title: string;
  desc: string;
  stack: string[];
  accent: string;
}

const PILLARS: Pillar[] = [
  {
    icon: 'server',
    tag: 'Nucleo',
    title: 'LumiLivre API',
    desc:
      'Backend robusto em Spring Boot com PostgreSQL e Supabase. Todos os clientes consomem a mesma API REST documentada.',
    stack: ['Spring Boot', 'PostgreSQL', 'Supabase', 'JWT'],
    accent: 'from-lumi-500 to-lumi-700',
  },
  {
    icon: 'monitor',
    tag: 'Painel',
    title: 'LumiLivre Web',
    desc:
      'Painel administrativo em React para bibliotecarias e coordenacao. Gestao completa do acervo, emprestimos, alunos e relatorios.',
    stack: ['React', 'TypeScript', 'TailwindCSS', 'Vite'],
    accent: 'from-lumi-action to-blue-700',
  },
  {
    icon: 'smartphone',
    tag: 'Estudantes',
    title: 'LumiLivre App',
    desc:
      'Aplicativo Flutter para alunos descobrirem livros, reservarem titulos, consultarem emprestimos e disputarem o ranking de leitura.',
    stack: ['Flutter', 'Dart', 'Material 3', 'FCM'],
    accent: 'from-lumi-label to-pink-600',
  },
];

export function Ecosystem() {
  return (
    <section id="ecosystem" className="py-28 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="O ecossistema"
          title="Tres pecas, um unico objetivo."
          lead="Tudo que sua biblioteca precisa em tres aplicacoes que conversam entre si: a API que guarda os dados, o painel que a equipe usa, e o app que os alunos amam."
        />
        <div className="grid md:grid-cols-3 gap-6">
          {PILLARS.map((p, i) => (
            <div
              key={p.title}
              className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-ink-900 p-7 hover:border-lumi-400 hover:-translate-y-1 transition-all duration-300 shadow-soft hover:shadow-glow"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.accent} flex items-center justify-center text-white mb-5 shadow-lg`}
              >
                <Icon name={p.icon} size={22} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-lumi-500 dark:text-lumi-400 mb-1.5">
                {p.tag} · 0{i + 1}
              </div>
              <h3 className="text-2xl font-extrabold mb-3 text-gray-900 dark:text-white">
                {p.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-5 text-[15px]">
                {p.desc}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] font-mono px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
