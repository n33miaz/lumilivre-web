# Dashboard — Plano de Execução

> Escopo: `lumilivre-web/src/pages/Start/index.tsx` (DashboardPage) + bundles `i18n/locales/{pt-BR,en-US}/dashboard.json`.
> Branch alvo: `main` do `lumilivre-web`.
> Status base: 2026-05-25. Backend congelado nesta rodada — todo trabalho é frontend.
> Princípio: nenhuma chave i18n nova sem espelho PT-BR/EN-US; nenhuma string hardcoded reintroduzida.

---

## 1. Objetivos desta rodada

1. **Corrigir acentuação** visível no Dashboard ("Analise gerencial" → "Análise gerencial" e cascata associada).
2. **Toggle de visualização** que alterna entre **Análise gerencial** e **Tabelas** (`Solicitações` + `Atrasados e a Vencer`), com **indicador de novidade** na visão oculta.
3. **Refinar o container "Análise gerencial"** (densidade, identidade visual, ações secundárias, empty states).

Tudo fora desses três itens fica fora de escopo (export PDF/CSV, dashboardService, etc. permanecem).

---

## 2. Estado atual mapeado

### 2.1 Bug raiz dos acentos
`DashboardPage` (`lumilivre-web/src/pages/Start/index.tsx:63`) já chama `useTranslation('dashboard')`, mas **não usa `t(...)`** em ~14 trechos do JSX. As strings exibidas estão hardcoded e sem acento.

| Linha(s)              | String exibida                                 | Chave i18n existente / faltante           |
| --------------------- | ---------------------------------------------- | ----------------------------------------- |
| `508,518,528,538`     | `LIVROS`, `ALUNOS`, `EMPRÉSTIMOS`, `PENDÊNCIAS` | `stat.books`, `stat.students`, `stat.loans`, `stat.overdue` (existem) |
| `551`                 | `Analise gerencial`                            | `section.management` (existe — tem typo, ver 2.2) |
| `554`                 | `Emprestimos, atrasos, reservas e livros mais movimentados.` | `section.management.subtitle` (existe)    |
| `564,571`             | `Exportar CSV`, `Exportar PDF`                 | `button.export_csv`, `button.export_pdf` (existem) |
| `580`                 | `Carregando indicadores...`                    | `chart.loading` (existe)                  |
| `586`                 | `Distribuicao geral`                           | `chart.general_distribution` (existe)     |
| `610`                 | `Sem dados`                                    | `chart.no_data` (existe)                  |
| `617`                 | `Emprestimos por mes`                          | `chart.loans_per_month` (existe)          |
| `632`                 | `Top livros`                                   | `chart.top_books` (existe)                |
| `647`                 | `Atrasos`                                      | `chart.overdue` (existe)                  |
| `671`                 | `Sem atrasos`                                  | `chart.no_overdue` (existe)               |
| `685`                 | `Solicitações`                                 | `section.requests` (existe)               |
| `692,696`             | `Erro ao carregar`, `Nenhuma solicitação pendente.` | `error.load`, `table.empty.requests` (existem) |
| `726`                 | `Atrasados e a Vencer`                         | `section.overdue_due` (existe)            |
| `733,738`             | `Erro ao carregar`, `Nenhum empréstimo ativo no momento.` | `error.load`, `table.empty.loans` (existem) |
| `238–242`             | Chart labels `Ativos`,`Atrasados`,`Concluidos`,`Solicitacoes`,`Reservas` | **faltam:** `chart.status.{active,overdue,completed,requests,reservations}` |
| `276–277`             | Chart labels `Atrasados`, `Vence hoje`         | **faltam:** `chart.due.{overdue,due_today}` |
| `249–252`             | `pt-BR` hardcoded em `toLocaleDateString`      | Trocar por `i18n.language`                |
| `203`                 | `toLocaleDateString('pt-BR')` em tabela        | Trocar por `i18n.language`                |
| `286–319`             | CSV labels PT-BR fixas (export gerencial)      | **faltam:** `export.csv.{header.indicator,header.value,row.*}` |
| `420,466`             | `toLocaleDateString('pt-BR')` em renderers     | Trocar por `i18n.language`                |

### 2.2 Typo no bundle PT-BR
`lumilivre-web/src/i18n/locales/pt-BR/dashboard.json:11` traz `"section.management": "Analíse Gerencial"` — acento na vogal errada. Correto: **"Análise Gerencial"** (acento agudo no primeiro `A`).

