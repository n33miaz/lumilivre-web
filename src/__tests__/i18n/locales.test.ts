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

/**
 * Todo idioma suportado acompanha a referência chave a chave. Enquanto es/zh/hi
 * eram parciais, bastava proibir chave órfã e o resto caía no `fallbackLng`.
 * Com os cinco completos a regra fica simétrica de propósito: chave nova nasce
 * nos cinco ou a suíte quebra — senão a próxima nasce em dois idiomas de novo,
 * e a falta some no fallback sem ninguém ver.
 */
const TRANSLATED_LOCALES = SUPPORTED_LOCALES.filter(
  (locale) => locale !== REFERENCE_LOCALE,
);

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

/** Tags de `<Trans>` embutidas na mensagem (`<author>…</author>` → `author`). */
const tagsOf = (value: string): string[] =>
  [...value.matchAll(/<\/?([a-zA-Z][\w-]*)\s*\/?>/g)].map((match) => match[1]).sort();

const referenceNamespaces = namespacesOf(REFERENCE_LOCALE);

describe('bundles de i18n', () => {
  it('tem pelo menos um namespace para comparar', () => {
    expect(referenceNamespaces.length).toBeGreaterThan(0);
  });

  it.each(TRANSLATED_LOCALES)(
    `locale "%s" cobre exatamente os namespaces de ${REFERENCE_LOCALE}`,
    (locale) => {
      expect(namespacesOf(locale)).toEqual(referenceNamespaces);
    },
  );

  it.each(referenceNamespaces)(
    'namespace "%s": os cinco idiomas carregam o mesmo conjunto de chaves',
    (namespace) => {
      const reference = new Set(Object.keys(readBundle(REFERENCE_LOCALE, namespace)));

      const drift = TRANSLATED_LOCALES.flatMap((locale) => {
        const translated = new Set(Object.keys(readBundle(locale, namespace)));
        return [
          ...[...reference]
            .filter((key) => !translated.has(key))
            .map((key) => `${locale} não traduz: ${key}`),
          // Chave que só existe no idioma traduzido é órfã: ninguém a lê, e ela
          // envelhece sem que a referência saiba que existe.
          ...[...translated]
            .filter((key) => !reference.has(key))
            .map((key) => `${locale} inventa: ${key}`),
        ];
      });

      expect(drift).toEqual([]);
    },
  );

  it.each(referenceNamespaces)(
    'namespace "%s": nenhuma tradução em branco',
    (namespace) => {
      for (const locale of [REFERENCE_LOCALE, ...TRANSLATED_LOCALES]) {
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

      // Uma frase que perde o `{{name}}` na tradução deixa de mostrar o dado —
      // e o bug só aparece no idioma traduzido, nunca no de origem. A ordem das
      // palavras muda entre idiomas; o conjunto de argumentos, não.
      const drift = TRANSLATED_LOCALES.flatMap((locale) => {
        const translated = readBundle(locale, namespace);
        return Object.entries(reference)
          .filter(([key, value]) => {
            const other = translated[key];
            if (typeof other !== 'string') return false;
            return (
              placeholdersOf(value).join('|') !== placeholdersOf(other).join('|') ||
              tagsOf(value).join('|') !== tagsOf(other).join('|')
            );
          })
          .map(([key]) => `${locale}/${namespace}: ${key}`);
      });

      expect(drift).toEqual([]);
    },
  );

  it('todo namespace do disco está registrado no i18n', () => {
    const resources = i18n.options.resources ?? {};
    for (const locale of [REFERENCE_LOCALE, ...TRANSLATED_LOCALES]) {
      expect(Object.keys(resources[locale] ?? {}).sort()).toEqual(
        referenceNamespaces,
      );
    }
  });
});
