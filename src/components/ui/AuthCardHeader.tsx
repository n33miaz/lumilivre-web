import { type ReactNode } from 'react';

interface AuthCardHeaderProps {
  /**
   * Etiqueta curta que nomeia a superfície (mono, caixa alta). Quando omitida, a
   * linha do filete de topo não é renderizada — é o que o cartão de login usa
   * para voltar a abrir direto no título centralizado.
   */
  kicker?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /**
   * `h1` nas páginas que não têm outro título (esqueci/redefinir), `h2` onde já
   * existe um `h1` na tela — no login é o painel de marca que carrega o `h1`.
   */
  level?: 1 | 2;
  /**
   * `center` volta o cabeçalho ao título e subtítulo centralizados que o login
   * tinha antes; as demais telas de acesso continuam alinhadas à esquerda.
   */
  align?: 'left' | 'center';
}

/**
 * Cabeçalho compartilhado pelas telas de autenticação: um filete fino com a
 * etiqueta da superfície e o título abaixo.
 *
 * A cota `025.5` (número de classificação de Dewey) que abria o cabeçalho saiu a
 * pedido do dono — o código lia como número misterioso. O login vai além: some
 * com a linha inteira do topo (`kicker` omitido) e volta ao título centralizado.
 */
export function AuthCardHeader({
  kicker,
  title,
  subtitle,
  level = 1,
  align = 'left',
}: AuthCardHeaderProps) {
  const Heading = level === 1 ? 'h1' : 'h2';
  const centered = align === 'center';

  return (
    // mb-8: o mesmo respiro extra que o painel de marca do login ganhou entre as
    // suas seções — as fichas de acesso respiram no mesmo compasso.
    <header className={`mb-8 ${centered ? 'text-center' : ''}`}>
      {/* Filete fino com a etiqueta da superfície. Só aparece quando há `kicker`:
          o login abre direto no título centralizado, sem esta linha. */}
      {kicker && (
        <div className="flex items-baseline border-b border-paper-300 pb-3 dark:border-white/10">
          <span className="cota truncate text-[10px] uppercase text-paper-500 dark:text-ink-400">
            {kicker}
          </span>
        </div>
      )}

      <Heading
        className={`font-display text-[1.75rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-paper-900 dark:text-ink-100 sm:text-[2rem] ${
          kicker ? 'mt-6' : ''
        }`}
      >
        {title}
      </Heading>

      {subtitle && (
        <p
          className={`mt-2.5 text-[15px] leading-relaxed text-paper-600 dark:text-ink-400 ${
            centered ? 'mx-auto max-w-[42ch]' : 'max-w-[42ch]'
          }`}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
