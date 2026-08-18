import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, unique: true })
  episodeId: number;

  @Column({ type: 'text', nullable: true })
  openingCrawl: string;

  @Column({ nullable: true })
  director: string;

  @Column({ nullable: true })
  producer: string;

  @Column({ nullable: true })
  releaseDate: string;

  @Column({ nullable: true, unique: true })
  swapiId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
