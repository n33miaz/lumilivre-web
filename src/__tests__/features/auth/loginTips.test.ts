import { describe, it, expect, beforeEach } from 'vitest';

import {
  LOGIN_TIPS,
  LOGIN_TIPS_STORAGE_KEY,
  TIPS_PER_VISIT,
  readLastShownTips,
  rememberLoginTips,
  selectLoginTips,
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

describe('Dicas do login', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = makeStorage();
  });

  it('todas as dicas do acervo têm id único', () => {
    const ids = LOGIN_TIPS.map((tip) => tip.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('o acervo é grande o bastante para nunca repetir entre dois acessos', () => {
    expect(LOGIN_TIPS.length).toBeGreaterThanOrEqual(TIPS_PER_VISIT * 2);
  });

  it('entrega a quantidade pedida, sem repetir dentro do mesmo conjunto', () => {
    const tips = selectLoginTips();
    expect(tips).toHaveLength(TIPS_PER_VISIT);
    expect(new Set(tips.map((tip) => tip.id)).size).toBe(TIPS_PER_VISIT);
  });

  it('nunca traz uma dica do acesso anterior', () => {
    const exclude = LOGIN_TIPS.slice(0, TIPS_PER_VISIT).map((tip) => tip.id);
    // Muitas rodadas: o corte tem de valer para qualquer sorteio, não por sorte.
    for (let round = 0; round < 200; round++) {
      const tips = selectLoginTips({ exclude });
      expect(tips).toHaveLength(TIPS_PER_VISIT);
      for (const tip of tips) expect(exclude).not.toContain(tip.id);
    }
  });

  it('acessos consecutivos não têm interseção quando o histórico é gravado', () => {
    let previous: string[] = [];
    for (let visit = 0; visit < 40; visit++) {
      const tips = selectLoginTips({ exclude: readLastShownTips(storage) });
      const ids = tips.map((tip) => tip.id);
      expect(ids.filter((id) => previous.includes(id))).toEqual([]);
      rememberLoginTips(tips, storage);
      previous = ids;
    }
  });

  it('varia o conjunto entre acessos (não é sempre a mesma lista)', () => {
    const seen = new Set<string>();
    for (let visit = 0; visit < 20; visit++) {
      const tips = selectLoginTips({ exclude: readLastShownTips(storage) });
      rememberLoginTips(tips, storage);
      seen.add(tips.map((tip) => tip.id).join('|'));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('relaxa o filtro quando o acervo é menor que o dobro do conjunto', () => {
    const pool = LOGIN_TIPS.slice(0, 4);
    const exclude = pool.slice(0, 3).map((tip) => tip.id);
    const tips = selectLoginTips({ pool, count: 3, exclude });
    expect(tips).toHaveLength(3);
    // A única inédita tem de entrar; as repetidas só completam o que falta.
    expect(tips.map((tip) => tip.id)).toContain(pool[3].id);
  });

  it('grava os ids do conjunto atual na chave própria', () => {
    const tips = selectLoginTips({ exclude: [] });
    rememberLoginTips(tips, storage);
    expect(JSON.parse(storage.getItem(LOGIN_TIPS_STORAGE_KEY) ?? '[]')).toEqual(
      tips.map((tip) => tip.id),
    );
  });

  it('ignora histórico corrompido em vez de quebrar a tela', () => {
    const corrupted = makeStorage({ [LOGIN_TIPS_STORAGE_KEY]: '{nao é json' });
    expect(readLastShownTips(corrupted)).toEqual([]);
    expect(selectLoginTips({ exclude: readLastShownTips(corrupted) })).toHaveLength(
      TIPS_PER_VISIT,
    );
  });

  it('não explode quando o storage recusa escrita (modo privado)', () => {
    const readOnly = {
      ...makeStorage(),
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    } as Storage;
    expect(() => rememberLoginTips(selectLoginTips(), readOnly)).not.toThrow();
  });
});
