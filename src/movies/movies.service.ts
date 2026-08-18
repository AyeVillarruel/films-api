import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';
import { SwapiService } from './swapi.service';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
    private readonly swapiService: SwapiService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll(page = 1, limit = 20): Promise<PaginatedResponse<Movie>> {
    const [data, total] = await this.moviesRepository.findAndCount({
      order: { episodeId: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.moviesRepository.findOne({ where: { id } });

    if (!movie) {
      throw new NotFoundException(`Película con id ${id} no encontrada`);
    }

    return movie;
  }

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const movie = this.moviesRepository.create(createMovieDto);
    return this.moviesRepository.save(movie);
  }

  async update(id: string, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.findOne(id);
    Object.assign(movie, updateMovieDto);
    return this.moviesRepository.save(movie);
  }

  async remove(id: string): Promise<void> {
    const movie = await this.findOne(id);
    await this.moviesRepository.remove(movie);
  }

  async syncFromSwapi(): Promise<{
    synced: number;
    created: number;
    updated: number;
  }> {
    const swapiFilms = await this.swapiService.fetchAllFilms();
    const movieDataArray = swapiFilms.map((film) => ({
      title: film.title,
      episodeId: film.episode_id,
      openingCrawl: film.opening_crawl,
      director: film.director,
      producer: film.producer,
      releaseDate: film.release_date,
      swapiId: this.swapiService.extractSwapiId(film.url),
    }));

    const swapiIds = movieDataArray.map((movie) => movie.swapiId);
    const existingMovies = swapiIds.length
      ? await this.moviesRepository.findBy({ swapiId: In(swapiIds) })
      : [];
    const existingIds = new Set(existingMovies.map((movie) => movie.swapiId));

    let created = 0;
    let updated = 0;

    for (const swapiId of swapiIds) {
      if (existingIds.has(swapiId)) {
        updated++;
      } else {
        created++;
      }
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Movie).upsert(movieDataArray, ['swapiId']);
    });

    return { synced: swapiFilms.length, created, updated };
  }
}
