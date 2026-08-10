/**
 * Recuperação de contexto WebGL — o remendo do fundo que "desaparecia" depois de
 * recarregar a tela.
 *
 * ## O que estava acontecendo
 *
 * O navegador mantém um teto de contextos WebGL simultâneos por página (16 no
 * Chromium). Quando o teto é estourado, ele não recusa o contexto novo: **mata o
 * mais antigo** e dispara `webglcontextlost` nele. Um recarregamento é o momento
 * exato em que isso acontece — o documento que sai só devolve os contextos dele
 * quando é destruído de fato, o que entra já cria os seus, e em desenvolvimento o
 * StrictMode monta cada efeito duas vezes (a tela de login passa por 6 contextos
 * numa carga). Somando os dois documentos, o teto fica ao alcance.
 *
 * E a malha do login é sempre a primeira a morrer, porque é o contexto mais
 * antigo da página: o efeito dela roda antes dos dois botões com shader.
 *
 * O código anterior tratava a perda apagando o canvas (`opacity: 0`) para o
 * degradê CSS aparecer — e parava aí. Não havia escuta de
 * `webglcontextrestored`, nem reconstrução: **qualquer** perda era definitiva.
 * Medido em Chromium com a página de login aberta: forçando pressão de contexto,
 * o canvas da malha recebia `webglcontextlost`, ia a `opacity: 0` e nunca mais
 * voltava, mesmo depois de toda a pressão ser liberada.
 *
 * ## O que este módulo faz
 *
 * 1. `preventDefault()` na perda — é o que autoriza o navegador a restaurar.
 *    Sem isso, ele nem tenta.
 * 2. Escuta `webglcontextrestored` e pede a reconstrução.
 * 3. Rede de segurança: o `restored` é decisão do navegador e pode não vir. Se
 *    não vier no prazo, reconstrói do zero por conta própria.
 * 4. Orçamento de reconstruções: uma máquina que de fato não faz WebGL não pode
 *    ficar num laço de tentativas. Esgotado o orçamento, o degradê CSS assume —
 *    que é o comportamento antigo, agora como último recurso e não como primeiro.
 *
 * Reconstruir significa canvas novo e contexto novo, e não reaproveitar o
 * contexto restaurado: na restauração todos os objetos de GL (programa, buffers,
 * texturas) já morreram e teriam de ser recriados de um jeito ou de outro.
 * Recomeçar do zero usa o mesmo caminho de inicialização que já é exercitado em
 * toda montagem, em vez de um segundo caminho que ninguém testa.
 */

/** Quantas reconstruções seguidas antes de entregar a vez ao degradê CSS. */
export const MAX_GL_REBUILDS = 3;

/** Tempo de pé sem perder o contexto que devolve o orçamento de reconstruções. */
const HEALTHY_AFTER_MS = 10_000;

/** Espera pelo `webglcontextrestored` antes de reconstruir por conta própria. */
const REBUILD_DELAY_MS = 450;

export interface GlRecoveryHandle {
  /** Chamar quando o primeiro frame pintar: começa a contar a boa saúde. */
  markPainted: () => void;
  /** Desliga escutas e temporizadores. */
  dispose: () => void;
}

export function attachGlRecovery(options: {
  canvas: HTMLCanvasElement;
  /** Orçamento compartilhado entre reconstruções — vive num ref do componente. */
  budget: { current: number };
  /** Parar o laço de animação e esconder o canvas. */
  onLost: () => void;
  /** Pedir a reconstrução (na prática, incrementar a geração do efeito). */
  requestRebuild: () => void;
}): GlRecoveryHandle {
  const { canvas, budget, onLost, requestRebuild } = options;

  let rebuildTimer = 0;
  let healthyTimer = 0;
  let settled = false;

  const rebuild = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(rebuildTimer);
    requestRebuild();
  };

  const handleLost = (event: Event) => {
    event.preventDefault();
    window.clearTimeout(healthyTimer);
    onLost();
    if (budget.current >= MAX_GL_REBUILDS) return;
    budget.current += 1;
    rebuildTimer = window.setTimeout(rebuild, REBUILD_DELAY_MS);
  };

  const handleRestored = () => rebuild();

  canvas.addEventListener('webglcontextlost', handleLost);
  canvas.addEventListener('webglcontextrestored', handleRestored);

  return {
    markPainted: () => {
      window.clearTimeout(healthyTimer);
      healthyTimer = window.setTimeout(() => {
        budget.current = 0;
      }, HEALTHY_AFTER_MS);
    },
    dispose: () => {
      // Trava antes de remover as escutas: o `loseContext()` da limpeza dispara
      // `webglcontextlost` no contexto que está sendo jogado fora, e reagir a ele
      // pediria a reconstrução de um canvas que já não existe.
      settled = true;
      window.clearTimeout(rebuildTimer);
      window.clearTimeout(healthyTimer);
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
    },
  };
}
