# LumiLivre Web - Project Context

## Objetivo

`lumilivre-web` e o painel administrativo do ecossistema LumiLivre. Ele atende bibliotecarios e administradores na gestao de acervo, exemplares, alunos, emprestimos, solicitacoes, TCCs, ranking, relatorios e configuracoes da conta.

## Stack Tecnologica

- Linguagem: TypeScript.
- Framework UI: React 19.1.
- Bundler/dev server: Vite 6.3.
- Roteamento: React Router DOM 7.6.
- HTTP: Axios 1.12.
- Estado remoto/cache: TanStack React Query 5.90.
- Formularios: React Hook Form 7.71.
- Validacao: Zod 4.3 e `@hookform/resolvers`.
- Estilizacao: Tailwind CSS 3.4, PostCSS, Autoprefixer.
- Animacoes e visual: Framer Motion, Lottie React, SVGR.
- Graficos: Recharts 3.4.
- Qualidade: ESLint 9, TypeScript 5.8, Prettier 3.6.
- Testes unitarios/componentes: Vitest 4, Testing Library, jsdom.
- Testes E2E: Playwright 1.52.
- Deploy estatico: build em `dist`, servido por `serve`.

## Arquitetura Observada

O projeto e uma SPA React organizada por camadas de apresentacao e dominio de tela:

- `pages`: telas de rota, como login, dashboard, livros, alunos, emprestimos, TCC, ranking, relatorios e configuracoes.
- `features`: componentes de dominio para formularios, filtros e modais por modulo.
- `components/ui`: componentes reutilizaveis e genericos.
- `components/shared`: componentes compartilhados entre dominios.
- `services`: adaptadores HTTP para a API REST.
- `hooks/queries`: hooks de leitura com TanStack Query.
- `hooks/mutations`: hooks de escrita com invalidacao de cache e feedback.
- `contexts`: estado transversal de autenticacao, tema e toasts.
- `schemas`: validacao de formularios com Zod.
- `layouts`: composicao visual do painel protegido.
- `utils`: formatacao, ordenacao de navegacao e tratamento de erros.
- `__tests__` e `e2e`: cobertura automatizada.

O padrao efetivo e uma arquitetura frontend feature-oriented, com Service Layer para comunicacao REST e Container/Presentational Components em varias telas. Nao ha Clean Architecture estrita, mas a separacao entre services, hooks, schemas e componentes reduz acoplamento e facilita manutencao.

## Rotas e Modulos

- Publicas:
  - `/`: landing page publica.
  - `/login`: autenticacao.
  - `/forgot-password`: solicitacao de reset (legado: `/esqueci-a-senha` redireciona).
  - `/change-password`: troca com token (legado: `/mudar-senha` redireciona).
  - `/download`: pagina de download do app.
- Protegidas por `ProtectedRoute` (sob `/admin/*`):
  - `/admin/dashboard`: metricas, emprestimos e solicitacoes.
  - `/admin/books`: livros, exemplares, cadastro com capa e consulta por ISBN.
  - `/admin/students`: alunos, filtros, cadastro, detalhes, reset de senha.
  - `/admin/loans`: emprestimos, filtros, cadastro, conclusao e exclusao.
  - `/admin/theses`: TCCs, PDF, capa e filtros.
  - `/admin/ranking`: ranking de leitura.
  - `/admin/reports`: download de relatorios PDF.
  - `/admin/settings`: alteracao de senha, tema e logout.
- Rotas PT legadas (`/livros`, `/alunos`, `/emprestimos`, `/tcc`, `/classificacao`, `/relatorios`, `/configuracoes`, e suas variantes `/admin/<pt>`) redirecionam para os caminhos EN acima.

## Autenticacao e Comunicacao

- A base da API vem de `VITE_API_BASE_URL`.
- `src/services/api.ts` cria uma instancia Axios unica.
- Login chama `POST /auth/login` com `{ user, senha }`.
- O retorno esperado contem `id`, `email`, `role`, `matriculaAluno`, `token` e `isInitialPassword`.
- `AuthContext` persiste o objeto do usuario em `sessionStorage` com chave `user`; `isLoggingOut` e `completePasswordChange` controlam transicoes sensiveis.
- O token e aplicado em `api.defaults.headers.common.Authorization`.
- Ao recarregar a aba, `AuthContext` restaura `user` do `sessionStorage`.
- Interceptor Axios faz logout em `401`, `403` ou erro de rede quando existe usuario autenticado.
- `ProtectedRoute` bloqueia rotas privadas; `RoleProtectedRoute` filtra por `allowedRoles` conforme `roleCapabilities`.
- Modais de senha inicial usam `/usuarios/alterar-senha` quando `isInitialPassword` esta ativo.

## Services e Contratos REST