### 2.3 Layout atual (2.000 px de altura útil em monitor 1080p)
1. Linha 1 (shrink-0): 4 `StatCard`.
2. Linha 2 (shrink-0): container "Análise gerencial" (~340 px, 4 charts em `xl:grid-cols-4`).
3. Linha 3 (`flex-grow`): grid 2 colunas com as duas tabelas.

→ Em telas ~1080p, linha 2 + linha 3 disputam espaço: ou os charts ficam minúsculos, ou as tabelas perdem altura (`useDynamicPageSize` calcula `pageSize` baseado no container restante, então paginação degrada).

### 2.4 Detecção de novidade (insumo para o toggle)
Hooks existentes já entregam tudo o que o badge precisa:
- `useDashboardListas`: `solicitacoes.data.length`, `emprestimosProcessados.length` (após filtro de status).
- `useDashboardAnalytics`: `statsGerenciais.data.{emprestimosAtivos,emprestimosAtrasados,emprestimosConcluidos,solicitacoesPendentes,reservasAguardando}`, `topLivros.data`, `emprestimosPorMes.data`.

Refetch on window focus já é default do TanStack Query, então a baseline é re-avaliada sempre que o usuário volta para a aba — sem polling.

---

## 3. Plano de execução

### E1 — Corrigir acentuação (i18n cleanup)

**Por que primeiro:** é pré-requisito de E2/E3. Se o toggle for adicionado antes, ele herda strings podres.

**Tarefas**
- [ ] **Bundle PT-BR** (`i18n/locales/pt-BR/dashboard.json`):
  - Corrigir `section.management`: `"Analíse Gerencial"` → `"Análise Gerencial"`.
  - Adicionar chaves novas para os labels dos charts e CSV:
    ```jsonc
    "chart.status.active": "Ativos",
    "chart.status.overdue": "Atrasados",
    "chart.status.completed": "Concluídos",
    "chart.status.requests": "Solicitações",
    "chart.status.reservations": "Reservas",
    "chart.due.overdue": "Atrasados",
    "chart.due.due_today": "Vence hoje",
    "export.csv.header.indicator": "Indicador",
    "export.csv.header.value": "Valor",
    "export.csv.row.active_loans": "Empréstimos ativos",
    "export.csv.row.overdue_loans": "Empréstimos atrasados",
    "export.csv.row.completed_loans": "Empréstimos concluídos",
    "export.csv.row.avg_return_days": "Média dias devolução",
    "export.csv.row.pending_requests": "Solicitações pendentes",
    "export.csv.row.waiting_reservations": "Reservas aguardando",
    "export.csv.row.book_prefix": "Livro",
    "export.csv.row.month_prefix": "Mês"
    ```
- [ ] **Bundle EN-US** (`i18n/locales/en-US/dashboard.json`): espelho 1:1 (`Active`, `Overdue`, `Completed`, `Requests`, `Reservations`, `Due today`, `Indicator`, `Value`, `Active loans`, ...).
- [ ] **`DashboardPage`** (`pages/Start/index.tsx`):
  - Substituir as 14 strings da tabela em §2.1 por `t('...')`.
  - Em `StatCard.title`, usar `t('stat.books'|'stat.students'|'stat.loans'|'stat.overdue')` (mantém `uppercase` no CSS, não na string).
  - Em `statusChartData` (`:237-244`) e `dueStatusChartData` (`:267-279`), passar `t('chart.status.*')` / `t('chart.due.*')` no campo `name`.
  - Em `handleExportCsv` (`:281-320`), trocar todos os literais por `t('export.csv.row.*')` e renomear as duas colunas pelo `t('export.csv.header.*')`. **Atenção:** isso muda a chave dos objetos passados para `downloadCsv`, então `toCsv` (`utils/dashboardExport.ts`) continua funcionando porque deriva os headers do primeiro row.
  - Trocar `toLocaleDateString('pt-BR')` (`:203, :249, :420, :466`) por `toLocaleDateString(i18n.language)` (`import i18n from '../../i18n'` ou `const { i18n } = useTranslation(...)`).
- [ ] **Teste atualizado** (`__tests__/utils/dashboardExport.test.ts`): se os asserts batem em "Emprestimos ativos" literal, atualizar para a string traduzida (ou refatorar o teste para usar a chave).

