import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as nanoidModule from 'nanoid';
import { UrlsService } from 'src/urls/urls.service';
import { Url } from 'src/urls/entities/url.entity';

jest.mock('nanoid', () => ({ nanoid: jest.fn() }));

const mockNanoid = nanoidModule.nanoid as jest.Mock;

const makeUrl = (overrides: Partial<Url> = {}): Url =>
  ({
    id: 1,
    url: 'https://example.com',
    shortCode: 'abc123',
    accessCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Url);

describe('UrlsService', () => {
  let service: UrlsService;
  let repo: jest.Mocked<Repository<Url>>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlsService,
        {
          provide: getRepositoryToken(Url),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            increment: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UrlsService);
    repo = module.get(getRepositoryToken(Url));
    logger = module.get(Logger);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should generate a shortCode, persist and return the URL', async () => {
      const dto = { url: 'https://example.com' };
      const saved = makeUrl();

      mockNanoid.mockReturnValue('abc123');
      repo.findOne.mockResolvedValue(null); 
      repo.create.mockReturnValue(saved);
      repo.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(mockNanoid).toHaveBeenCalledWith(6);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { shortCode: 'abc123' } });
      expect(repo.create).toHaveBeenCalledWith({ url: dto.url, shortCode: 'abc123' });
      expect(repo.save).toHaveBeenCalledWith(saved);
      expect(logger.log).toHaveBeenCalledWith(`URL created: ${saved.shortCode} -> ${saved.url}`);
      expect(result).toBe(saved);
    });

    it('should retry nanoid when shortCode already exists', async () => {
      const dto = { url: 'https://example.com' };
      const saved = makeUrl({ shortCode: 'xyz789' });

      mockNanoid.mockReturnValueOnce('abc123').mockReturnValueOnce('xyz789');
      repo.findOne
        .mockResolvedValueOnce(makeUrl())
        .mockResolvedValueOnce(null);      

      repo.create.mockReturnValue(saved);
      repo.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(mockNanoid).toHaveBeenCalledTimes(2);
      expect(repo.findOne).toHaveBeenCalledTimes(2);
      expect(result).toBe(saved);
    });
  });

  // ─── findByShortCode ────────────────────────────────────────────────────────

  describe('findByShortCode', () => {
    it('should increment accessCount and return the URL', async () => {
      const url = makeUrl({ accessCount: 3 });
      repo.findOne.mockResolvedValue(url);
      repo.increment.mockResolvedValue(undefined as any);

      const result = await service.findByShortCode('abc123');

      expect(repo.increment).toHaveBeenCalledWith({ shortCode: 'abc123' }, 'accessCount', 1);
      expect(result.accessCount).toBe(4);
      expect(logger.log).toHaveBeenCalledWith(
        `URL accessed: abc123 -> ${url.url} (count: 4)`,
      );
    });

    it('should throw NotFoundException when shortCode does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findByShortCode('missing')).rejects.toThrow(
        new NotFoundException(`Short URL 'missing' not found`),
      );
      expect(logger.warn).toHaveBeenCalledWith(`Short URL not found: missing`);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update the URL and return it', async () => {
      const url = makeUrl();
      const dto = { url: 'https://new-url.com' };
      const updated = makeUrl({ url: dto.url });

      repo.findOne.mockResolvedValue(url);
      repo.save.mockResolvedValue(updated);

      const result = await service.update('abc123', dto);

      expect(url.url).toBe(dto.url); 
      expect(repo.save).toHaveBeenCalledWith(url);
      expect(logger.log).toHaveBeenCalledWith(`URL updated: abc123 -> ${updated.url}`);
      expect(result).toBe(updated);
    });

    it('should throw NotFoundException when shortCode does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update('missing', { url: 'https://x.com' })).rejects.toThrow(
        new NotFoundException(`Short URL 'missing' not found`),
      );
      expect(logger.warn).toHaveBeenCalledWith(`Update failed, short URL not found: missing`);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should remove the URL', async () => {
      const url = makeUrl();
      repo.findOne.mockResolvedValue(url);
      repo.remove.mockResolvedValue(url);

      await service.remove('abc123');

      expect(repo.remove).toHaveBeenCalledWith(url);
      expect(logger.log).toHaveBeenCalledWith(`URL deleted: abc123`);
    });

    it('should throw NotFoundException when shortCode does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        new NotFoundException(`Short URL 'missing' not found`),
      );
      expect(logger.warn).toHaveBeenCalledWith(`Delete failed, short URL not found: missing`);
    });
  });

  // ─── getStats ────────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return stats for an existing shortCode', async () => {
      const url = makeUrl({ accessCount: 10 });
      repo.findOne.mockResolvedValue(url);

      const result = await service.getStats('abc123');

      expect(result).toBe(url);
      expect(logger.log).toHaveBeenCalledWith(`Stats retrieved: abc123 (count: 10)`);
    });

    it('should throw NotFoundException when shortCode does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.getStats('missing')).rejects.toThrow(
        new NotFoundException(`Short URL 'missing' not found`),
      );
      expect(logger.warn).toHaveBeenCalledWith(`Stats failed, short URL not found: missing`);
    });
  });
});