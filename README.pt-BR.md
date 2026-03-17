# 🔗 URL Shortener API

> 📖 [English version](./README.md)

Uma API RESTful simples e robusta para encurtamento de URLs, construída com NestJS, TypeScript e PostgreSQL.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Como Executar](#como-executar)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Endpoints da API](#endpoints-da-api)
- [Executando os Testes](#executando-os-testes)
- [Migrations](#migrations)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Trade-offs e Decisões de Design](#trade-offs-e-decisões-de-design)
- [Melhorias Futuras](#melhorias-futuras)

---

## Visão Geral

Esta API permite encurtar URLs longas e acompanhar quantas vezes cada URL curta foi acessada. Oferece operações completas de CRUD e estatísticas de acesso por código curto.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22 |
| Framework | NestJS 11 |
| Linguagem | TypeScript 5 |
| Banco de dados | PostgreSQL 16 |
| ORM | TypeORM |
| Conteinerização | Docker + Docker Compose |
| Documentação | Swagger (OpenAPI) |
| Testes | Jest + Supertest |
| Geração de código curto | nanoid |

---

## Pré-requisitos

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Node.js 22+](https://nodejs.org/) _(apenas para desenvolvimento local)_
- [npm](https://www.npmjs.com/)

---

## Como Executar

### Com Docker (recomendado)

```bash
# Clone o repositório
git clone https://github.com/ThalesAbdon/url-shortener.git
cd url-shortener

# Copie as variáveis de ambiente
cp .env.example .env

# Suba todos os serviços
docker compose up --build
```

A API estará disponível em `http://localhost:4040`.  
A documentação Swagger estará em `http://localhost:4040/docs`.

> As migrations são executadas automaticamente na inicialização do container via `entrypoint.sh`.

---

### Localmente

```bash
# Instale as dependências
npm install

# Copie e configure as variáveis de ambiente
cp .env.example .env

# Suba apenas o banco de dados
docker compose up db -d

# Execute as migrations
npm run migration:run

# Inicie em modo de desenvolvimento
npm run start:dev
```

---

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | String de conexão com o PostgreSQL | `postgresql://postgres:postgres@localhost:5499/urlshortener` |
| `PORT` | Porta em que a API escuta | `4040` |
| `BASE_URL` | URL base para geração dos links curtos | `http://localhost:4040` |

---

## Endpoints da API

| Método | Endpoint | Descrição | Sucesso |
|---|---|---|---|
| `POST` | `/shorten` | Cria uma nova URL curta | `201 Created` |
| `GET` | `/shorten/:shortCode` | Recupera a URL original | `200 OK` |
| `PUT` | `/shorten/:shortCode` | Atualiza uma URL existente | `200 OK` |
| `DELETE` | `/shorten/:shortCode` | Remove uma URL curta | `204 No Content` |
| `GET` | `/shorten/:shortCode/stats` | Retorna estatísticas de acesso | `200 OK` |

### Exemplos

**Criar uma URL curta**
```http
POST /shorten
Content-Type: application/json

{
  "url": "https://www.example.com/uma/url/muito/longa"
}
```

```json
{
  "id": 1,
  "url": "https://www.example.com/uma/url/muito/longa",
  "shortCode": "abc123",
  "accessCount": 0,
  "createdAt": "2021-09-01T12:00:00Z",
  "updatedAt": "2021-09-01T12:00:00Z"
}
```

**Consultar estatísticas**
```http
GET /shorten/abc123/stats
```

```json
{
  "id": 1,
  "url": "https://www.example.com/uma/url/muito/longa",
  "shortCode": "abc123",
  "accessCount": 42,
  "createdAt": "2021-09-01T12:00:00Z",
  "updatedAt": "2021-09-01T12:00:00Z"
}
```

Para a documentação interativa completa, acesse `http://localhost:4040/docs`.

---

## Executando os Testes

```bash
# Suba o banco de testes
docker compose up db-test -d

# Testes unitários com cobertura (urls.service.ts)
npm run test:cov

# Testes E2E com cobertura (urls.controller.ts)
npm run test:e2e

# Executa todos os testes em sequência
npm run test:all
```

### Cobertura

| Camada | Arquivo | Cobertura |
|---|---|---|
| Unitário | `urls.service.ts` | 100% |
| E2E | `urls.controller.ts` | 100% |

---

## Migrations

```bash
# Executar migrations pendentes
npm run migration:run

# Gerar nova migration a partir de mudanças na entity
npm run migration:generate src/migrations/NomeDaMigration

# Reverter a última migration
npm run migration:revert
```

> As migrations são executadas automaticamente ao iniciar o container Docker.

---

## Estrutura do Projeto

```
src/
├── migrations/                        # Arquivos de migration do TypeORM
├── urls/
│   ├── dtos/
│   │   ├── create-url.dto.ts
│   │   └── update-url.dto.ts
│   ├── entities/
│   │   └── url.entity.ts
│   ├── urls.controller.ts
│   ├── urls.module.ts
│   └── urls.service.ts
├── app.module.ts
├── data-source.ts                     # DataSource do TypeORM para o CLI
├── main.ts
└── migrate.ts                         # Script executor de migrations
tests/
├── unit/
│   └── urls.service.spec.ts
└── e2e/
    └── urls.e2e-spec.ts
```

---

## Trade-offs e Decisões de Design

**`nanoid` com retry de colisão**  
Os códigos curtos são gerados aleatoriamente com `nanoid(6)`, oferecendo ~56 bilhões de combinações possíveis. Em caso de colisão, o serviço tenta novamente até encontrar um código único. Em escala, um pool pré-gerado seria mais eficiente, mas para este escopo a abordagem de retry é simples e segura.

**Incremento atômico do `accessCount`**  
Em vez de um `SELECT` seguido de `UPDATE`, o contador de acessos usa uma única query atômica `UPDATE ... SET "accessCount" = "accessCount" + 1 RETURNING *`. Isso previne race conditions em requisições simultâneas sem necessidade de lock na aplicação.

**`synchronize: false` com migrations explícitas**  
O `synchronize: true` do TypeORM é conveniente em desenvolvimento, mas perigoso em produção — pode silenciosamente remover colunas. Todas as mudanças de schema são gerenciadas por arquivos de migration versionados, garantindo controle e rastreabilidade total sobre a evolução do banco.

**Banco de dados dedicado para testes**  
Os testes E2E rodam contra uma instância real de PostgreSQL (`db-test`) em vez de mocks ou SQLite. Isso garante que os testes reflitam o comportamento real de produção, incluindo semântica de queries, constraints e comportamento de índices.

**Build Docker em dois estágios**  
O Dockerfile usa um estágio builder para compilar o TypeScript e um estágio de produção enxuto que copia apenas o `dist/` e as dependências de produção, resultando em uma imagem final menor e mais segura.

---

## Melhorias Futuras

- **Códigos personalizados** — permitir que o usuário escolha seu próprio código curto
- **Expiração de links** — adicionar campo `expiresAt` para expirar links automaticamente após um período
- **Endpoint de redirecionamento** — adicionar `GET /:shortCode` que redireciona com `301/302` diretamente pela API (atualmente o frontend é responsável pelo redirecionamento)
- **Rate limiting** — prevenir abuso no endpoint `POST /shorten` usando `@nestjs/throttler`
- **Pool de códigos pré-gerados** — em alta escala, pré-gerar e cachear códigos disponíveis para evitar retries de colisão
- **Logs de acesso com timestamps** — registrar cada acesso individualmente para análises mais ricas
- **Autenticação** — permitir que usuários gerenciem apenas suas próprias URLs
- **Criação idempotente de URLs** — se a mesma URL longa for enviada duas vezes, retornar o código curto já existente em vez de criar uma entrada duplicada. Atualmente cada `POST /shorten` sempre gera uma nova entrada, o que é intencional para permitir múltiplos códigos por URL, mas a idempotência poderia ser oferecida via header ou endpoint dedicado
- **Arquitetura orientada a eventos** — publicar eventos de domínio (ex: `url.created`, `url.accessed`, `url.deleted`) em um message broker como RabbitMQ ou Kafka. Isso desacoplaria analytics, notificações e auditoria da API principal, tornando o serviço um candidato natural para um ambiente de microsserviços
