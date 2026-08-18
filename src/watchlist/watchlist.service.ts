import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMovieCollectionService } from '../common/services/user-movie-collection.service';
import { Movie } from '../movies/entities/movie.entity';
import { MoviesService } from '../movies/movies.service';
import { WatchlistItem } from './entities/watchlist-item.entity';

export interface WatchlistMovieResponse extends Record<string, unknown> {
  addedAt: Date;
  movie: Movie;
}

@Injectable()
export class WatchlistService extends UserMovieCollectionService<
  WatchlistItem,
  WatchlistMovieResponse
> {
  constructor(
    @InjectRepository(WatchlistItem)
    watchlistRepository: Repository<WatchlistItem>,
    moviesService: MoviesService,
  ) {
    super(
      watchlistRepository,
      moviesService,
      'La película ya está en ver más tarde',
      'La película no está en ver más tarde',
    );
  }

  protected mapToResponse(
    item: WatchlistItem & { movie: Movie },
  ): WatchlistMovieResponse {
    return {
      addedAt: item.createdAt,
      movie: item.movie,
    };
  }

  async getMovieIdsByUser(userId: string): Promise<string[]> {
    const items = await this.repository.find({
      where: { userId },
      select: { movieId: true },
    });

    return items.map((item) => item.movieId);
  }
}
