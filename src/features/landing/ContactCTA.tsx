import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from './Icon';

interface ContactCard {
  key: string;
  icon: IconName;
  title: string;
  desc: string;
  href: string;
  external?: boolean;
}

const MAIL = 'ncormino@gmail.com';

/**
 * Fechamento da página: o único bloco de cor saturada, e o único lugar com uma
 * ação de verdade em cada linha.
 *
 * Os quatro cards eram `div`s com `cursor-pointer` e nenhum destino — afordância
 * falsa, e invisível para teclado. Agora cada um é uma âncora: e-mail com
 * assunto pronto, repositórios, licença e a entrada no painel para quem já é
 * cliente. O último serve a bibliotecária, que chega aqui procurando "entrar".
 */
export function ContactCTA() {
  const { t } = useTranslation('landing');

  const cards: ContactCard[] = useMemo(
    () => [
      {
        key: 'demo',
        icon: 'mail',
        title: t('contact.card.demo.title'),
        desc: t('contact.card.demo.desc'),
        href: `mailto:${MAIL}?subject=${encodeURIComponent(t('contact.card.demo.subject'))}`,
      },
      {
        key: 'code',
        icon: 'github',
        title: t('contact.card.code.title'),
        desc: t('contact.card.code.desc'),
        href: 'https://github.com/n33miaz?tab=repositories&q=lumilivre',
        external: true,
      },
      {
        key: 'license',
        icon: 'file-text',
        title: t('contact.card.license.title'),
        desc: t('contact.card.license.desc'),
        href: `mailto:${MAIL}?subject=${encodeURIComponent(t('contact.card.license.subject'))}`,
      },
      {
        key: 'access',
        icon: 'user',
        title: t('contact.card.access.title'),
        desc: t('contact.card.access.desc'),
        href: '/login',
      },
    ],
    [t],
  );

  return (
    <section id="contact" className="px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-lumi-700 via-lumi-500 to-lumi-label p-1">
        <div className="relative overflow-hidden rounded-[22px] bg-lumi-700 px-8 py-14 sm:px-12 md:px-16 md:py-20">
          <div aria-hidden="true" className="absolute inset-0 grid-pattern opacity-30" />
          <div
            aria-hidden="true"
            className="blob bg-lumi-label h-72 w-72 -right-10 -top-10"
          />

          <div className="relative grid items-center gap-10 md:grid-cols-2">
            <div>
              <span
                data-reveal
                className="mb-5 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur"
              >
                {t('contact.badge')}
              </span>
              <h2
                data-reveal
                data-reveal-delay="1"
                className="mb-5 text-4xl font-black leading-tight tracking-tight text-white md:text-5xl"
              >
                {t('contact.title.line1')}
                <br />
                {t('contact.title.line2')}
              </h2>
              <p
                data-reveal
                data-reveal-delay="2"
                className="text-lg leading-relaxed text-white/85"
              >
                {t('contact.description')}
              </p>
            </div>

            <ul className="space-y-3">
              {cards.map((card, index) => (
                <li
                  key={card.key}
                  data-reveal
                  data-reveal-delay={String(index + 1)}
                >
                  <a
                    href={card.href}
                    target={card.external ? '_blank' : undefined}
                    rel={card.external ? 'noreferrer' : undefined}
                    className="group flex items-start gap-4 rounded-xl bg-white/10 p-4 backdrop-blur transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-lumi-700"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                      <Icon name={card.icon} size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold text-white">
                        {card.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-white/80">
                        {card.desc}
                      </span>
                    </span>
                    <Icon
                      name="arrow-right"
                      size={16}
                      className="ml-auto mt-1 shrink-0 text-white/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-white"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
