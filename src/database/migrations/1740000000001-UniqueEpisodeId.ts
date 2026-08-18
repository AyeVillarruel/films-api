import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class UniqueEpisodeId1740000000001 implements MigrationInterface {
  name = 'UniqueEpisodeId1740000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'movies',
      new TableIndex({
        name: 'IDX_movies_episodeId_unique',
        columnNames: ['episodeId'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('movies', 'IDX_movies_episodeId_unique');
  }
}