**Critério de aceitação**
- Renderizar `/admin` com `pt-BR` → todo texto visível tem acentos corretos. Trocar para `en-US` via `LocaleSwitcher` → todo texto traduz, incluindo labels dos charts e CSV exportado.
- `grep -nE '"(Analise|Emprestim|Distribuic|Concluido|Solicitaco|Sem dad|Sem atras|Mes:|Livro:|Carregando indic)"' lumilivre-web/src/pages/Start/index.tsx` retorna 0 ocorrências.
- `grep -nE 'toLocaleDateString\(.pt-BR.\)' lumilivre-web/src/pages/Start/index.tsx` retorna 0 ocorrências.
- `npm run lint && npm run test -- dashboardExport` verde.

---

### E2 — Toggle "Análise gerencial" ↔ "Tabelas"

**Decisão de UX:** botão segmentado (2 chips) à direita do título "Dashboard" ou logo abaixo dos `StatCard`. Padrão visual igual ao `LocaleSwitcher` (`components/ui/LocaleSwitcher.tsx`) para coerência. Cada chip tem **dot indicador** (●) quando a visão oculta acumulou novidade.

**Estado e persistência**
- `useState<'analytics' | 'tables'>` inicial vindo de `localStorage.getItem('lumilivre.dashboard.view')` (default `'analytics'`).
- Persistir toda mudança de view.
- Baseline para detecção (também em `localStorage`):
  ```ts
  type DashboardBaseline = {
    analytics: { ativos: number; atrasados: number; concluidos: number; solicitacoesPendentes: number; reservasAguardando: number };
    tables:    { solicitacoesCount: number; emprestimosCount: number };
    updatedAt: string; // ISO
  };
  // key: 'lumilivre.dashboard.baseline'
  ```
- **Snapshot rule:** quando o usuário **entra** numa view (`view === X`), atualizar `baseline[X]` com o fingerprint atual. Quando o usuário olha o badge na view oculta `Y`, ele compara `current[Y]` vs `baseline[Y]` salvo na última vez que esteve em `Y`.
- Primeira sessão: snapshot inicial para ambas as views logo após primeira fetch resolver (ambos `isSuccess === true`).

**Lógica do badge** (custom hook `useDashboardViewAlerts`)
```ts
function hasAnalyticsNews(current, baseline) {
  // qualquer contador subiu desde o último snapshot
  return Object.entries(current).some(([k, v]) => v > (baseline?.[k] ?? v));
}
function hasTablesNews(current, baseline) {
  return current.solicitacoesCount > (baseline?.solicitacoesCount ?? current.solicitacoesCount)
      || current.emprestimosCount  > (baseline?.emprestimosCount  ?? current.emprestimosCount);
}
```
- Badge **só some** quando o usuário entra naquela view (causa snapshot novo). Trocar de aba/navegar e voltar não zera nada.
- "Algo desapareceu" (contador caiu) **não** acende badge — alerta é só de **novidade**, não de mudança.

**Componente novo**
- `components/ui/DashboardViewToggle.tsx`:
  - Props: `value: 'analytics' | 'tables'`, `onChange`, `analyticsHasNews: boolean`, `tablesHasNews: boolean`, `analyticsLabel`, `tablesLabel`.
  - Layout: 2 botões, `aria-pressed`, `aria-label={`${label}${hasNews ? ' — '+t('view_toggle.news_indicator') : ''}`}`.
  - Dot indicador: span absoluto `w-2 h-2 rounded-full bg-red-500`, com `aria-hidden="true"` (o estado já vai no `aria-label`).
  - Reusa cores do `lumi-primary`/`lumi-label` para o chip ativo.

**Render no `DashboardPage`**
- Encapsular linha 2 (Análise gerencial) num bloco renderizado **só se** `view === 'analytics'`.
- Encapsular linha 3 (tabelas) num bloco renderizado **só se** `view === 'tables'`.
- Ambos os blocos continuam montados condicionalmente — o `useDashboardAnalytics` e o `useDashboardListas` permanecem ativos sempre (já são chamados no topo do componente; nenhuma mudança aí). Isso garante baseline detectável mesmo quando o bloco não está visível.
- Posicionar `DashboardViewToggle` logo após o grid de `StatCard`, alinhado à direita.

**Chaves i18n novas** (bundle + espelho)
```jsonc
"view_toggle.analytics": "Análise gerencial",
"view_toggle.tables": "Solicitações e atrasos",
"view_toggle.news_indicator": "novidade",
"view_toggle.aria_label": "Alternar visualização"
```

