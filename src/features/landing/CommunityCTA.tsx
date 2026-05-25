import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, type IconName } from './Icon';

interface Card {
  icon: IconName;
  title: string;
  desc: string;
}

export function CommunityCTA() {
  const { t } = useTranslation('landing');

  const cards: Card[] = useMemo(
    () => [
      {
        icon: 'git-fork',
        title: t('community.card.fork.title'),
        desc: t('community.card.fork.desc'),
      },
      {
        icon: 'git-pull-request',
        title: t('community.card.pr.title'),
        desc: t('community.card.pr.desc'),
      },
      {
        icon: 'message-circle',
        title: t('community.card.discuss.title'),
        desc: t('community.card.discuss.desc'),
      },
      {
        icon: 'heart',
        title: t('community.card.cite.title'),
        desc: t('community.card.cite.desc'),
      },
    ],
    [t],
  );

  return (
    <section id="community" className="py-28 px-6">
      <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden bg-gradient-to-br from-lumi-700 via-lumi-500 to-lumi-label p-1">
        <div className="rounded-[22px] bg-lumi-700 px-10 md:px-16 py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-30" />
          <div className="blob bg-lumi-label w-72 h-72 -top-10 -right-10 opacity-50" />

          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block px-3 py-1 mb-5 rounded-full bg-white/15 backdrop-blur text-white text-xs font-bold uppercase tracking-wider">
                {t('community.badge')}
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-5 leading-tight">
                {t('community.title.line1')}
                <br />
                {t('community.title.line2')}
              </h2>
              <p className="text-lg text-white/85 leading-relaxed">
                {t('community.description')}
              </p>
            </div>

            <div className="space-y-3">
              {cards.map((c) => (
                <div
                  key={c.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur hover:bg-white/15 transition cursor-pointer"
                >
                  <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-white/20 flex items-center justify-center text-white">
                    <Icon name={c.icon} size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-white">{c.title}</div>
                    <div className="text-sm text-white/75 mt-0.5">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
