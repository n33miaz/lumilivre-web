import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  LOGIN_HEADLINES,
  LOGIN_HEADLINE_STORAGE_KEY,
  readLastShownHeadline,
  rememberLoginHeadline,
  rememberLoginVisit,
  selectLoginHeadline,
  selectLoginVisit,
  tipsOffTopic,
} from '../../../features/auth/loginHeadlines';
import {
  LOGIN_TIPS,
  readLastShownTips,
  TIPS_PER_VISIT,
} from '../../../features/auth/loginTips';

/** Storage isolado — não depende do polyfill global do setupTests. */
function makeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => void data.delete(key),
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

/** Sorteio determinístico: percorre a sequência dada e depois volta ao início. */
function sequence(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('Chamadas do login', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = makeStorage();
  });

  it('todas as chamadas têm id único', () => {
    const ids = LOGIN_HEADLINES.map((headline) => headline.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('o acervo é grande o bastante para nunca repetir entre dois acessos', () => {
    expect(LOGIN_HEADLINES.length).toBeGreaterThanOrEqual(2);
  });

  it('nunca traz a chamada do acesso anterior', () => {
    for (const previous of LOGIN_HEADLINES) {
      // Muitas rodadas: o corte tem de valer para qualquer sorteio.
      for (let round = 0; round < 60; round++) {
        expect(selectLoginHeadline({ exclude: previous.id }).id).not.toBe(
          previous.id,
        );
      }
    }
  });

  it('devolve a única chamada quando o acervo tem só ela, mesmo excluída', () => {
    const pool = LOGIN_HEADLINES.slice(0, 1);
    expect(selectLoginHeadline({ pool, exclude: pool[0].id }).id).toBe(pool[0].id);
  });

  // ------------------------------------------------------------------
  // A regra que este módulo existe para garantir.
  // ------------------------------------------------------------------

  it('toda chamada deixa dicas suficientes para duas visitas seguidas', () => {
    // É a condição que torna a composição sempre satisfazível: depois de tirar as
    // dicas do assunto da chamada, ainda tem de sobrar o dobro do conjunto, senão
    // a exclusão do acesso anterior precisaria ser relaxada.
    const apertadas = LOGIN_HEADLINES.filter(
      (headline) => tipsOffTopic(headline).length < TIPS_PER_VISIT * 2,
    );
    expect(apertadas.map((headline) => headline.id)).toEqual([]);
  });

  it('nenhuma dica do acervo filtrado compartilha assunto com a chamada', () => {
    for (const headline of LOGIN_HEADLINES) {
      for (const tip of tipsOffTopic(headline)) {
        const colisao = tip.topics.filter((topic) =>
          headline.topics.includes(topic),
        );
        expect(colisao).toEqual([]);
      }
    }
  });

  it('a visita jamais mostra dica que fale do assunto da chamada', () => {
    // Força cada chamada individualmente, em vez de esperar que o sorteio passe
    // por todas: a garantia é estrutural, e o teste tem de provar isso e não a
    // sorte de uma amostra.
    for (const headline of LOGIN_HEADLINES) {
      for (let round = 0; round < 40; round++) {
        const visit = selectLoginVisit({ headlines: [headline] });
        expect(visit.headline.id).toBe(headline.id);
        expect(visit.tips).toHaveLength(TIPS_PER_VISIT);
        for (const tip of visit.tips) {
          const colisao = tip.topics.filter((topic) =>
            headline.topics.includes(topic),
          );
          expect(colisao).toEqual([]);
        }
      }
    }
  });

  it('a regra sobrevive ao sorteio inteiro, em qualquer combinação', () => {
    for (let round = 0; round < 400; round++) {
      const { headline, tips } = selectLoginVisit();
      for (const tip of tips) {
        expect(
          tip.topics.filter((topic) => headline.topics.includes(topic)),
        ).toEqual([]);
      }
    }
  });

  it('não repete dica dentro do mesmo conjunto', () => {
    for (let round = 0; round < 200; round++) {
      const { tips } = selectLoginVisit();
      expect(new Set(tips.map((tip) => tip.id)).size).toBe(TIPS_PER_VISIT);
    }
  });

  it('acessos consecutivos não repetem chamada nem dica', () => {
    let previousHeadline: string | null = null;
    let previousTips: string[] = [];

    for (let visit = 0; visit < 40; visit++) {
      const current = selectLoginVisit({
        excludeHeadline: readLastShownHeadline(storage),
        excludeTips: readLastShownTips(storage),
      });
      const ids = current.tips.map((tip) => tip.id);

      expect(current.headline.id).not.toBe(previousHeadline);
      expect(ids.filter((id) => previousTips.includes(id))).toEqual([]);

      rememberLoginVisit(current, storage);
      previousHeadline = current.headline.id;
      previousTips = ids;
    }
  });

  it('varia a chamada entre acessos (não é sempre a mesma)', () => {
    const seen = new Set<string>();
    for (let visit = 0; visit < 20; visit++) {
      const current = selectLoginVisit({
        excludeHeadline: readLastShownHeadline(storage),
      });
      rememberLoginHeadline(current.headline, storage);
      seen.add(current.headline.id);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('respeita a fonte de aleatoriedade injetada', () => {
    // random() = 0 sempre → primeira chamada do acervo e primeiras dicas do
    // Fisher-Yates. Serve para provar que nada aqui chama `Math.random` escondido.
    const first = selectLoginVisit({ random: sequence([0]) });
    const again = selectLoginVisit({ random: sequence([0]) });
    expect(again.headline.id).toBe(first.headline.id);
    expect(again.tips.map((tip) => tip.id)).toEqual(
      first.tips.map((tip) => tip.id),
    );
  });

  // ------------------------------------------------------------------
  // Persistência
  // ------------------------------------------------------------------

  it('grava chamada e dicas em chaves próprias', () => {
    const visit = selectLoginVisit();
    rememberLoginVisit(visit, storage);
    expect(storage.getItem(LOGIN_HEADLINE_STORAGE_KEY)).toBe(visit.headline.id);
    expect(readLastShownTips(storage)).toEqual(visit.tips.map((tip) => tip.id));
  });

  it('ignora histórico vazio ou corrompido em vez de quebrar a tela', () => {
    expect(readLastShownHeadline(makeStorage())).toBeNull();
    expect(readLastShownHeadline(makeStorage({ [LOGIN_HEADLINE_STORAGE_KEY]: '' }))).toBeNull();
    // Id que já não existe no acervo: o filtro simplesmente não corta nada.
    const stale = makeStorage({ [LOGIN_HEADLINE_STORAGE_KEY]: 'chamada-que-morreu' });
    expect(selectLoginVisit({ excludeHeadline: readLastShownHeadline(stale) }).headline)
      .toBeDefined();
  });

  it('não explode quando o storage recusa escrita (modo privado)', () => {
    const readOnly = {
      ...makeStorage(),
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    } as Storage;
    expect(() => rememberLoginVisit(selectLoginVisit(), readOnly)).not.toThrow();
  });

  // ------------------------------------------------------------------
  // Textos
  // ------------------------------------------------------------------

  it('toda chamada do acervo tem os três textos nos cinco idiomas', () => {
    // Chamada nova sem tradução aparece na tela como a própria chave crua. A
    // paridade entre idiomas é conferida em `i18n/locales.test.ts`; aqui o que se
    // prova é que o CÓDIGO e os textos falam do mesmo conjunto de chamadas.
    const dir = path.resolve(process.cwd(), 'src/i18n/locales');
    const locales = ['pt-BR', 'en-US', 'es-ES', 'zh-CN', 'hi-IN'];

    const faltando = locales.flatMap((locale) => {
      const bundle: Record<string, string> = JSON.parse(
        readFileSync(path.join(dir, locale, 'auth.json'), 'utf8'),
      );
      return LOGIN_HEADLINES.flatMap((headline) =>
        ['start', 'highlight', 'subtitle']
          .filter((part) => !bundle[`login.headline.${headline.id}.${part}`])
          .map((part) => `${locale}: login.headline.${headline.id}.${part}`),
      );
    });

    expect(faltando).toEqual([]);
  });

  it('não sobrou texto de chamada sem chamada no código', () => {
    const bundle: Record<string, string> = JSON.parse(
      readFileSync(
        path.resolve(process.cwd(), 'src/i18n/locales/pt-BR/auth.json'),
        'utf8',
      ),
    );
    const ids = new Set(LOGIN_HEADLINES.map((headline) => headline.id));
    const orfas = Object.keys(bundle)
      .filter((key) => key.startsWith('login.headline.'))
      .filter((key) => !ids.has(key.split('.')[2]));

    expect(orfas).toEqual([]);
  });

  it('toda dica do acervo continua tendo texto', () => {
    // Guarda de borda: o filtro por assunto muda quais dicas aparecem, não
    // quantas existem. Se alguém apagar um texto achando que a dica saiu de
    // cena, aqui aparece.
    const bundle: Record<string, string> = JSON.parse(
      readFileSync(
        path.resolve(process.cwd(), 'src/i18n/locales/pt-BR/auth.json'),
        'utf8',
      ),
    );
    const faltando = LOGIN_TIPS.flatMap((tip) =>
      ['title', 'desc']
        .filter((part) => !bundle[`login.tip.${tip.id}.${part}`])
        .map((part) => `login.tip.${tip.id}.${part}`),
    );
    expect(faltando).toEqual([]);
  });
});
