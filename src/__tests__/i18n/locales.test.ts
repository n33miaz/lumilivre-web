import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import i18n, { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../../i18n';

/**
 * Guarda dos bundles de tradução.
 *
 * Conferir chave a chave "no olho" não escala: cada idioma novo multiplica o
 * número de arquivos, e uma chave esquecida só aparece quando alguém troca o
 * idioma e vê `book.form.title` cru na tela. Aqui a comparação é de **conjunto**,
 * feita pelo disco, então vale para namespaces que ainda nem existem.
 */

// A partir da raiz do projeto: sob jsdom o `import.meta.url` do vitest não é
// uma URL de arquivo, então resolver relativo a este módulo não funciona.
const LOCALES_DIR = path.resolve(process.cwd(), 'src/i18n/locales');

/** Locale de referência: é o que o produto fala por padrão. */
const REFERENCE_LOCALE = DEFAULT_LOCALE;

/** Locale que precisa acompanhar a referência chave a chave. */
const COMPLETE_LOCALE = 'en-US';

const readBundle = (locale: string, namespace: string): Record<string, string> =>
  JSON.parse(
    readFileSync(path.join(LOCALES_DIR, locale, `${namespace}.json`), 'utf8'),
  );

const namespacesOf = (locale: string): string[] =>
  readdirSync(path.join(LOCALES_DIR, locale))
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.basename(file, '.json'))
    .sort();

/** Nomes de interpolação usados numa mensagem (`{{name}}` → `name`). */
const placeholdersOf = (value: string): string[] =>
  [...value.matchAll(/\{\{\s*([\w.]+)[^}]*\}\}/g)]
    .map((match) => match[1])
    .sort();

const referenceNamespaces = namespacesOf(REFERENCE_LOCALE);

describe('bundles de i18n', () => {
  it('tem pelo menos um namespace para comparar', () => {
    expect(referenceNamespaces.length).toBeGreaterThan(0);
  });

  it(`${COMPLETE_LOCALE} cobre exatamente os namespaces de ${REFERENCE_LOCALE}`, () => {
    expect(namespacesOf(COMPLETE_LOCALE)).toEqual(referenceNamespaces);
  });

  it.each(referenceNamespaces)(
    'namespace "%s": pt-BR e en-US carregam o mesmo conjunto de chaves',
    (namespace) => {
      const reference = new Set(Object.keys(readBundle(REFERENCE_LOCALE, namespace)));
      const complete = new Set(Object.keys(readBundle(COMPLETE_LOCALE, namespace)));

      const missingInComplete = [...reference].filter((k) => !complete.has(k));
      const missingInReference = [...complete].filter((k) => !reference.has(k));

      expect({ missingInComplete, missingInReference }).toEqual({
        missingInComplete: [],
        missingInReference: [],
      });
    },
  );

  it.each(referenceNamespaces)(
    'namespace "%s": nenhuma tradução em branco',
    (namespace) => {
      for (const locale of [REFERENCE_LOCALE, COMPLETE_LOCALE]) {
        const empty = Object.entries(readBundle(locale, namespace))
          .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
          .map(([key]) => `${locale}/${namespace}: ${key}`);
        expect(empty).toEqual([]);
      }
    },
  );

  it.each(referenceNamespaces)(
    'namespace "%s": as interpolações sobrevivem à tradução',
    (namespace) => {
      const reference = readBundle(REFERENCE_LOCALE, namespace);
      const complete = readBundle(COMPLETE_LOCALE, namespace);

      // Uma frase que perde o `{{name}}` na tradução deixa de mostrar o dado —
      // e o bug só aparece no idioma traduzido, nunca no de origem.
      const drift = Object.entries(reference)
        .filter(([key, value]) => {
          const other = complete[key];
          if (typeof other !== 'string') return false;
          return (
            placeholdersOf(value).join('|') !== placeholdersOf(other).join('|')
          );
        })
        .map(([key]) => `${namespace}: ${key}`);

      expect(drift).toEqual([]);
    },
  );

  // Idiomas ainda parciais (es/zh/hi) caem no fallback en-US → pt-BR. Não exigimos
  // cobertura total deles, mas uma chave que só existe ali é chave órfã: ninguém
  // a lê, e ela some do radar quando a tradução for completada.
  const partialLocales = SUPPORTED_LOCALES.filter(
    (locale) => locale !== REFERENCE_LOCALE && locale !== COMPLETE_LOCALE,
  );

  it.each(partialLocales)(
    'locale parcial "%s" não inventa chave fora do pt-BR',
    (locale) => {
      const orphans: string[] = [];
      for (const namespace of namespacesOf(locale)) {
        expect(referenceNamespaces).toContain(namespace);
        const reference = new Set(Object.keys(readBundle(REFERENCE_LOCALE, namespace)));
        for (const key of Object.keys(readBundle(locale, namespace))) {
          if (!reference.has(key)) orphans.push(`${namespace}: ${key}`);
        }
      }
      expect(orphans).toEqual([]);
    },
  );

  it('todo namespace do disco está registrado no i18n', () => {
    const resources = i18n.options.resources ?? {};
    for (const locale of [REFERENCE_LOCALE, COMPLETE_LOCALE]) {
      expect(Object.keys(resources[locale] ?? {}).sort()).toEqual(
        referenceNamespaces,
      );
    }
  });
});
