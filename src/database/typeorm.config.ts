import { DataSourceOptions } from 'typeorm';
import { entities } from './entities';
import { InitialSchema1740000000000 } from './migrations/1740000000000-InitialSchema';
import { UniqueEpisodeId1740000000001 } from './migrations/1740000000001-UniqueEpisodeId';

export const buildTypeOrmConfig = (dbPath?: string): DataSourceOptions => ({
  type: 'better-sqlite3',
  database: dbPath || process.env.DB_PATH || 'films.db',
  entities,
  migrations: [InitialSchema1740000000000, UniqueEpisodeId1740000000001],
  synchronize: false,
});
