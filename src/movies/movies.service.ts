import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async findAll(): Promise<Movie[]> {
    return this.moviesRepository.find({ order: { episodeId: 'ASC' } });
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

  async syncFromSwapi(): Promise<{ synced: number; created: number; updated: number }> {
    const swapiFilms = await this.swapiService.fetchAllFilms();
    let created = 0;
    let updated = 0;

    for (const film of swapiFilms) {
      const swapiId = this.swapiService.extractSwapiId(film.url);
      const existing = await this.moviesRepository.findOne({
        where: { swapiId },
      });

      const movieData = {
        title: film.title,
        episodeId: film.episode_id,
        openingCrawl: film.opening_crawl,
        director: film.director,
        producer: film.producer,
        releaseDate: film.release_date,
        swapiId,
      };

      if (existing) {
        Object.assign(existing, movieData);
        await this.moviesRepository.save(existing);
        updated++;
      } else {
        const movie = this.moviesRepository.create(movieData);
        await this.moviesRepository.save(movie);
        created++;
      }
    }

    return { synced: swapiFilms.length, created, updated };
  }
}
