import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Url } from './urls/entities/url.entity';

const isCompiled = __filename.endsWith('.js');

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Url],
  migrations: [isCompiled ? 'dist/migrations/*.js' : 'src/migrations/*.ts'],
  ssl: false,
});