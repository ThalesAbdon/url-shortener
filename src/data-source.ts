import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Url } from './urls/entities/url.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Url],
  migrations: ['src/migrations/*.ts'],
  ssl: false,
});