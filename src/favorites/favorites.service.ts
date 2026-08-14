import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMovieCollectionService } from '../common/services/user-movie-collection.service';
import { Movie } from '../movies/entities/movie.entity';
import { MoviesService } from '../movies/movies.service';
import { Favorite } from './entities/favorite.entity';

export interface FavoriteMovieResponse extends Record<string, unknown> {
  favoritedAt: Date;
  movie: Movie;
}

@Injectable()
export class FavoritesService extends UserMovieCollectionService<
  Favorite,
  FavoriteMovieResponse
> {
  constructor(
    @InjectRepository(Favorite)
    favoritesRepository: Repository<Favorite>,
    moviesService: MoviesService,
  ) {
    super(
      favoritesRepository,
      moviesService,
      'La película ya está en favoritos',
      'La película no está en favoritos',
    );
  }

  protected mapToResponse(item: Favorite & { movie: Movie }): FavoriteMovieResponse {
    return {
      favoritedAt: item.createdAt,
      movie: item.movie,
    };
  }
}
