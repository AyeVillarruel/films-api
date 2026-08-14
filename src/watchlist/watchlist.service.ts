import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { MoviesService } from '../movies/movies.service';
import { WatchlistItem } from './entities/watchlist-item.entity';

export interface WatchlistMovieResponse {
  addedAt: Date;
  movie: Movie;
}

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(WatchlistItem)
    private readonly watchlistRepository: Repository<WatchlistItem>,
    private readonly moviesService: MoviesService,
  ) {}

  async findAllByUser(userId: string): Promise<WatchlistMovieResponse[]> {
    const items = await this.watchlistRepository.find({
      where: { userId },
      relations: { movie: true },
      order: { createdAt: 'DESC' },
    });

    return items.map((item) => ({
      addedAt: item.createdAt,
      movie: item.movie,
    }));
  }

  async getMovieIdsByUser(userId: string): Promise<string[]> {
    const items = await this.watchlistRepository.find({
      where: { userId },
      select: { movieId: true },
    });

    return items.map((item) => item.movieId);
  }

  async add(userId: string, movieId: string): Promise<WatchlistMovieResponse> {
    await this.moviesService.findOne(movieId);

    const existing = await this.watchlistRepository.findOne({
      where: { userId, movieId },
    });

    if (existing) {
      throw new ConflictException('La película ya está en ver más tarde');
    }

    const item = this.watchlistRepository.create({ userId, movieId });
    const saved = await this.watchlistRepository.save(item);

    const withMovie = await this.watchlistRepository.findOne({
      where: { id: saved.id },
      relations: { movie: true },
    });

    return {
      addedAt: withMovie!.createdAt,
      movie: withMovie!.movie,
    };
  }

  async remove(userId: string, movieId: string): Promise<void> {
    const item = await this.watchlistRepository.findOne({
      where: { userId, movieId },
    });

    if (!item) {
      throw new NotFoundException('La película no está en ver más tarde');
    }

    await this.watchlistRepository.remove(item);
  }
}
