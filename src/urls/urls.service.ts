import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { Url } from './entities/url.entity';
import { CreateUrlDto } from './dtos/create-url.dto';
import { UpdateUrlDto } from './dtos/update-url.dto';

@Injectable()
export class UrlsService {
  constructor(
    @InjectRepository(Url)
    /* c8 ignore next 2 */
    private readonly urlRepository: Repository<Url>,
    private readonly logger: Logger,
  ) {}

  async create(createUrlDto: CreateUrlDto): Promise<Url> {
    let shortCode: string = nanoid(6);

    while (await this.urlRepository.findOne({ where: { shortCode } })) {
      shortCode = nanoid(6);
    }

    const url = this.urlRepository.create({
      url: createUrlDto.url,
      shortCode,
    });

    const saved = await this.urlRepository.save(url);
    this.logger.log(`URL created: ${saved.shortCode} -> ${saved.url}`);
    return saved;
  }

  async findByShortCode(shortCode: string): Promise<Url> {
    const url = await this.urlRepository.findOne({ where: { shortCode } });

    if (!url) {
      this.logger.warn(`Short URL not found: ${shortCode}`);
      throw new NotFoundException(`Short URL '${shortCode}' not found`);
    }

    await this.urlRepository.increment({ shortCode }, 'accessCount', 1);
    url.accessCount += 1;
    this.logger.log(`URL accessed: ${shortCode} -> ${url.url} (count: ${url.accessCount})`);

    return url;
  }

  async update(shortCode: string, updateUrlDto: UpdateUrlDto): Promise<Url> {
    const url = await this.urlRepository.findOne({ where: { shortCode } });

    if (!url) {
      this.logger.warn(`Update failed, short URL not found: ${shortCode}`);
      throw new NotFoundException(`Short URL '${shortCode}' not found`);
    }

    url.url = updateUrlDto.url;
    const updated = await this.urlRepository.save(url);
    this.logger.log(`URL updated: ${shortCode} -> ${updated.url}`);
    return updated;
  }

  async remove(shortCode: string): Promise<void> {
    const url = await this.urlRepository.findOne({ where: { shortCode } });

    if (!url) {
      this.logger.warn(`Delete failed, short URL not found: ${shortCode}`);
      throw new NotFoundException(`Short URL '${shortCode}' not found`);
    }

    await this.urlRepository.remove(url);
    this.logger.log(`URL deleted: ${shortCode}`);
  }

  async getStats(shortCode: string): Promise<Url> {
    const url = await this.urlRepository.findOne({ where: { shortCode } });

    if (!url) {
      this.logger.warn(`Stats failed, short URL not found: ${shortCode}`);
      throw new NotFoundException(`Short URL '${shortCode}' not found`);
    }

    this.logger.log(`Stats retrieved: ${shortCode} (count: ${url.accessCount})`);
    return url;
  }
}