**Impressão (PDF)**
- O `printDashboardPdf` chama `window.print()`. Hoje imprime tudo. Para não regredir, adicionar no CSS global (`src/index.css` ou bloco `@media print` específico):
  ```css
  @media print {
    [data-dashboard-block] { display: block !important; }
  }
  ```
  e marcar ambos os blocos com `data-dashboard-block`. Toggle e botões ficam `print:hidden`.

**Tarefas**
- [ ] Criar `components/ui/DashboardViewToggle.tsx`.
- [ ] Criar hook `hooks/useDashboardViewAlerts.ts` (encapsula leitura/escrita de baseline + cálculo dos dois booleans).
- [ ] Integrar no `DashboardPage`: estado, persistência, render condicional, snapshot ao montar e ao trocar.
- [ ] CSS `@media print` para preservar export PDF.
- [ ] Adicionar chaves i18n PT-BR/EN-US.
- [ ] Testes:
  - `__tests__/hooks/useDashboardViewAlerts.test.ts` — happy path, "contador subiu", "contador caiu não acende", primeira sessão sem baseline.
  - `__tests__/components/DashboardViewToggle.test.tsx` — render, `aria-pressed`, clique dispara `onChange`, dot só aparece quando `hasNews=true`.

**Critério de aceitação**
- Em `/admin`: usuário vê apenas um dos dois blocos por vez; toggle alterna sem recarregar.
- Após F5/atualização que aumenta `solicitacoesCount` enquanto usuário está em `analytics`, o chip "Solicitações e atrasos" acende dot vermelho **sem refresh manual** (vai aparecer no próximo refocus da aba — comportamento default do TanStack Query).
- Recarregar a página preserva a view escolhida.
- `Ctrl+P` no Dashboard imprime os **dois** blocos (regressão evitada).
- Sem erro de axe-core acessibilidade no toggle.

---

### E3 — Refinar container "Análise gerencial"

Mudança visual + funcional. Não toca em hooks/services.

**Header do container**
- Atual: `h2` + subtítulo + dois botões à direita.
- Novo:
  - Ícone (`BookIcon` ou novo `chart-line.svg`) à esquerda do título, dentro de um quadrado `bg-lumi-primary/10 dark:bg-lumi-primary/20`.
  - Título e subtítulo permanecem.
  - À direita, agrupar: **(a)** `CustomSelect` de período (`Últimos 30 dias`, `60 dias`, `90 dias`, `Este ano`) — visual primeiro, **sem fetch novo** (deixar `disabled` se backend ainda não suporta o filtro; comentar `TODO: ligar quando endpoint aceitar ?periodo=`). **(b)** Botão `refresh` (ícone `↻`) que chama `queryClient.invalidateQueries({ queryKey: ['dashboard-gerencial-stats'] })` + `['dashboard-top-livros']` + `['dashboard-emprestimos-por-mes']`. **(c)** Botões CSV/PDF existentes.
  - Em viewport `<md`, agrupar (a)+(b)+(c) num `<details>` colapsável.

**Grid de charts**
- Trocar `xl:grid-cols-4` por `md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4` — em monitor 1080p (lg/xl) renderiza 2x2 e cada card ganha ~2x altura efetiva (mais legível).
- Cada `ChartCard` (extrair para componente local ou inline com props):
  - Topo: título + **badge de total** (ex.: "Distribuição geral · 23"); calcular do próprio dataset.
  - Corpo: chart atual.
  - Rodapé: legenda compacta inline (Pie sem legenda hoje — usuário precisa hover).
  - Estado vazio: ícone neutro + texto `t('chart.no_data')` em vez de só texto cinza.
  - Skeleton de loading com shape igual ao chart (não só "Carregando indicadores...").

**Componente novo (interno ao Start)**
- `pages/Start/components/ChartCard.tsx`:
  - Props: `title`, `total?`, `isLoading`, `isEmpty`, `emptyMessage`, `children`.
  - Encapsula border, padding, header com badge, empty/loading states.
  - Mantém `h-72` por consistência.

**Chaves i18n novas**
```jsonc
"section.management.period.30d": "Últimos 30 dias",
"section.management.period.60d": "Últimos 60 dias",
"section.management.period.90d": "Últimos 90 dias",
"section.management.period.ytd": "Este ano",
"section.management.refresh": "Atualizar",
"section.management.refreshing": "Atualizando..."
```

