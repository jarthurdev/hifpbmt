# Especificação de Requisitos: HIFPB Monteiro
## Sistema de Consulta de Horários Acadêmicos

**Instituição:** Instituto Federal de Educação, Ciência e Tecnologia da Paraíba (IFPB)  
**Unidade:** Campus Monteiro  
**Semestre Letivo de Referência:** 2026.2  
**Tecnologias:** HTML5, CSS3 e JavaScript Puro (Vanilla JS)  
**Versão:** 3.0.0 — Horários Importados  

---

## 1. Visão Geral do Sistema

O **HIFPB Monteiro** é uma aplicação web Front-End para consulta da grade acadêmica do **Campus Monteiro**, com turmas, cursos, docentes e horários importados da planilha fornecida.

O propósito do sistema é permitir que discentes, docentes, coordenadores e a comunidade acadêmica consultem com rapidez, clareza e precisão a alocação de aulas semanais organizadas por **Turma**, **Curso** ou **Professor**.

A solução opera de maneira totalmente autônoma no navegador do cliente (client-side), sem necessidade de infraestrutura de backend ou banco de dados relacional em tempo de execução.

---

## 2. Requisitos Funcionais (RF)

| Código | Nome do Requisito | Descrição | Prioridade |
| :--- | :--- | :--- | :---: |
| **RF01** | **Identificação Institucional e Cabeçalho** | O sistema deve exibir cabeçalho com o logotipo oficial do IFPB em formato vetorial SVG, identificação do Campus Monteiro, nome do sistema ("Horário Acadêmico") e indicação clara do semestre letivo vigente ("2026.2"). | Alta |
| **RF02** | **Seleção do Modo de Consulta** | O sistema deve disponibilizar 3 abas/cards principais de navegação: (1) Por Turma, (2) Por Curso e (3) Por Professor. A troca de aba deve atualizar dinamicamente as opções disponíveis sem recarregar a página. | Alta |
| **RF03** | **Consulta por Turma** | O usuário deve poder selecionar uma das turmas importadas da planilha fornecida e visualizar sua grade completa, com período, curso, turno, disciplinas e docentes. | Alta |
| **RF04** | **Consulta por Curso** | O usuário deve poder selecionar um dos cursos importados (TED, Informática, Instrumento Musical, TCE, ADS ou Engenharia Civil) e visualizar as aulas das turmas associadas. | Alta |
| **RF05** | **Consulta por Professor** | O usuário deve poder selecionar um docente constante na planilha e visualizar sua agenda semanal completa no campus, inclusive quando participa de aula em co-docência. | Alta |
| **RF06** | **Co-docência** | A aplicação deve permitir associar mais de um docente à mesma aula, exibir todos os nomes e incluir a aula na consulta de cada docente associado. Rótulos provisórios como "SUBS INFO" e "Eng Novo" não devem ser cadastrados como docentes. | Alta |
| **RF07** | **Visualização em Grade Semanal (Tabela)** | O sistema deve renderizar uma matriz com os horários e turnos (Matutino, Vespertino e Noturno) nas linhas e os dias da semana (Segunda a Sábado) nas colunas, suportando disciplinas com dois ou mais horários consecutivos. | Alta |
| **RF08** | **Visualização em Listagem Cronológica** | O sistema deve disponibilizar um modo de listagem com as aulas agrupadas por dia da semana e ordenadas cronologicamente por horário de início, exibindo disciplina, docente(s) e turma. | Média |
| **RF09** | **Alternância de Modos de Exibição** | O sistema deve permitir alternar instantaneamente entre a visualização por Tabela e a visualização por Listagem preservando todos os filtros e a consulta ativa. | Média |
| **RF10** | **Pesquisa Textual Dinâmica** | O sistema deve filtrar as aulas em tempo real enquanto o usuário digita, buscando por nome da disciplina, nome do professor, turma ou observações didáticas. | Alta |
| **RF11** | **Filtros Facetados Dropdown** | Na visualização da grade, o sistema deve fornecer dropdowns dinâmicos para filtragem simultânea por dia da semana e professor. | Média |
| **RF12** | **Limpeza Rápida de Filtros** | O sistema deve fornecer um botão "Limpar Filtros" que restaura imediatamente os critérios de busca para o estado padrão ("Todos") e emite uma notificação visual (*toast notification*). | Média |
| **RF13** | **Filtro Rápido na Lista de Seleção** | O painel de seleção de entidades deve possuir um campo de busca rápida com botão de limpar ("×") para localizar turmas, cursos ou professores em listas extensas. | Média |
| **RF14** | **Modal com Detalhes Pedagógicos da Disciplina** | Ao clicar em qualquer bloco de aula (na tabela ou na lista), o sistema deve abrir um modal acessível contendo: nome da disciplina, docente(s), turma/período, dia, horário exato e observações metodológicas. | Média |
| **RF15** | **Impressão e Exportação para PDF** | O sistema deve conter um botão "Imprimir / Salvar PDF" que aciona `window.print()` e formata a página com folha de estilo dedicada para papel A4 em modo paisagem, ocultando botões e elementos de navegação. | Alta |
| **RF16** | **Destaque do Horário em Andamento** | O sistema deve verificar a data e horário local atual do cliente; se houver aula em andamento no dia e horário correspondentes, a célula correspondente deve receber um destaque visual com sinalizador pulsante. | Baixa |
| **RF17** | **Relógio em Tempo Real no Cabeçalho** | O sistema deve exibir um relógio com atualização contínua por segundo (dia da semana e HH:MM:SS) e indicador luminoso verde no cabeçalho. | Baixa |
| **RF18** | **Tratamento de Estado Vazio (Empty State)** | Caso uma busca ou combinação de filtros não retorne nenhuma aula, o sistema deve exibir uma mensagem ilustrada amigável com botão para restauração imediata dos filtros. | Média |
| **RF19** | **Navegação Estrutural (Breadcrumbs)** | O sistema deve exibir trilha de navegação (Ex.: *Início › Por Turma › ADS 2025.1 — 4º Período*) e botão "Trocar Consulta" para retorno rápido ao seletor de opções. | Baixa |
| **RF20** | **Atalhos no Rodapé Institucional** | O rodapé deve incluir atalhos para os cursos ofertados, informações de contato e localização do Campus Monteiro, e aviso de projeto demonstrativo. | Baixa |
| **RF21** | **Autenticação Administrativa na Navegação** | O sistema deve exibir na barra de navegação/cabeçalho o link/botão "Entrar como administrador" que abre a janela de login com credenciais institucionais e opção de preenchimento automático para testes (`admin` / `admin`). | Alta |
| **RF22** | **Seção do Painel Administrativo com Módulos Estruturados** | O sistema deve disponibilizar uma `<section>` dedicada para o administrador contendo os módulos **Horários**, **Professores**, **Disciplinas** e **Sair**, cada um com suas ações de gestão. | Alta |
| **RF23** | **Verificação Rigorosa de Choque de Horários (Alocação)** | Ao criar um horário, o sistema deve verificar choque de docente (incluindo cada docente em co-docência) e de turma no mesmo dia e faixa de horário, apresentando alerta explícito com os detalhes da colisão. | Alta |
| **RF24** | **Gestão Completa de Horários (Novo, Ver e Remover)** | O administrador pode cadastrar novas aulas com validação de colisão, pesquisar/filtrar todos os horários cadastrados em tabela gerencial responsiva e remover horários com confirmação e feedback via toast. | Alta |
| **RF25** | **Gestão do Corpo Docente (Novo, Ver e Remover)** | O administrador pode cadastrar novos professores (nome, titulação, departamento, e-mail, áreas), visualizar a lista com contador de aulas alocadas e remover docentes somente quando não estiverem associados a horários ou disciplinas. | Alta |
| **RF26** | **Persistência e Migração dos Dados Administrativos** | As alterações administrativas são persistidas no `localStorage`. Ao carregar a nova versão da grade, dados locais incompatíveis de horários, docentes e disciplinas devem ser limpos para que não restaurem o catálogo anterior. | Alta |
| **RF27** | **Gestão de Disciplinas** | O administrador pode consultar e cadastrar disciplinas com nome, carga horária, área/categoria e professor responsável. Ao cadastrar um horário, deve selecionar uma disciplina existente; o professor responsável é preenchido automaticamente e não pode ser alterado no formulário. Os horários de início e término são determinados pela faixa selecionada. | Alta |

