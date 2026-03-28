# Asset Manager Studio

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![React](https://img.shields.io/badge/React-19-blue)
![Tests](https://img.shields.io/badge/testes-157%2B%20unit%20%7C%2039%20e2e-green)

Sistema de gestão patrimonial imobiliária com extração inteligente de documentos via IA, controle financeiro integrado e conciliação bancária automatizada.

---

## Visão Geral

O **Asset Manager Studio** centraliza a administração de imóveis, inquilinos, contratos e documentos fiscais em uma única plataforma. Foi projetado para investidores e administradores de carteiras imobiliárias que precisam:

- Acompanhar o valor patrimonial e a situação de cada ativo
- Controlar financiamentos com projeções reais de fluxo de caixa
- Gerenciar inquilinos, contratos e reajustes de aluguel (IPCA)
- Importar dados do IRPF e notas fiscais automaticamente via IA
- Conciliar pagamentos PIX com contratos ativos
- Gerar relatórios financeiros consolidados

O sistema usa **Google Gemini** para extrair dados de PDFs (declarações IRPF, notas fiscais, contratos) e **Gmail API** para importar notas fiscais diretamente do e-mail.

### Documentação Complementar

| Documento | Descrição |
|-----------|-----------|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Guia de contribuição e padrões de código |
| [CHANGELOG.md](./CHANGELOG.md) | Histórico completo de versões |
| [SECURITY.md](./SECURITY.md) | Política de segurança e proteções |
| [docs/API.md](./docs/API.md) | Documentação das API Routes e Server Actions |
| [docs/DATABASE.md](./docs/DATABASE.md) | Schema do banco de dados e ERD |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Guia de deploy para produção |

---

## Funcionalidades

### Gestão de Imóveis
- [x] CRUD completo de ativos com wizard de 4 etapas
- [x] Tipos: Apartamento, Casa, Terreno, Sala Comercial, Loja, Galpão, Cobertura, Kitnet
- [x] Controle de participação societária (múltiplos sócios com %)
- [x] Campos de documentação: matrícula, IPTU (inscrição + valor), cartório
- [x] Importação em lote via IRPF com reconciliação automática
- [x] Tabela editável com colunas configuráveis
- [x] Backup e restauração do banco de dados

### Gestão Financeira
- [x] Projeção de fluxo de caixa (12 meses) com receivables e payables
- [x] Cronograma de financiamento com fases (sinal, mensais, balões)
- [x] Simulação de amortização (SAC/PRICE)
- [x] Gestão de dívida com saldo devedor
- [x] Demonstrativo consolidado
- [x] IPTU como despesa recorrente (mensal ou anual)

### Gestão de Inquilinos e Contratos
- [x] Cadastro de inquilinos com aliases aprendidos
- [x] Contratos com número sequencial (CTR-YYYY-###)
- [x] Histórico de pagamentos (pending, paid, partial, overdue)
- [x] Reajuste automático por IPCA (API do Banco Central)
- [x] Conciliação PIX — matching de extratos bancários com contratos

### Notas Fiscais
- [x] Extração via IA (upload de PDF/imagem)
- [x] Importação automática via Gmail
- [x] Campos estruturados: emissor, tomador, itens, valores
- [x] Categorização automática (Saúde, Educação, Reforma, etc.)
- [x] Dashboard com tabs: resumo, Gmail, histórico, auditoria

### Importação IRPF
- [x] Upload de declaração IRPF em PDF
- [x] Extração de dados imobiliários via Gemini AI
- [x] Reconciliação automática com ativos existentes (score de similaridade)
- [x] Revisão item a item com modal de auditoria
- [x] Salvamento em lote de todos os ativos importados

### Relatórios e Auditoria
- [x] Relatório executivo financeiro
- [x] Relatório individual por imóvel
- [x] Log de auditoria do sistema (CREATE, UPDATE, DELETE, LEARN_ALIAS)
- [ ] Exportação para Excel/PDF

> ⚠️ Em desenvolvimento: exportação de relatórios, login OAuth em produção

---

## Arquitetura

### Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router, Turbopack) | 16.1 |
| Interface | React + Tailwind CSS | 19 / v4 |
| Banco de Dados | Prisma ORM (SQLite) | 6.19 |
| IA / Extração | Google Gemini API | 2.5 Flash |
| Autenticação | Auth.js (Google OAuth, JWT) | v5 beta |
| Componentes UI | Radix UI, Recharts, Lucide | — |
| Formulários | React Hook Form + Zod | v7 / v4 |
| PDF | pdfjs-dist | 5.4 |
| Testes Unit | Vitest + Coverage V8 | 4.1 |
| Testes E2E | Playwright (Chromium) | 1.58 |

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER (React 19)                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐ │
│  │ Dashboard │  │  Assets   │  │Financial │  │Invoices│ │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └───┬────┘ │
│       └───────────────┼─────────────┼────────────┘      │
│                       │ AssetContext (state)             │
└───────────────────────┼─────────────────────────────────┘
                        │ Server Actions / API Routes
┌───────────────────────┼─────────────────────────────────┐
│                  NEXT.JS SERVER                         │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  actions/   │  │   api/     │  │   middleware.ts   │  │
│  │  assets.ts  │  │  invoices  │  │  ├─ rate limit   │  │
│  │  rental.ts  │  │  ai/       │  │  ├─ CSRF         │  │
│  │ financial.ts│  │  gmail/    │  │  ├─ RBAC         │  │
│  │ contracts.ts│  │  auth/     │  │  └─ sec headers  │  │
│  └──────┬─────┘  └─────┬──────┘  └──────────────────┘  │
│         └──────────────┬┘                               │
│                   ┌────┴────┐                           │
│                   │ Prisma  │                           │
│                   │ (SQLite)│                           │
│                   └─────────┘                           │
└─────────────────────────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  Gemini  │  │  Gmail   │  │ BCB API  │
    │  AI API  │  │   API    │  │  (IPCA)  │
    └──────────┘  └──────────┘  └──────────┘
```

### Estrutura de Pastas

```
src/
├── app/
│   ├── actions/              # 8 Server Actions
│   │   ├── assets.ts         #   CRUD, bulk import, rent update
│   │   ├── financial.ts      #   Projeção de fluxo de caixa
│   │   ├── rental.ts         #   Conciliação PIX, reajustes IPCA
│   │   ├── contracts.ts      #   Listagem paginada de contratos
│   │   ├── contract-management.ts  # Upsert de contratos e inquilinos
│   │   ├── tenants.ts        #   Listagem paginada de inquilinos
│   │   ├── tenant_search.ts  #   Busca por nome com contratos
│   │   └── audit.ts          #   Logs de auditoria
│   ├── api/
│   │   ├── ai/extract/       # Extração de NF via Gemini
│   │   ├── ai/irpf-extract/  # Extração de IRPF via Gemini
│   │   ├── auth/[...nextauth]/ # OAuth endpoints
│   │   ├── gmail/            # Messages, attachments, token
│   │   └── invoices/         # CRUD de notas fiscais (REST)
│   ├── dashboard/            # Dashboard principal
│   ├── assets/               # Listagem, cadastro, valores, importação
│   ├── financial/            # Overview, cronograma, dívida, consolidado
│   ├── contracts/            # Gestão de contratos
│   ├── tenants/              # Gestão de inquilinos
│   ├── invoices/             # Notas fiscais
│   ├── adjustments/          # Reajustes de aluguel
│   ├── conciliacao/          # Conciliação PIX
│   ├── reports/              # Relatórios (executivo, individual, financeiro)
│   ├── simulations/          # Simulações de amortização
│   └── system-audit/         # Logs de auditoria
├── components/
│   ├── ai-studio/
│   │   ├── pages/            # 37 componentes de página
│   │   │   ├── Forms/        # AssetRegistration, FinancingModal, LeaseModal, etc.
│   │   │   ├── FinancialOverview/ # CashFlowGrid, ProjectedCashFlowChart
│   │   │   └── invoices/     # DashboardTab, GmailTab, AuditTab, etc.
│   │   ├── components/       # DatePicker, Sidebar, TopBar
│   │   ├── types.ts          # Interfaces (Asset, Contract, Invoice, etc.)
│   │   └── helpers/          # irpfParser
│   ├── wizard/               # Wizard de cadastro (4 steps)
│   ├── ErrorBoundary.tsx
│   ├── DatabaseBackup.tsx
│   └── LoadingSkeleton.tsx
├── context/
│   └── AssetContext.tsx       # Estado global (assets, navegação, CRUD)
├── hooks/
│   └── useAssetForm.ts       # Hook do formulário de ativos
├── lib/
│   ├── prisma.ts             # Singleton do Prisma Client
│   ├── auth-guard.ts         # requireAuth(), requireAdmin()
│   ├── rate-limit.ts         # Sliding window rate limiter
│   ├── action-schemas.ts     # Schemas Zod (saveAsset, contract, pix, etc.)
│   ├── validations.ts        # Validação de API routes
│   ├── formatters.ts         # formatMoney(), normalizeDate()
│   ├── audit.ts              # logAudit()
│   ├── logger.ts             # Logger centralizado
│   ├── api-utils.ts          # Helpers para API responses
│   ├── constants.ts          # Tipos, cores, padrões de validação
│   └── env.ts                # Validação de env vars (Zod)
├── services/
│   └── bcb.ts                # API do Banco Central (índices IPCA)
├── utils/
│   ├── financial.ts          # Cálculo de reajuste IPCA
│   └── generators.ts         # generateContractNumber()
└── types/
    └── next-auth.d.ts        # Augmentação de tipos NextAuth
```

### Modelos do Banco de Dados (Prisma)

```
Asset ──┬── AssetPartner[]     (sócios com %)
        ├── Financing?          (financiamento 1:1)
        ├── Lease[]             (locações legadas)
        └── Contract[]          (contratos ativos)

Tenant ──┬── Contract[]         (contratos de aluguel)
         └── TenantAlias[]      (nomes aprendidos do PIX)

Contract ── PaymentHistory[]    (histórico de pagamentos)

Invoice                         (notas fiscais independentes)
SystemAuditLog                  (log de todas as ações)

User ──┬── Account[]            (OAuth providers)
       └── Session[]            (sessões ativas)
```

---

## Pré-requisitos

| Requisito | Versão Mínima |
|-----------|--------------|
| Node.js | 18.x |
| npm | 9.x |
| Chromium (para E2E) | instalado via Playwright |

### Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `DATABASE_URL` | Sim | URL do banco SQLite (`file:./dev.db`) |
| `GEMINI_API_KEY` | Sim | Chave da API Google Gemini |
| `GOOGLE_CLIENT_ID` | Não* | Client ID do Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Não* | Client Secret do Google OAuth |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Não* | Client ID exposto ao browser (Gmail) |
| `AUTH_SECRET` | Não* | Secret para sessões Auth.js |

> \* Obrigatórias em produção. Em dev, o auth retorna um mock user automaticamente.

---

## Instalação

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd "Gestão de Imóveis 2.0"
npm install

# 2. Configurar ambiente
cp .env.example .env
# Editar .env com suas chaves (mínimo: DATABASE_URL e GEMINI_API_KEY)

# 3. Inicializar banco de dados
npx prisma generate
npx prisma db push

# 4. Iniciar servidor
npm run dev
# → http://localhost:3000

# 5. (Opcional) Instalar browser para testes E2E
npx playwright install chromium
```

---

## Como Usar

### Cadastro de Imóvel

O wizard de 4 etapas guia o cadastro:

1. **Identificação** — Nome, tipo, endereço (com busca por CEP)
2. **Documentação** — Matrícula, inscrição IPTU, valor IPTU (R$), cartório
3. **Financeiro** — Valor de aquisição, mercado, IRPF, financiamento
4. **Sócios** — Participação percentual (deve somar 100%)

### Importação de IRPF

1. Acesse `/assets/import`
2. Upload do PDF da declaração IRPF
3. O Gemini AI extrai automaticamente os imóveis declarados
4. Tela de reconciliação mostra matches automáticos com ativos existentes
5. Revise item a item ou clique **"Salvar Todos os Ativos"** no footer

### Conciliação PIX

1. Acesse `/conciliacao`
2. Cole o extrato bancário (data, valor, descrição)
3. O sistema faz matching automático pelo nome do pagador (com aprendizado)
4. Confirme os pagamentos — o sistema aprende aliases para próximos meses

### Fluxo de Caixa Projetado

A tela `/financial` calcula automaticamente para 12 meses:

- **Receitas**: valor atual de contratos ativos × meses
- **Despesas**: parcelas de financiamento (do cashFlow) + IPTU mensal/anual
- **Saldo**: receitas − despesas

---

## Configuração

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | Linting com ESLint 9 |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Testes com relatório de cobertura |
| `npm run e2e` | Testes E2E (Playwright) |
| `npm run e2e:ui` | Testes E2E com interface visual |
| `npm run e2e:headed` | Testes E2E com browser visível |

### Segurança

| Proteção | Implementação | Escopo |
|----------|--------------|--------|
| Autenticação | Google OAuth via Auth.js v5, sessões JWT | Todas as rotas |
| RBAC | Roles USER/ADMIN, guards em Server Actions e API | `requireAuth()`, `requireAdmin()` |
| CSP | Content-Security-Policy com allowlist | `next.config.ts` |
| Rate Limiting | Sliding window (AI: 5/min, API: 30/min) | `middleware.ts` |
| CSRF | Validação de Origin header em mutations | `middleware.ts` |
| Validação | Schemas Zod em toda entrada de dados | `action-schemas.ts`, `validations.ts` |
| Headers | HSTS, X-Frame-Options DENY, nosniff, XSS | `middleware.ts` + `next.config.ts` |

---

---

## Troubleshooting

### PDF.js version mismatch
Se o worker do PDF.js não carregar, verifique que `pdfjs-dist` e o arquivo worker estão na mesma versão. O projeto usa worker local em vez de CDN.

### Gemini API quota exceeded
O middleware limita a 5 requisições/minuto para rotas `/api/ai/*`. Se exceder, aguarde 60 segundos. Para aumentar o limite, ajuste `maxRequests` em `middleware.ts`.

### Prisma migration failed
```bash
npx prisma db push --force-reset  # CUIDADO: apaga todos os dados
npx prisma generate
```

### OAuth redirect mismatch
Verifique que `NEXTAUTH_URL` corresponde exatamente ao domínio configurado nas redirect URIs do Google Cloud Console.

### Erro de build em contracts/client.tsx
Erro de incompatibilidade de tipos pré-existente. Não afeta o runtime — o build completa com warnings.

## Estado Atual do Desenvolvimento

### Pronto

- Gestão completa de imóveis (CRUD, wizard, tabela editável, participação societária)
- Gestão de inquilinos e contratos com histórico de pagamentos
- Projeção de fluxo de caixa com dados reais (contratos + financiamentos + IPTU)
- Dashboard de financiamento com projeções calculadas a partir de fases
- Importação IRPF com extração AI e reconciliação automática
- Extração de notas fiscais via upload e Gmail
- Conciliação PIX com aprendizado de aliases
- Reajuste automático de aluguéis (IPCA via API do Banco Central)
- Simulações de amortização (SAC/PRICE)
- Auditoria completa de ações do sistema
- 157+ testes unitários + 39 testes E2E

### Em Progresso

- Login OAuth em produção (atualmente mock em dev)
- Exportação de relatórios para Excel/PDF

### Limitações Conhecidas

- **SQLite**: adequado para single-user/MVP; migrar para PostgreSQL para multi-tenant
- **IDs numéricos**: alguns ativos criados com `Date.now()` em vez de UUID
- **Auth mock**: `requireAuth()` retorna mock user em dev — não validar em produção sem habilitar OAuth
- **Erro de build pré-existente**: `src/app/contracts/client.tsx` tem incompatibilidade de tipos que não afeta runtime

---

## Decisões Técnicas

### SQLite em vez de PostgreSQL
**Por quê:** MVP single-user, zero config, arquivo portátil, backup trivial (copiar `dev.db`).
**Trade-off:** Sem concorrência real, sem full-text search nativo, limite de ~1GB prático.
**Migração futura:** Prisma abstrai o driver — trocar `provider = "sqlite"` por `"postgresql"` e rodar `prisma migrate`.

### Server Actions em vez de API Routes
**Por quê:** Next.js 16 favorece Server Actions para mutations. Tipo-seguro end-to-end, sem fetch manual, revalidação automática.
**Exceção:** Invoices usa API REST porque o módulo foi criado como CRUD independente com paginação e query params.

### Gemini Flash em vez de GPT-4
**Por quê:** Custo 10x menor, latência menor para extração estruturada, output JSON nativo. Suficiente para OCR de NFs e IRPF.
**Retry:** 3 tentativas com backoff exponencial (2s, 4s, 8s).

### Zod em vez de validação manual
**Por quê:** Schema único serve para validação de input, tipagem TypeScript e mensagens de erro em português.
**Onde:** `action-schemas.ts` (Server Actions) + `validations.ts` (API routes).

### Context API em vez de Redux/Zustand
**Por quê:** Estado relativamente simples (lista de ativos + navegação). Context + useState é suficiente sem overhead de lib extra.
**Trade-off:** Re-renders em cascata são aceitáveis com ~20 ativos.

---

## Testes

### Unitários e de Integração (Vitest)

13 arquivos com 157+ testes:

| Arquivo | Cobertura |
|---------|-----------|
| `actions-assets.test.ts` | CRUD de ativos, parceiros, financiamento, lease, bulk import |
| `actions-financial.test.ts` | Projeção de fluxo de caixa (receivables, payables, IPTU, balance) |
| `actions-rental.test.ts` | Conciliação PIX, reajuste IPCA, aliases, importação PDF |
| `actions-contracts-tenants.test.ts` | Contratos, inquilinos, busca, paginação |
| `api-invoices.test.ts` | CRUD REST de notas fiscais, validação, audit log |
| `auth-guard.test.ts` | `requireAuth()`, `requireAdmin()` |
| `formatters.test.ts` | Formatação de moeda, datas, números |
| `rate-limit.test.ts` | Sliding window, expiração, limpeza |
| `validations.test.ts` | Schemas Zod |
| `constants.test.ts` | Constantes do sistema |
| `financial-utils.test.ts` | Cálculos financeiros |
| `api-utils.test.ts` | Utilitários de API |
| `logger.test.ts` | Sistema de logging |

```bash
npm run test              # Rodar todos
npm run test:watch        # Modo watch
npm run test:coverage     # Com relatório de cobertura
```

### E2E (Playwright)

8 arquivos com 39 testes:

| Arquivo | Cobertura |
|---------|-----------|
| `navigation.spec.ts` | Sidebar, navegação entre todas as páginas |
| `dashboard.spec.ts` | Renderização, widgets, topbar |
| `assets.spec.ts` | Listagem, valores, IRPF, holdings |
| `contracts.spec.ts` | Renderização e error boundaries |
| `tenants.spec.ts` | Listagem e estabilidade |
| `financial.spec.ts` | Overview, cronograma, dívida, consolidado |
| `invoices.spec.ts` | Tabs e conteúdo |
| `api-security.spec.ts` | Validação, rate limiting, rotas inválidas |

```bash
npm run e2e               # Headless
npm run e2e:ui            # Interface visual
npm run e2e:headed        # Com browser visível
```

---

## Contribuição

### Padrão de Commits

```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração sem mudança de comportamento
test: adição ou correção de testes
docs: documentação
chore: manutenção (deps, config)
```

### Fluxo de Branches

```
main ← feature/nome-da-feature
main ← fix/descricao-do-bug
```

### Antes de Abrir PR

```bash
npm run test              # Todos os testes passam
npm run lint              # Sem erros de lint
npm run build             # Build compila (ignorar erro pré-existente em contracts/client.tsx)
```

---

## Changelog

Veja o histórico completo de versões em [CHANGELOG.md](./CHANGELOG.md).

