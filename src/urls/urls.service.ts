import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
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
    private readonly urlRepository: Repository<Url>,
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

    return this.urlRepository.save(url);
  }

  async findByShortCode(shortCode: string): Promise<Url> {
    const url = await this.urlRepository.findOne({ where: { shortCode } });

    if (!url) {
      throw new NotFoundException(`Short URL '${shortCode}' not found`);
    }

    // Incrementa o contador de acessos
    await this.urlRepository.increment({ shortCode }, 'accessCount', 1);
    url.accessCount += 1;

    return url;
  }

  async update(shortCode: string, updateUrlDto: UpdateUrlDto): Promise<Url> {
    const url = await this.urlRepository.findOne({ where: { shortCode } });

    if (!url) {
      throw new NotFoundException(`Short URL '${shortCode}' not found`);
    }

    url.url = updateUrlDto.url;
    return this.urlRepository.save(url);
  }

  async remove(shortCode: string): Promise<void> {
    const url = await this.urlRepository.findOne({ where: { shortCode } });

    if (!url) {
      throw new NotFoundException(`Short URL '${shortCode}' not found`);
    }

    await this.urlRepository.remove(url);
  }

  async getStats(shortCode: string): Promise<Url> {
    const url = await this.urlRepository.findOne({ where: { shortCode } });

    if (!url) {
      throw new NotFoundException(`Short URL '${shortCode}' not found`);
    }

    return url;
  }
}