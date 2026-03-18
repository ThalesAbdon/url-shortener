import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlsModule } from 'src/urls/urls.module';
import { Url } from 'src/urls/entities/url.entity';
import { DataSource } from 'typeorm';
import request  from 'supertest';

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5498/urlshortener_test';

async function buildApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        url: TEST_DB_URL,
        entities: [Url],
        synchronize: true, 
        dropSchema: false,  
      }),
      UrlsModule,
    ],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.init();
  return app;
}

describe('URLs (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const ds = app.get(DataSource);
    await ds.getRepository(Url).clear();
  });

  // ─── POST /shorten ──────────────────────────────────────────────────────────

  describe('POST /shorten', () => {
    it('201 – creates a short URL and returns full entity', async () => {
      const { body, status } = await request(app.getHttpServer())
        .post('/shorten')
        .send({ url: 'https://www.example.com/some/long/url' });

      expect(status).toBe(201);
      expect(body).toMatchObject({
        url: 'https://www.example.com/some/long/url',
        shortCode: expect.stringMatching(/^[A-Za-z0-9_-]{6}$/),
        accessCount: 0,
      });
      expect(body.id).toBeDefined();
      expect(body.createdAt).toBeDefined();
      expect(body.updatedAt).toBeDefined();
    });

    it('201 – each call generates a unique shortCode', async () => {
      const [r1, r2] = await Promise.all([
        request(app.getHttpServer()).post('/shorten').send({ url: 'https://a.com' }),
        request(app.getHttpServer()).post('/shorten').send({ url: 'https://b.com' }),
      ]);

      expect(r1.status).toBe(201);
      expect(r2.status).toBe(201);
      expect(r1.body.shortCode).not.toBe(r2.body.shortCode);
    });

    it('400 – rejects missing url field', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post('/shorten')
        .send({});

      expect(status).toBe(400);
      expect(body.message).toBeDefined();
    });

    it('400 – rejects invalid url format', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/shorten')
        .send({ url: 'not-a-url' });

      expect(status).toBe(400);
    });
  });

  // ─── GET /shorten/:shortCode ────────────────────────────────────────────────

  describe('GET /shorten/:shortCode', () => {
    it('200 – returns the URL and increments accessCount', async () => {
      const { body: created } = await request(app.getHttpServer())
        .post('/shorten')
        .send({ url: 'https://www.example.com' });

      const { body: first, status } = await request(app.getHttpServer())
        .get(`/shorten/${created.shortCode}`);

      expect(status).toBe(200);
      expect(first.url).toBe('https://www.example.com');
      expect(first.accessCount).toBe(1);

      const { body: second } = await request(app.getHttpServer())
        .get(`/shorten/${created.shortCode}`);

      expect(second.accessCount).toBe(2);
    });

    it('404 – returns not found for unknown shortCode', async () => {
      const { status } = await request(app.getHttpServer())
        .get('/shorten/doesnotexist');

      expect(status).toBe(404);
    });
  });

  // ─── PUT /shorten/:shortCode ────────────────────────────────────────────────

  describe('PUT /shorten/:shortCode', () => {
    it('200 – updates the URL and returns updated entity', async () => {
      const { body: created } = await request(app.getHttpServer())
        .post('/shorten')
        .send({ url: 'https://old-url.com' });

      const { body: updated, status } = await request(app.getHttpServer())
        .put(`/shorten/${created.shortCode}`)
        .send({ url: 'https://new-url.com' });

      expect(status).toBe(200);
      expect(updated.url).toBe('https://new-url.com');
      expect(updated.shortCode).toBe(created.shortCode);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.updatedAt).getTime(),
      );
    });

    it('400 – rejects invalid url on update', async () => {
      const { body: created } = await request(app.getHttpServer())
        .post('/shorten')
        .send({ url: 'https://example.com' });

      const { status } = await request(app.getHttpServer())
        .put(`/shorten/${created.shortCode}`)
        .send({ url: 'not-a-url' });

      expect(status).toBe(400);
    });

    it('404 – returns not found for unknown shortCode', async () => {
      const { status } = await request(app.getHttpServer())
        .put('/shorten/doesnotexist')
        .send({ url: 'https://example.com' });

      expect(status).toBe(404);
    });
  });

  // ─── DELETE /shorten/:shortCode ─────────────────────────────────────────────

  describe('DELETE /shorten/:shortCode', () => {
    it('204 – deletes successfully and subsequent GET returns 404', async () => {
      const { body: created } = await request(app.getHttpServer())
        .post('/shorten')
        .send({ url: 'https://to-be-deleted.com' });

      const { status: deleteStatus } = await request(app.getHttpServer())
        .delete(`/shorten/${created.shortCode}`);

      expect(deleteStatus).toBe(204);

      const { status: getStatus } = await request(app.getHttpServer())
        .get(`/shorten/${created.shortCode}`);

      expect(getStatus).toBe(404);
    });

    it('404 – returns not found for unknown shortCode', async () => {
      const { status } = await request(app.getHttpServer())
        .delete('/shorten/doesnotexist');

      expect(status).toBe(404);
    });
  });

  // ─── GET /shorten/:shortCode/stats ──────────────────────────────────────────

  describe('GET /shorten/:shortCode/stats', () => {
    it('200 – returns stats including accessCount', async () => {
      const { body: created } = await request(app.getHttpServer())
        .post('/shorten')
        .send({ url: 'https://stats-test.com' });

      // Acessa 3 vezes para popular o contador
      await request(app.getHttpServer()).get(`/shorten/${created.shortCode}`);
      await request(app.getHttpServer()).get(`/shorten/${created.shortCode}`);
      await request(app.getHttpServer()).get(`/shorten/${created.shortCode}`);

      const { body: stats, status } = await request(app.getHttpServer())
        .get(`/shorten/${created.shortCode}/stats`);

      expect(status).toBe(200);
      expect(stats.accessCount).toBe(3);
      expect(stats.shortCode).toBe(created.shortCode);
      expect(stats.url).toBe('https://stats-test.com');
    });

    it('200 – accessCount is 0 when URL was never accessed', async () => {
      const { body: created } = await request(app.getHttpServer())
        .post('/shorten')
        .send({ url: 'https://never-accessed.com' });

      const { body: stats } = await request(app.getHttpServer())
        .get(`/shorten/${created.shortCode}/stats`);

      expect(stats.accessCount).toBe(0);
    });

    it('404 – returns not found for unknown shortCode', async () => {
      const { status } = await request(app.getHttpServer())
        .get('/shorten/doesnotexist/stats');

      expect(status).toBe(404);
    });
  });
});