- `authService`: login, esqueci senha, validar token e mudar senha.
- `livroService`: listagens, agrupamento, busca avancada, CRUD multipart, capa, enums e CDDs.
- `exemplarService`: CRUD de exemplares por livro/tombo.
- `alunoService`: listagem, busca avancada, CRUD e reset de senha.
- `emprestimoService`: listagem, filtros, contagens, ranking, historico, cadastro, atualizacao, conclusao e exclusao.
- `solicitacaoEmprestimoService`: pendentes e processamento de aceitacao/rejeicao.
- `tccService`: CRUD com multipart para PDF/foto.
- `relatorioService`: download de PDF com filtros.
- `cepService`: consulta direta ao ViaCEP no frontend.
- `googleBooksService`: consulta backend `/livros/consulta-isbn/{isbn}`.

Ponto de atencao: o backend usa ID numerico do livro em rotas como `/livros/{id}` e `/livros/{id}/com-exemplares`. Alguns nomes de parametros no service web ainda usam `isbn`, entao novos fluxos devem garantir que o valor enviado seja o ID correto.

## Regras de Interface e Validacao

- Livro:
  - ISBN minimo de 10 caracteres.
  - Titulo, editora, classificacao, autor e pelo menos um genero sao obrigatorios.
  - Numero de paginas deve ser positivo.
- Aluno:
  - Nome minimo de 3 caracteres.
  - Matricula, curso, turno e modulo obrigatorios.
  - Email opcional, mas quando informado deve ser valido.
- Emprestimo:
  - Aluno, livro, exemplar, data de emprestimo e data de devolucao obrigatorios.
- TCC:
  - Titulo, alunos, curso, ano e semestre obrigatorios.
  - `ativo` tem default `true`.
- A camada de schema valida a UX antes de enviar para a API, mas a regra de negocio final permanece no backend.

## Estado, Cache e Feedback

- `queryClient` define `staleTime` padrao de 5 minutos, `gcTime` de 30 minutos, `retry=1` e sem refetch no foco.
- `useDashboardStats` carrega contagens em paralelo.
- `useDashboardListas` separa solicitacoes e emprestimos para tempos de cache diferentes.
- `createMutationHook` centraliza invalidacao de query, invalidacao de dashboard e toasts.
- `ToastContext` fornece feedback de sucesso/erro.
- `ThemeContext` persiste tema em `localStorage` e aplica classe para dark mode.

## Estrutura de Pastas

```text
src/
  App.tsx
  main.tsx
  components/
    ui/
    shared/
  contexts/
  features/
    books/
    loans/
    students/
    tcc/
  hooks/
    mutations/
    queries/
  layouts/
  pages/
    Auth/
    Books/
    Download/
    Loans/
    Ranking/
    Reports/
    Settings/
    Start/
    Students/
    TCC/
  schemas/
  services/
  types/
  utils/
  __tests__/
e2e/
public/
```

## Comandos Essenciais

```powershell
# instalar dependencias
npm install

# servidor de desenvolvimento
npm run dev

# build de producao
npm run build

# preview do build
npm run preview

# servir dist em producao/local
npm start

# lint
npm run lint

# testes unitarios/componentes
npm run test
npm run test:coverage

# testes E2E
npm run test:e2e
```

## Variaveis de Ambiente

```text
VITE_API_BASE_URL=http://localhost:8080
```

Para producao, apontar `VITE_API_BASE_URL` para a URL publica da API.

## Qualidade, Escalabilidade e Pontos de Atencao

- A separacao `services` + `hooks` + `features` e uma boa base para crescimento por dominio.
- Forms com Zod e React Hook Form reduzem duplicacao e erros de contrato.
- TanStack Query evita estado remoto manual e padroniza cache/invalidation.
- Lazy loading de paginas protegidas melhora tempo inicial do bundle.
- Token migrado para `sessionStorage`; o interceptor continua conservador em erros de rede.
- `ErrorBoundary` + `queryErrorHandler` padronizam os 4 estados (validacao, autorizacao, rede, inesperado) em todas as paginas.

## Evolucao Arquitetural Recente

- **Guardas por papel**: `RoleProtectedRoute` + `roleCapabilities` gatekeep rotas; menus filtrados por capacidade. `AuthContext` expoe `isLoggingOut` e `completePasswordChange`.
- **UX unificada de erro**: `ErrorBoundary` (fallback React), `QueryErrorBridge` (ponte QueryClient -> Toast), `queryErrorHandler` + `errorHandler.getErrorKind` para categorizar erros; aplicados globalmente em `main.tsx`.
- **Dashboard analytics**: `dashboardService`, `useDashboardAnalytics` e `pages/Start/index.tsx` usam Recharts (barras/pizza) e exportam CSV/PDF via `dashboardExport.ts`.
- **Contratos tipados**: `orval.config.ts` + `src/api/mutator.ts` preparam codegen React Query a partir de `/v3/api-docs`; comando `npm run api:gen` materializa os hooks.
- **Acessibilidade**: `e2e/a11y.spec.ts` cobre 5 rotas criticas (Login, Dashboard, Livros, Alunos, Emprestimos) com `@axe-core/playwright`.
- **CI**: `.github/workflows/ci.yml` encadeia lint + Vitest + build + Playwright.
