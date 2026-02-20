<div align="center">
  <!-- Banner -->
  <a href="https://n33miaz.github.io/n33miaz-links/#lumitcc"><img width="100%" src="https://github-stats-api-onkr.onrender.com/api/banner?title=LumiLivre&subtitle=Library%20Management%20System&tag=(TCC)%20Bachelor%27s%20Thesis&title_color=762075&text_color=c9d1d9&v=1" /></a>

  <!-- Pins-->
  <a href="https://n33miaz.github.io/n33miaz-links/#lumiweb"><img src="https://github-stats-api-onkr.onrender.com/api/pin?username=n33miaz&repo=lumilivre-web&custom_title=WebSite&bg_color=0d1117&title_color=762075&text_color=c9d1d9&icon_color=762075&hide_border=true&min_width=270&show_description=false&v=1" /></a>
  <a href="https://n33miaz.github.io/n33miaz-links/#lumiapp"><img src="https://github-stats-api-onkr.onrender.com/api/pin?username=n33miaz&repo=lumilivre-app&custom_title=Application&bg_color=0d1117&title_color=762075&text_color=c9d1d9&icon_color=762075&hide_border=true&min_width=270&show_description=false&v=1" /></a>
  <a href="https://n33miaz.github.io/n33miaz-links/#lumiapi"><img src="https://github-stats-api-onkr.onrender.com/api/pin?username=n33miaz&repo=lumilivre-api&custom_title=API%20Restfull&bg_color=0d1117&title_color=762075&text_color=c9d1d9&icon_color=762075&hide_border=true&min_width=270&show_description=false&v=1" /></a>
</div>

<br/>

<div align="center">
  <h1>Sobre o Projeto</h1>
</div>

O **LumiLivre Web** é o painel administrativo central do ecossistema, voltado para **bibliotecários e gestores**. Desenvolvido em **React** com **TypeScript**, ele oferece uma interface robusta e responsiva para o gerenciamento completo do acervo, usuários e fluxo de empréstimos.

A aplicação foi construída com foco em produtividade, utilizando **TailwindCSS** para estilização moderna e **React Query** para gerenciamento eficiente de estado e cache, garantindo que os dados administrativos estejam sempre sincronizados com o backend.

<br/>

<div align="center">
  <h1>Screenshots</h1>
</div>

<div align="center">
  <img src="src/assets/images/prints/login.png" width="45%" alt="Dashboard" style="border-radius: 10px; margin: 5px;">
  <img src="src/assets/images/prints/dashboard.png" width="45%" alt="Livros" style="border-radius: 10px; margin: 5px;">
</div>

<br/>

<div align="center">
  <h1>Funcionalidades Principais</h1>
</div>

### 📊 Dashboard & Gestão
- **Visão Geral:** Métricas em tempo real sobre empréstimos ativos, atrasos e solicitações pendentes.
- **Controle de Acervo:** Cadastro completo de livros (com busca automática de metadados via ISBN), exemplares físicos e TCCs.
- **Gestão de Usuários:** Administração de alunos, cursos, turnos e módulos, com histórico detalhado de cada leitor.

### 🔄 Fluxo de Empréstimos
- **Solicitações:** Aprovação ou rejeição de pedidos de empréstimo feitos pelo aplicativo mobile.
- **Movimentação:** Registro de retiradas e devoluções, com cálculo automático de datas de vencimento.
- **Penalidades:** Sistema automático de bloqueio para alunos com devoluções em atraso.

### 📑 Relatórios & Ferramentas
- **Relatórios PDF:** Geração de documentos detalhados sobre acervo, alunos e movimentações para fins administrativos.
- **Ranking:** Visualização dos alunos que mais leem (Gamificação vista pelo lado do gestor).
- **Importação em Massa:** Ferramenta para carga de dados via planilhas Excel.

### ⚙️ Recursos Técnicos
- **Dark Mode:** Suporte nativo a temas claro e escuro (`ThemeContext`).
- **Performance:** Paginação dinâmica e cache de requisições com TanStack Query.
- **Responsividade:** Layout adaptável para desktops e tablets.

<br/>

<div align="center">
  <h1>Arquitetura do Sistema</h1>
</div>

Utilizamos uma arquitetura cliente-servidor moderna baseada em microsserviços e nuvem para garantir escalabilidade.

```mermaid
flowchart TD
    classDef mobile fill:#02569B,stroke:#fff,stroke-width:2px,color:#fff;
    classDef web fill:#61DAFB,stroke:#fff,stroke-width:2px,color:#000;
    classDef api fill:#762075,stroke:#fff,stroke-width:2px,color:#fff;
    classDef db fill:#336791,stroke:#fff,stroke-width:2px,color:#fff;
    classDef storage fill:#3ECF8E,stroke:#fff,stroke-width:2px,color:#fff;
    classDef external fill:#ddd,stroke:#333,stroke-width:1px,color:#000,stroke-dasharray: 5 5;

    UserMobile["Application (Aluno)"]:::mobile
    UserWeb["WebSite (Bibliotecário)"]:::web
    
    subgraph Cloud["-"]
        direction TB
        API["API RestFull"]:::api
        DB[("PostgreSQL")]:::db
        Storage["Supabase Storage"]:::storage
    end
    
    External["Google Books / BrasilAPI"]:::external

    UserMobile -->|REST API / JSON| API
    UserWeb -->|REST API / JSON| API
    
    API -->|JPA / Hibernate| DB
    API -->|Upload Capas e PDF's| Storage
    API -.->|Consulta Metadados| External
```

<br/>

<div align="center">
  <h1>Segurança</h1>
</div>

- **Rotas Protegidas:** Implementação de `ProtectedRoute` para impedir acesso não autorizado às páginas administrativas.
- **Gestão de Sessão:** Controle de autenticação via Context API (`AuthContext`) com persistência segura e logout automático.
- **Validação de Dados:** Tratamento rigoroso de formulários e respostas da API para prevenir injeção de dados inválidos.

<br/>

<div align="center">
  <sub>LumiLivre © 2025 - Todos os direitos reservados.</sub>
</div>
