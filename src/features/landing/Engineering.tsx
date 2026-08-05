import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from './SectionHeader';

const ITEM_KEYS = [
  'rls',
  'ratelimit',
  'audit',
  'outbox',
  'resilience',
  'views',
  'metrics',
  'csp',
  'tests',
] as const;

/**
 * A camada mais profunda da página: o que foi decidido e por quê. É a seção
 * escrita para quem vai ler o código — e a razão de ela vir só depois das telas
 * é que ninguém precisa dela para entender o produto.
 *
 * Painel escuro nos dois temas de propósito: além do contraste de ritmo com as
 * seções claras de cima, sinaliza sem palavra nenhuma que aqui a conversa muda.
 * Nada de card com sombra aqui — rótulo em mono, título e uma linha de motivo.
 *
 * Substitui também a marquise de logos que rolava sozinha: movimento infinito
 * sem informação nova, e o repertório listava tecnologia que o app não usa.
 */
export function Engineering() {
  const { t } = useTranslation('landing');

  const items = useMemo(
    () =>
      ITEM_KEYS.map((key) => ({
        key,
        label: t(`eng.item.${key}.label`),
        title: t(`eng.item.${key}.title`),
        desc: t(`eng.item.${key}.desc`),
      })),
    [t],
  );

  // Cada linha foi conferida em pom.xml / package.json / pubspec.yaml.
  const stack = useMemo(
    () => [
      {
        key: 'api',
        label: t('eng.stack.api'),
        items: [
          'Java 17',
          'Spring Boot 3.4',
          'Spring Security',
          'PostgreSQL 16',
          'Flyway',
          'Resilience4j',
          'Micrometer',
          'OpenPDF',
          'Testcontainers',
          'ArchUnit',
        ],
      },
      {
        key: 'web',
        label: t('eng.stack.web'),
        items: [
          'React 19',
          'TypeScript',
          'Vite 6',
          'TanStack Query',
          'TailwindCSS',
          'framer-motion',
          'i18next',
          'Zod',
          'Recharts',
          'Vitest',
          'Playwright',
        ],
      },
      {
        key: 'app',
        label: t('eng.stack.app'),
        items: [
          'Flutter',
          'Dart',
          'Provider',
          'flutter_secure_storage',
          'cached_network_image',
        ],
      },
      {
        key: 'infra',
        label: t('eng.stack.infra'),
        items: ['Docker', 'nginx', 'Supabase Storage', 'GitHub Actions'],
      },
    ],
    [t],
  );

  return (
    // A borda existe por causa do tema escuro: ali ink-900 e ink-950 quase se
    // encostam, e sem o filete a quebra de ritmo desapareceria.
    <section
      id="engineering"
      className="relative overflow-hidden border-y border-white/10 bg-ink-900 px-6 py-24 text-gray-300 sm:py-28"
    >
      <div aria-hidden="true" className="absolute inset-0 grid-pattern opacity-60" />
      <div
        aria-hidden="true"
        className="blob bg-lumi-500 h-96 w-96 -right-24 top-10"
      />

      <div className="relative mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={t('eng.eyebrow')}
          title={t('eng.title')}
          lead={t('eng.lead')}
          align="left"
          tone="invert"
        />

        <ul className="grid gap-x-10 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={item.key}
              data-reveal
              data-reveal-delay={String((index % 3) + 1)}
              className="border-t border-white/10 pt-5"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-lumi-200">
                {item.label}
              </span>
              <h3 className="mb-2 mt-2 font-display text-lg font-extrabold leading-snug text-white">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                {item.desc}
              </p>
            </li>
          ))}
        </ul>

        <div
          data-reveal
          data-reveal-delay="2"
          className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
        >
          <h3 className="mb-6 font-mono text-[10px] uppercase tracking-[0.18em] text-lumi-200">
            {t('eng.stack.title')}
          </h3>
          <dl className="space-y-5">
            {stack.map((group) => (
              <div
                key={group.key}
                className="flex flex-col gap-2 sm:flex-row sm:gap-6"
              >
                <dt className="shrink-0 pt-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-400 sm:w-32">
                  {group.label}
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  {group.items.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
