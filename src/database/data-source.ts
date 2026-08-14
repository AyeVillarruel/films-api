import { DataSource } from 'typeorm';
import { buildTypeOrmConfig } from './typeorm.config';

export default new DataSource(buildTypeOrmConfig());
