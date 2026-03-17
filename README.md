# 🔗 URL Shortener API

> 📖 [Versão em Português](./README.pt-BR.md)

A simple and robust RESTful API for shortening URLs, built with NestJS, TypeScript, and PostgreSQL.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Running Tests](#running-tests)
- [Database Migrations](#database-migrations)
- [Project Structure](#project-structure)
- [Trade-offs & Design Decisions](#trade-offs--design-decisions)
- [Future Improvements](#future-improvements)

---

## Overview

This API allows users to shorten long URLs and track how many times each short URL has been accessed. It provides full CRUD operations and access statistics per short code.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 |
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 |
| ORM | TypeORM |
| Containerization | Docker + Docker Compose |
| Documentation | Swagger (OpenAPI) |
| Testing | Jest + Supertest |
| Short code generation | nanoid |

---

## Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Node.js 22+](https://nodejs.org/) _(only for local development)_
- [npm](https://www.npmjs.com/)

---

## Getting Started

### Running with Docker (recommended)

```bash
# Clone the repository
git clone https://github.com/ThalesAbdon/url-shortener.git
cd url-shortener

# Copy environment variables
cp .env.example .env

# Build and start all services
docker compose up --build
```

The API will be available at `http://localhost:4040`.  
Swagger documentation at `http://localhost:4040/docs`.

> Database migrations run automatically on startup via `entrypoint.sh`.

---

### Running locally

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Start only the database
docker compose up db -d

# Run migrations
npm run migration:run

# Start in development mode
npm run start:dev
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5499/urlshortener` |
| `PORT` | Port the API listens on | `4040` |
| `BASE_URL` | Base URL for generating short links | `http://localhost:4040` |

---

## API Endpoints

| Method | Endpoint | Description | Success |
|---|---|---|---|
| `POST` | `/shorten` | Create a new short URL | `201 Created` |
| `GET` | `/shorten/:shortCode` | Retrieve original URL | `200 OK` |
| `PUT` | `/shorten/:shortCode` | Update an existing short URL | `200 OK` |
| `DELETE` | `/shorten/:shortCode` | Delete a short URL | `204 No Content` |
| `GET` | `/shorten/:shortCode/stats` | Get access statistics | `200 OK` |

### Examples

**Create a short URL**
```http
POST /shorten
Content-Type: application/json

{
  "url": "https://www.example.com/some/very/long/url"
}
```

```json
{
  "id": 1,
  "url": "https://www.example.com/some/very/long/url",
  "shortCode": "abc123",
  "accessCount": 0,
  "createdAt": "2021-09-01T12:00:00Z",
  "updatedAt": "2021-09-01T12:00:00Z"
}
```

**Get statistics**
```http
GET /shorten/abc123/stats
```

```json
{
  "id": 1,
  "url": "https://www.example.com/some/very/long/url",
  "shortCode": "abc123",
  "accessCount": 42,
  "createdAt": "2021-09-01T12:00:00Z",
  "updatedAt": "2021-09-01T12:00:00Z"
}
```

For full interactive documentation, visit `http://localhost:4040/docs`.

---

## Running Tests

```bash
# If you haven't installed the dependencies yet
npm install

# Start the test database
docker compose up db-test -d

# Unit tests with coverage (urls.service.ts)
npm run test:cov

# E2E tests with coverage (urls.controller.ts)
npm run test:e2e

# Run all tests sequentially
npm run test:all
```

### Coverage

| Layer | File | Coverage |
|---|---|---|
| Unit | `urls.service.ts` | 100% |
| E2E | `urls.controller.ts` | 100% |

---

## Database Migrations

```bash
# Run pending migrations
npm run migration:run

# Generate a new migration from entity changes
npm run migration:generate src/migrations/MigrationName

# Revert the last migration
npm run migration:revert
```

> Migrations run automatically when the Docker container starts.

---

## Project Structure

```
src/
├── common/
│   └── filters/
│       └── http-exception.filter.ts  # Global exception filter
├── migrations/                        # TypeORM migration files
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
├── data-source.ts                     # TypeORM DataSource for CLI
├── main.ts
└── migrate.ts                         # Migration runner script
tests/
├── unit/
│   └── urls.service.spec.ts
└── e2e/
    └── urls.e2e-spec.ts
```

---

## Trade-offs & Design Decisions

**`nanoid` with collision retry**  
Short codes are generated randomly using `nanoid(6)`, providing ~56 billion possible combinations. In the unlikely event of a collision, the service retries until a unique code is found. At scale, a pre-generated pool would be more efficient, but for this scope the retry approach is simple and safe.

**Atomic `accessCount` increment**  
Instead of a `SELECT` followed by an `UPDATE`, the access counter uses a single atomic `UPDATE ... SET "accessCount" = "accessCount" + 1 RETURNING *` query. This prevents race conditions under concurrent requests without requiring application-level locking.

**`synchronize: false` with explicit migrations**  
TypeORM's `synchronize: true` is convenient in development but dangerous in production — it can silently drop columns. All schema changes are managed through versioned migration files, giving full control and auditability over database evolution.

**Separate test database**  
E2E tests run against a real PostgreSQL instance (`db-test`) rather than mocks or SQLite. This ensures tests reflect actual production behavior, including query semantics, constraints, and index behavior.

**Two-stage Docker build**  
The Dockerfile uses a builder stage to compile TypeScript and a lean production stage that only copies `dist/` and production dependencies, resulting in a smaller and more secure final image.

**Rate limiting**  
Each IP is limited to 3 requests per second and 100 requests per minute using `@nestjs/throttler`. Requests exceeding the limit receive a `429 Too Many Requests` response. The `ttl` and `limit` values are hardcoded for simplicity but could be extracted to environment variables to allow fine-tuning per environment without rebuilding the application.

**Global exception filter**  
All errors are caught by a global `HttpExceptionFilter` that returns a consistent response contract — `statusCode`, `timestamp`, `path`, and `message` — regardless of where the exception originates. Unknown errors return `500 Internal Server Error` without exposing stack traces, while `HttpException` instances preserve their original status codes. Errors 5xx are logged with full stack traces; 4xx are logged as warnings.

---

## Future Improvements

- **Custom short codes** — allow users to choose their own short code instead of a random one
- **Expiration** — add a `expiresAt` field to auto-expire links after a given time
- **Full redirect endpoint** — add `GET /:shortCode` that redirects with `301/302` directly from the API (currently the frontend is responsible)
- **Pre-generated code pool** — at high scale, pre-generate and cache available short codes to avoid collision retries
- **Pagination on stats** — add access logs with timestamps per visit for richer analytics
- **Authentication** — allow users to manage only their own URLs
- **Idempotent URL creation** — if the same long URL is submitted twice, return the existing short code instead of creating a duplicate. Currently each `POST /shorten` always generates a new entry, which is intentional to allow multiple short codes per URL, but idempotency could be an option via a request header or a dedicated endpoint
- **Event-driven architecture** — publish domain events (e.g. `url.created`, `url.accessed`, `url.deleted`) to a message broker like RabbitMQ or Kafka. This would decouple analytics, notifications, and audit logging from the core API, making it a natural fit for a microservices environment