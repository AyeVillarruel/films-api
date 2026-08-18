import { ConflictException, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';
import { Movie } from '../../movies/entities/movie.entity';
import { MoviesService } from '../../movies/movies.service';

export interface UserMovieCollectionItem {
  id: string;
  userId: string;
  movieId: string;
  createdAt: Date;
  movie?: Movie;
}

export abstract class UserMovieCollectionService<
  T extends UserMovieCollectionItem,
  TResponse extends Record<string, unknown>,
> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly moviesService: MoviesService,
    protected readonly alreadyExistsMessage: string,
    protected readonly notFoundMessage: string,
  ) {}

  protected abstract mapToResponse(item: T & { movie: Movie }): TResponse;

  async findAllByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<TResponse>> {
    const [items, total] = await this.repository.findAndCount({
      where: { userId } as FindOptionsWhere<T>,
      relations: { movie: true } as never,
      order: { createdAt: 'DESC' } as never,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: items.map((item) =>
        this.mapToResponse(item as T & { movie: Movie }),
      ),
      total,
      page,
      limit,
    };
  }

  async add(userId: string, movieId: string): Promise<TResponse> {
    const movie = await this.moviesService.findOne(movieId);

    const existing = await this.repository.findOne({
      where: { userId, movieId } as FindOptionsWhere<T>,
    });

    if (existing) {
      throw new ConflictException(this.alreadyExistsMessage);
    }

    const entity = this.repository.create({ userId, movieId } as T);
    const saved = await this.repository.save(entity);

    return this.mapToResponse({ ...saved, movie } as T & { movie: Movie });
  }

  async remove(userId: string, movieId: string): Promise<void> {
    const item = await this.repository.findOne({
      where: { userId, movieId } as FindOptionsWhere<T>,
    });

    if (!item) {
      throw new NotFoundException(this.notFoundMessage);
    }

    await this.repository.remove(item);
  }
}
