import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { MoviesService } from '../movies/movies.service';
import { Favorite } from './entities/favorite.entity';

export interface FavoriteMovieResponse {
  favoritedAt: Date;
  movie: Movie;
}

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    private readonly moviesService: MoviesService,
  ) {}

  async findAllByUser(userId: string): Promise<FavoriteMovieResponse[]> {
    const favorites = await this.favoritesRepository.find({
      where: { userId },
      relations: { movie: true },
      order: { createdAt: 'DESC' },
    });

    return favorites.map((favorite) => ({
      favoritedAt: favorite.createdAt,
      movie: favorite.movie,
    }));
  }

  async add(userId: string, movieId: string): Promise<FavoriteMovieResponse> {
    await this.moviesService.findOne(movieId);

    const existing = await this.favoritesRepository.findOne({
      where: { userId, movieId },
    });

    if (existing) {
      throw new ConflictException('La película ya está en favoritos');
    }

    const favorite = this.favoritesRepository.create({ userId, movieId });
    const saved = await this.favoritesRepository.save(favorite);

    const withMovie = await this.favoritesRepository.findOne({
      where: { id: saved.id },
      relations: { movie: true },
    });

    return {
      favoritedAt: withMovie!.createdAt,
      movie: withMovie!.movie,
    };
  }

  async remove(userId: string, movieId: string): Promise<void> {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, movieId },
    });

    if (!favorite) {
      throw new NotFoundException('La película no está en favoritos');
    }

    await this.favoritesRepository.remove(favorite);
  }
}
