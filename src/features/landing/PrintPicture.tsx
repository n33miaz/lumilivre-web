import { useEffect, useRef, useState } from 'react';

import type { ScreenPrint } from './prints';

interface PrintPictureProps {
  print: ScreenPrint;
  /**
   * Tema corrente. Decide qual dos dois arquivos é a camada de baixo, e para de
   * ser consultado assim que a de cima entra (ver abaixo). A esmaecida em si não
   * passa por aqui — quem a faz é o `dark:` do CSS.
   */
  isDark: boolean;
  /** Descrição real da tela — não o título de marketing. */
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  /**
   * Camada empilhada que está invisível. Continua no DOM pelo cross-fade, mas
   * sai da árvore de acessibilidade — senão o leitor de tela anuncia as cinco
   * telas de uma vez.
   */
  hiddenFromReaders?: boolean;
}

/**
 * Prazo do plano B para trazer a segunda versão, quando o navegador não tem
 * `requestIdleCallback`. Um segundo e meio é folgado para o primeiro desenho ter
 * terminado e curto o bastante para chegar antes de qualquer clique no
 * alternador de tema.
 */
const IDLE_FALLBACK_MS = 1500;

/** Uma versão da captura: um `<source>` por formato moderno e o `<img>`. */
function PrintLayer({
  source,
  alt,
  className,
  loading,
  hidden,
  deprioritized = false,
}: {
  source: ImagetoolsPicture;
  alt: string;
  className: string;
  loading: 'eager' | 'lazy';
  hidden: boolean;
  deprioritized?: boolean;
}) {
  return (
    // O <picture> não é posicionado, então o `absolute` do <img>
    // continua se resolvendo contra a moldura de fora — é isso que
    // permite empilhar telas e trocar entre elas com fade.
    <picture>
      {Object.entries(source.sources).map(([format, srcset]) => (
        <source key={format} srcSet={srcset} type={`image/${format}`} />
      ))}
      <img
        src={source.img.src}
        alt={alt}
        aria-hidden={hidden || undefined}
        loading={loading}
        decoding="async"
        fetchPriority={deprioritized ? 'low' : undefined}
        width={source.img.w}
        height={source.img.h}
        className={className}
      />
    </picture>
  );
}

/**
 * Renderiza um print do painel pelo pipeline `?picture`.
 *
 * **Por que duas camadas.** Cada tela tem um arquivo claro e um escuro, e até
 * aqui a troca de tema trocava o `src`. Isso é um corte seco por natureza — e
 * pior que o resto da página, porque o arquivo novo ainda precisa ser baixado e
 * decodificado, então no caminho aparecia um piscar. Para a troca durar os
 * mesmos 200ms do resto, as duas versões precisam estar presentes e uma precisa
 * esmaecer sobre a outra.
 *
 * **Como o empilhamento evita o mergulho do meio.** A camada de baixo fica
 * SEMPRE opaca e só a de cima muda de opacidade. Se as duas cruzassem (uma indo
 * a 0 enquanto a outra vai a 1), no meio do caminho as duas estariam a 50% e a
 * moldura apareceria por baixo — um clarão de meio quadro. Com a base opaca, o
 * que se vê é uma dissolvência limpa.
 *
 * **Quem é a base.** O tema em que a segunda camada entrou. Congelar essa
 * escolha é o que garante que, dali em diante, trocar de tema nunca dispare
 * download nenhum: os dois arquivos ficam no lugar e só a opacidade anda. Antes
 * disso a base ainda acompanha o tema — e precisa acompanhar, porque a classe
 * `dark` só chega ao `<html>` depois do primeiro desenho: congelar cedo demais
 * deixaria quem usa o tema escuro com a captura clara embaixo.
 *
 * **O custo em bytes, e como ele foi contido.** Ter as duas versões presentes
 * dobra o peso da vitrine. Por isso a segunda camada só entra no DOM quando o
 * navegador está ocioso (`requestIdleCallback`), com `loading="lazy"` e
 * prioridade baixa: o primeiro desenho custa exatamente o que custava antes, e
 * o segundo arquivo só é buscado quando a seção se aproxima da tela — muito
 * antes de qualquer clique no alternador, que exige ler a página primeiro.
 *
 * **Quem controla a visibilidade é o `dark:`, não o React.** A opacidade das
 * camadas sai de uma utility de tema, então ela muda no MESMO recálculo de
 * estilo em que a classe `dark` entra no `<html>`. Passando por estado do React
 * a troca chegaria um quadro depois do resto da página e a esmaecida sairia
 * fora de compasso com ela.
 *
 * `className` precisa posicionar a imagem em `absolute` contra a moldura: é o
 * que faz as duas camadas ocuparem a mesma caixa.
 */
export function PrintPicture({
  print,
  isDark,
  alt,
  className = '',
  loading = 'lazy',
  hiddenFromReaders = false,
}: PrintPictureProps) {
  // `null` = a segunda camada ainda não entrou. Depois disso o valor é o tema
  // congelado da camada de baixo.
  const [frozenBase, setFrozenBase] = useState<boolean | null>(null);
  const latestIsDark = useRef(isDark);

  useEffect(() => {
    latestIsDark.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const mount = () => setFrozenBase(latestIsDark.current);
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(mount, {
        timeout: IDLE_FALLBACK_MS,
      });
      return () => window.cancelIdleCallback(handle);
    }
    const timer = window.setTimeout(mount, IDLE_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const baseIsDark = frozenBase ?? isDark;
  const base = baseIsDark ? print.dark : print.light;
  const veil = baseIsDark ? print.light : print.dark;
  // A camada de cima é a do tema OPOSTO ao da base, então ela aparece
  // exatamente quando a base não serve mais.
  const veilVisibility = baseIsDark
    ? 'opacity-100 dark:opacity-0'
    : 'opacity-0 dark:opacity-100';

  return (
    <>
      <PrintLayer
        source={base}
        alt={alt}
        className={className}
        loading={loading}
        hidden={hiddenFromReaders}
      />
      {/* A descrição fica só na base: as duas camadas mostram a MESMA tela, e
          anunciar as duas faria o leitor de tela ler a legenda em dobro. */}
      {frozenBase !== null && (
        <PrintLayer
          source={veil}
          alt=""
          className={`${className} ${veilVisibility}`}
          loading="lazy"
          hidden
          deprioritized
        />
      )}
    </>
  );
}
