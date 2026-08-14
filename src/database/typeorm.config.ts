import { DataSourceOptions } from 'typeorm';
import { entities } from './entities';
import { InitialSchema1740000000000 } from './migrations/1740000000000-InitialSchema';

export const buildTypeOrmConfig = (): DataSourceOptions => ({
  type: 'better-sqlite3',
  database: process.env.DB_PATH || 'films.db',
  entities,
  migrations: [InitialSchema1740000000000],
  synchronize: false,
});