**Tarefas**
- [ ] Criar `pages/Start/components/ChartCard.tsx`.
- [ ] Refatorar os 4 charts em `DashboardPage` para usar `ChartCard` (calcular `total` em cada `useMemo` adjacente).
- [ ] Substituir `xl:grid-cols-4` por `md:grid-cols-2 2xl:grid-cols-4`.
- [ ] Header do container: ícone + select de período (disabled com tooltip "em breve") + refresh + CSV + PDF.
- [ ] Skeleton de loading com 4 placeholders `h-72`.
- [ ] Adicionar chaves i18n PT-BR/EN-US.
- [ ] Trocar nome 'Start' da pasta da tela por 'Dashboard'.

**Critério de aceitação**
- Container "Análise gerencial" passa de ~340 px de altura para ~640 px quando a view está ativa (mais respiração para cada chart).
- Botão refresh, ao clicar, dispara visual de loading nos 4 charts e revalida via TanStack Query.
- Empty state de chart vazio exibe ícone + mensagem traduzida (sem texto cru).
- Print do PDF mantém aparência (não regredir).

---

## 4. Sequência e dependências

```
E1 (acentos)  →  E2 (toggle)  →  E3 (refino container)
```
- E1 é obrigatório antes de E2/E3 (qualquer texto novo entra direto pelo `t`).
- E2 e E3 podem ir em PRs separados, mas E2 vem primeiro porque E3 muda o container que o toggle controla.
- Cada entrega = 1 commit / 1 PR no `lumilivre-web`. Convenção: `feat(dashboard): ...`.

---

## 5. Riscos e mitigações

| Risco                                              | Mitigação                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `useDynamicPageSize` calcula altura errada após toggle (container ref muda) | Mover `ref={dashboardContainerRef}` para o wrapper externo das tabelas (linha 679) e garantir que esse wrapper só monta na view `tables`. Re-medir no mount. |
| CSV exportado vira chave i18n vazada se bundle quebrar | Manter chaves dentro de namespace `export.csv.*` com fallback PT-BR no `dashboard.json`; testes de export incluem assert das duas linguagens. |
| Print PDF imprime apenas a view ativa após toggle  | Regra `@media print` força ambos visíveis (entrega E2).                                    |
| Baseline localStorage corrompida (downgrade ou DevTools) | Validar shape no parse; se inválido, descartar e re-snapshotar.                            |
| `i18n.language` traz códigos não suportados pelo `toLocaleDateString` (ex.: `pt`) | Normalizar via `Intl.Locale(i18n.language).baseName` ou fallback `'pt-BR'`/`'en-US'`.       |
| Refetch on focus barulhento durante testes manuais | TanStack Query já tem `staleTime` configurado nos hooks (1–5min). Não introduzir `refetchInterval`. |

---

## 6. Definition of Done

- [x] Plano revisado e validado pelo usuário.
- [ ] **E1:** PR `feat(dashboard): wire i18n keys and fix accents` mergeada; lint+test verdes.
- [ ] **E2:** PR `feat(dashboard): add analytics/tables view toggle with news badge` mergeada; testes do hook e do componente verdes.
- [ ] **E3:** PR `feat(dashboard): polish management analysis container` mergeada; smoke manual em 1366×768, 1920×1080, dark/light.
- [ ] Smoke final: dois locales, dois temas, ambos os toggles, print PDF, refresh manual.
- [ ] Atualizar `MEMORY.md` se algo não-óbvio surgir (ex.: decisão sobre período disabled).

---

## 7. Apêndice — referências cruzadas

| Tópico                       | Arquivo                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------- |
| Página alvo                  | `lumilivre-web/src/pages/Start/index.tsx`                                        |
| Bundles i18n                 | `lumilivre-web/src/i18n/locales/{pt-BR,en-US}/dashboard.json`                    |
| Bootstrap i18n               | `lumilivre-web/src/i18n/index.ts`                                                |
| Hooks de dados               | `lumilivre-web/src/hooks/useDashboardQueries.ts`                                 |
| Util export                  | `lumilivre-web/src/utils/dashboardExport.ts`                                     |
| Padrão visual do toggle      | `lumilivre-web/src/components/ui/LocaleSwitcher.tsx`                             |
| Padrão de `StatCard`         | `lumilivre-web/src/components/ui/StatCard.tsx`                                   |
| Política i18n global         | `IDIOMES.md` §1.5 (string hardcoded em fluxo novo é regressão)                   |
