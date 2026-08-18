import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { RateMovieDto } from './dto/rate-movie.dto';
import { Rating } from './entities/rating.entity';

export interface RatingResponse {
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MovieRatingStats {
  averageScore: number | null;
  ratingsCount: number;
}

export interface RankingEntry {
  movie: Movie;
  averageScore: number;
  ratingsCount: number;
}

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingsRepository: Repository<Rating>,
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
  ) {}

  async rate(
    userId: string,
    movieId: string,
    rateMovieDto: RateMovieDto,
  ): Promise<RatingResponse> {
    await this.ensureMovieExists(movieId);

    let rating = await this.ratingsRepository.findOne({
      where: { userId, movieId },
    });

    if (rating) {
      rating.score = rateMovieDto.score;
    } else {
      rating = this.ratingsRepository.create({
        userId,
        movieId,
        score: rateMovieDto.score,
      });
    }

    const saved = await this.ratingsRepository.save(rating);

    return {
      score: saved.score,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async getMyRating(
    userId: string,
    movieId: string,
  ): Promise<RatingResponse | null> {
    await this.ensureMovieExists(movieId);

    const rating = await this.ratingsRepository.findOne({
      where: { userId, movieId },
    });

    if (!rating) {
      return null;
    }

    return {
      score: rating.score,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    };
  }

  async remove(userId: string, movieId: string): Promise<void> {
    const rating = await this.ratingsRepository.findOne({
      where: { userId, movieId },
    });

    if (!rating) {
      throw new NotFoundException('No has puntuado esta película');
    }

    await this.ratingsRepository.remove(rating);
  }

  async getMovieStats(movieId: string): Promise<MovieRatingStats> {
    await this.ensureMovieExists(movieId);

    const result = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.score)', 'averageScore')
      .addSelect('COUNT(rating.id)', 'ratingsCount')
      .where('rating.movieId = :movieId', { movieId })
      .getRawOne<{ averageScore: string | null; ratingsCount: string }>();

    const ratingsCount = parseInt(result?.ratingsCount ?? '0', 10);

    return {
      averageScore:
        ratingsCount > 0
          ? this.roundScore(parseFloat(result!.averageScore!))
          : null,
      ratingsCount,
    };
  }

  async getRanking(minVotes?: number, limit?: number): Promise<RankingEntry[]> {
    let query = this.ratingsRepository
      .createQueryBuilder('rating')
      .select('rating.movieId', 'movieId')
      .addSelect('AVG(rating.score)', 'averageScore')
      .addSelect('COUNT(rating.id)', 'ratingsCount')
      .groupBy('rating.movieId')
      .having('COUNT(rating.id) >= :minVotes', { minVotes: minVotes ?? 1 })
      .orderBy('averageScore', 'DESC')
      .addOrderBy('ratingsCount', 'DESC');

    if (limit) {
      query = query.limit(limit);
    }

    const rows = await query.getRawMany<{
      movieId: string;
      averageScore: string;
      ratingsCount: string;
    }>();

    if (rows.length === 0) {
      return [];
    }

    const movies = await this.moviesRepository.findBy({
      id: In(rows.map((row) => row.movieId)),
    });

    const moviesMap = new Map(movies.map((movie) => [movie.id, movie]));

    return rows
      .map((row) => {
        const movie = moviesMap.get(row.movieId);

        if (!movie) {
          return null;
        }

        return {
          movie,
          averageScore: this.roundScore(parseFloat(row.averageScore)),
          ratingsCount: parseInt(row.ratingsCount, 10),
        };
      })
      .filter((entry): entry is RankingEntry => entry !== null);
  }

  private async ensureMovieExists(movieId: string): Promise<Movie> {
    const movie = await this.moviesRepository.findOne({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException(`Película con id ${movieId} no encontrada`);
    }

    return movie;
  }

  private roundScore(score: number): number {
    return Math.round(score * 10) / 10;
  }
}