---

## 3. Requisitos Não Funcionais (RNF)

| Código | Categoria | Descrição |
| :--- | :--- | :--- |
| **RNF01** | **Restrição Tecnológica** | O frontend deve utilizar estritamente **HTML5**, **CSS3** e **JavaScript Puro (Vanilla JS)**, sem frameworks de interface. O backend separado pode utilizar Node.js, TypeScript, Express, Prisma e Zod. |
| **RNF02** | **Execução no Navegador** | O frontend deve ser servido como arquivos estáticos e consumir a API em `http://localhost:3333/api`; a consulta pública não depende de bundlers ou de dados acadêmicos armazenados no navegador. |
| **RNF03** | **Desempenho e Tempo de Resposta** | As operações de busca, filtragem e alternância de visualização devem ocorrer de forma síncrona com tempo de resposta imperceptível (< 100ms), sem engasgos de interface. |
| **RNF04** | **Identidade Visual Acadêmica Oficial** | O layout deve seguir estritamente o padrão institucional do IFPB, com verde floresta (`#1b5e20`), verde escuro (`#0f3d13`), acentos em vermelho institucional (`#c62828`) e fundos neutros, evitando aspecto genérico de dashboard comercial. |
| **RNF05** | **Responsividade Multiplataforma** | A aplicação deve se adaptar perfeitamente a resoluções de Desktop (≥ 1200px), Notebooks (≥ 992px), Tablets (≥ 768px) e Smartphones (≤ 480px). Em smartphones, o sistema deve fornecer abas táteis por dia (`Seg`, `Ter`, `Qua`, etc.) e rolagem horizontal suave com fixação de horário. |
| **RNF06** | **Acessibilidade e Usabilidade (a11y)** | A interface deve utilizar marcação semântica HTML5 (`header`, `main`, `section`, `article`, `footer`), atributos ARIA (`role="tab"`, `aria-selected`, `aria-live`), navegação por teclado (`Tab`, `Enter`, `Space`, `Escape` para fechar modais) e link de salto de conteúdo (`skip-link`). |
| **RNF07** | **Respeito à Preferência de Movimento** | O CSS deve implementar `@media (prefers-reduced-motion: reduce)`, desativando transições e animações caso o usuário configure seu sistema para redução de movimento. |
| **RNF08** | **Otimização para Impressão em Papel/PDF** | A folha de estilo deve conter `@media print` configurada para folha A4 paisagem (`size: landscape; margin: 1cm;`), ocultando automaticamente cabeçalhos governamentais, botões, barras de pesquisa e rodapés, gerando um documento limpo e legível. |
| **RNF09** | **Consistência e Centralização dos Dados** | A visão pública consome os dados acadêmicos exclusivamente da API; o seed relacional do backend é mantido em `backend/prisma/data/` e carregado no PostgreSQL por Prisma. |
| **RNF10** | **Compatibilidade entre Navegadores** | A aplicação deve funcionar de maneira homogênea nos principais navegadores modernos: Google Chrome, Microsoft Edge, Mozilla Firefox e Apple Safari. |
| **RNF11** | **Segurança no Lado do Cliente** | Todos os textos injetados dinamicamente via JavaScript devem ser sanitizados para prevenir vulnerabilidades de Cross-Site Scripting (XSS). |
| **RNF12** | **Independência de Conexão Externa (Zero CDN)** | Todas as fontes, vetores e ícones devem ser embutidos localmente via SVG e fontes de sistema nativas, permitindo funcionamento 100% autônomo e offline. |

