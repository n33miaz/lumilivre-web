import { type ReactNode } from 'react';

/**
 * Cota das cinco superfícies de autenticação.
 *
 * `025.5` é, na Classificação Decimal de Dewey, "serviços ao usuário" — o
 * assunto de todas elas. Ser a MESMA cota nas cinco é o ponto: entrar, pedir
 * nova senha, redefinir, trocar e a troca obrigatória do primeiro acesso são
 * cinco fichas da mesma gaveta, e o cabeçalho diz isso antes de qualquer texto.
 * O que muda entre elas é só a etiqueta à direita.
 */
const ACCESS_MARK = '025.5';

interface AuthCardHeaderProps {
  /** Etiqueta curta que nomeia a superfície (mono, caixa alta). */
  kicker: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /**
   * `h1` nas páginas que não têm outro título (esqueci/redefinir), `h2` onde já
   * existe um `h1` na tela — no login é o painel de marca que carrega o `h1`.
   */
  level?: 1 | 2;
}

/**
 * Cabeçalho compartilhado pelas telas de autenticação: filete grosso, cota à
 * esquerda, etiqueta à direita, título abaixo.
 *
 * É o mesmo desenho do `ShelfMark` da landing (filete + cota + assunto), o que
 * costura as seis superfícies públicas num sistema só. Antes cada tela abria com
 * um logo centralizado de tamanho diferente e um título de peso diferente — e
 * duas delas nem título tinham.
 */
export function AuthCardHeader({
  kicker,
  title,
  subtitle,
  level = 1,
}: AuthCardHeaderProps) {
  const Heading = level === 1 ? 'h1' : 'h2';

  return (
    // mb-8: o mesmo respiro extra que o painel de marca do login ganhou entre as
    // suas seções — as cinco fichas de acesso respiram no mesmo compasso.
    <header className="mb-8">
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-paper-900 pb-3 dark:border-ink-100/80">
        {/* Sinal visual: lido em voz alta viraria "zero dois cinco ponto
            cinco" na abertura de toda tela de acesso. A etiqueta ao lado
            continua sendo anunciada. */}
        <span
          aria-hidden="true"
          className="cota text-sm text-lumi-600 dark:text-lumi-200"
        >
          {ACCESS_MARK}
        </span>
        <span className="cota truncate text-[10px] uppercase text-paper-500 dark:text-ink-400">
          {kicker}
        </span>
      </div>

      <Heading className="mt-6 font-display text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-paper-900 dark:text-ink-100 sm:text-[2rem]">
        {title}
      </Heading>

      {subtitle && (
        <p className="mt-2.5 max-w-[42ch] text-[15px] leading-relaxed text-paper-600 dark:text-ink-400">
          {subtitle}
        </p>
      )}
    </header>
  );
}
