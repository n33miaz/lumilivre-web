import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from './Icon';
import { ShelfMark } from './ShelfMark';

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
 *
 * O bloco era um retângulo de 24px de raio com moldura em degradê, quadriculado
 * por baixo e um "blob" rosa desfocado no canto — três efeitos ao mesmo tempo,
 * todos da mesma lista de tiques. Agora é um bloco chapado de tinta roxa, sem
 * raio de canto, e as quatro ações são LINHAS PAUTADAS: a mesma pauta da ficha,
 * lida em negativo. Um material só, do começo ao fim da página.
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
    <section
      id="contact"
      className="emenda emenda-dobra bg-lumi-700 px-6 py-24 sm:py-28"
    >
      <div className="mx-auto grid max-w-6xl items-start gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ShelfMark label={t('contact.badge')} tone="invert" />
          <h2
            data-reveal
            data-reveal-delay="1"
            className="mb-5 mt-6 font-display text-[2.1rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.6rem] lg:text-[3rem]"
          >
            {t('contact.title.line1')}
            <br />
            {t('contact.title.line2')}
          </h2>
          <p
            data-reveal
            data-reveal-delay="2"
            className="max-w-[46ch] text-[17px] leading-relaxed text-lumi-100"
          >
            {t('contact.description')}
          </p>
        </div>

        {/* Quatro ações separadas só por um filete fino entre elas: a seta e o
            realce no hover já dizem que cada linha vai a algum lugar, então some
            a régua do topo e as divisórias ficam de baixo contraste — menos linha
            horizontal no bloco mais chapado da página. */}
        <ul className="lg:col-span-7">
          {cards.map((card, index) => (
            <li
              key={card.key}
              data-reveal
              data-reveal-delay={String(index + 1)}
              className="border-b border-white/15 last:border-b-0"
            >
              <a
                href={card.href}
                target={card.external ? '_blank' : undefined}
                rel={card.external ? 'noreferrer' : undefined}
                className="group flex items-start gap-4 py-5 transition-colors duration-200 hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-lumi-700 sm:px-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-white/30 text-white transition-colors duration-200 group-hover:border-white/60">
                  <Icon name={card.icon} size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-bold text-white">
                    {card.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-lumi-100">
                    {card.desc}
                  </span>
                </span>
                <Icon
                  name="arrow-right"
                  size={16}
                  className="ml-auto mt-1 shrink-0 text-white/55 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