---

## 4. Regras de Negócio e Casos Especiais

1. **Estrutura dos Turnos e Horários:** os turnos e faixas são derivados dos horários exatos presentes na planilha importada, sem substituir esses intervalos por faixas predefinidas.
2. **Consistência de Alocação de Docentes e Turmas:**
   - Nenhum docente ou turma pode estar alocado em duas disciplinas simultâneas no mesmo dia e horário.
3. **Aulas Consecutivas:**
   - Cada intervalo informado na planilha é tratado como uma faixa única, preservando a duração original da aula.
4. **Origem dos Dados:**
   - O sistema opera exclusivamente com os registros presentes na planilha fornecida. Não devem ser inventados dados pessoais ou docentes para os rótulos provisórios sem professor.

---

## 5. Matriz de Rastreabilidade

| Requisito Funcional | Arquivo Responsável | Elemento / Função |
| :--- | :--- | :--- |
| **RF01**, **RF17** | `frontend/index.html`, `frontend/js/public-app.js` | `.app-header`, semestre letivo |
| **RF02**, **RF13** | `frontend/index.html`, `frontend/js/views/public-schedule-view.js` | Abas de consulta, busca e seletor de entidades |
| **RF03**, **RF04**, **RF05**, **RF06** | `frontend/js/services/`, `frontend/js/public-app.js` | Consultas por turma, curso, professor e co-docência |
| **RF07**, **RF16** | `frontend/js/views/public-schedule-view.js`, `frontend/css/schedules.css` | Grade semanal por blocos e dias |
| **RF08**, **RF09** | `frontend/js/public-app.js`, `frontend/js/views/public-schedule-view.js` | Alternância entre tabela e listagem |
| **RF10**, **RF11**, **RF12** | `frontend/js/state/store.js`, `frontend/js/public-app.js` | Busca, filtros de dia/docente e limpeza |
| **RF14** | `frontend/index.html`, `frontend/js/views/modal-view.js` | `#classDetailModal` |
| **RF15** | `frontend/css/style.css`, `frontend/js/public-app.js` | `@media print`, `btnPrintSchedule` |
| **RF18** | `frontend/index.html`, `frontend/js/views/public-schedule-view.js` | `#scheduleEmptyState`, `btnEmptyReset` |
| **RF19**, **RF20** | `frontend/index.html`, `frontend/js/public-app.js` | `.breadcrumb-bar`, `.app-footer` |

### Backend (monorepo)

| Superfície | Arquivos | Responsabilidade |
| :--- | :--- | :--- |
| Persistência e seed | `backend/prisma/schema.prisma`, `backend/prisma/seed.ts` | Modelos relacionais, constraints de alocação e carga idempotente |
| API de consulta | `backend/src/dtos/`, `backend/src/repositories/`, `backend/src/services/`, `backend/src/controllers/`, `backend/src/routes/` | Validação, consultas Prisma, regras de aplicação e endpoints públicos `/api/*` |
| Banco local | `docker-compose.yml`, `.env.example` | PostgreSQL 16 e configuração local |

### Frontend (monorepo)

| Superfície | Arquivos | Responsabilidade |
| :--- | :--- | :--- |
| Consulta pública | `frontend/index.html`, `frontend/js/api/`, `frontend/js/services/`, `frontend/js/state/`, `frontend/js/views/public-schedule-view.js` | Interface pública em ES Modules, catálogo e horários consumidos da API |
| Administração | `frontend/admin.html`, `frontend/js/views/admin-view.js`, `frontend/js/views/modal-view.js` | Interface administrativa isolada e modais; gravações dependem de endpoints de escrita |
