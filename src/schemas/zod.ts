import { z } from 'zod';

/**
 * Ponto único de entrada do zod na aplicação — importe `z` daqui, nunca direto
 * de 'zod' (há regra de lint para isso).
 *
 * A CSP servida pelo nginx usa `script-src 'self'`, sem 'unsafe-eval'. O zod 4
 * compila um validador rápido com `new Function()` quando o ambiente deixa, e a
 * simples SONDAGEM dessa capacidade (`new Function('')` dentro de try/catch) já
 * dispara violação de CSP no console de toda tela com formulário — parece tela
 * quebrada mesmo funcionando, porque o zod cai no caminho interpretado sozinho.
 *
 * `jitless` desliga o JIT antes da sondagem (curto-circuito em
 * `jit && allowsEval.value`, ver zod/v4/core/schemas.js), deixando o console
 * limpo. O custo é o caminho interpretado — que a CSP forçaria de qualquer
 * jeito — e validar formulário de algumas dezenas de campos por ele é
 * irrelevante.
 */
z.config({ jitless: true });

export { z };
