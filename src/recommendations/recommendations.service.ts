import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../favorites/entities/favorite.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import { WatchlistItem } from '../watchlist/entities/watchlist-item.entity';

export interface Recommendation {
  movie: Movie;
  reason: string;
  relevanceScore: number;
  averageScore: number | null;
}

const HIGH_RATING_THRESHOLD = 4;
const AFFINITY_WEIGHT = 0.7;
const GLOBAL_QUALITY_WEIGHT = 0.3;
const DIRECTOR_AFFINITY = 1;
const SAGA_AFFINITY = 0.7;
const ADJACENT_AFFINITY = 0.4;

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
    @InjectRepository(Rating)
    private readonly ratingsRepository: Repository<Rating>,
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    @InjectRepository(WatchlistItem)
    private readonly watchlistRepository: Repository<WatchlistItem>,
    private readonly ratingsService: RatingsService,
  ) {}

  async getForUser(userId: string, limit = 5): Promise<Recommendation[]> {
    const [movies, userRatings, favorites, watchlistItems, ranking] =
      await Promise.all([
        this.moviesRepository.find({ order: { episodeId: 'ASC' } }),
        this.ratingsRepository.find({
          where: { userId },
          relations: { movie: true },
        }),
        this.favoritesRepository.find({
          where: { userId },
          relations: { movie: true },
        }),
        this.watchlistRepository.find({
          where: { userId },
          select: { movieId: true },
        }),
        this.ratingsService.getRanking(1),
      ]);

    const globalAverages = new Map(
      ranking.map((entry) => [entry.movie.id, entry.averageScore]),
    );

    const excludedIds = new Set<string>([
      ...userRatings.map((rating) => rating.movieId),
      ...favorites.map((favorite) => favorite.movieId),
      ...watchlistItems.map((item) => item.movieId),
    ]);

    const likedMovies = this.buildLikedMovies(userRatings, favorites);
    const candidates = movies.filter((movie) => !excludedIds.has(movie.id));

    if (candidates.length === 0) {
      return [];
    }

    if (likedMovies.length === 0) {
      return this.buildColdStartRecommendations(
        candidates,
        globalAverages,
        limit,
      );
    }

    return candidates
      .map((candidate) => {
        const globalAverage = globalAverages.get(candidate.id) ?? null;
        const { score, reason } = this.scoreCandidate(
          candidate,
          likedMovies,
          globalAverage,
        );

        return {
          movie: candidate,
          reason,
          relevanceScore: Math.round(score * 100) / 10,
          averageScore: globalAverage,
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private buildLikedMovies(
    userRatings: Rating[],
    favorites: Favorite[],
  ): Movie[] {
    const likedById = new Map<string, Movie>();

    for (const rating of userRatings) {
      if (rating.score >= HIGH_RATING_THRESHOLD && rating.movie) {
        likedById.set(rating.movie.id, rating.movie);
      }
    }

    for (const favorite of favorites) {
      if (favorite.movie) {
        likedById.set(favorite.movie.id, favorite.movie);
      }
    }

    return Array.from(likedById.values());
  }

  private buildColdStartRecommendations(
    candidates: Movie[],
    globalAverages: Map<string, number>,
    limit: number,
  ): Recommendation[] {
    return candidates
      .map((movie) => ({
        movie,
        reason: 'Una de las mejor valoradas por la comunidad',
        relevanceScore: globalAverages.get(movie.id) ?? 0,
        averageScore: globalAverages.get(movie.id) ?? null,
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private scoreCandidate(
    candidate: Movie,
    likedMovies: Movie[],
    globalAverage: number | null,
  ): { score: number; reason: string } {
    let affinityTotal = 0;
    let reason = 'Te puede interesar según tus preferencias';
    let bestReasonWeight = 0;

    for (const liked of likedMovies) {
      const affinity = this.getAffinitySignal(candidate, liked);

      if (affinity > 0) {
        affinityTotal += affinity;

        if (affinity > bestReasonWeight) {
          bestReasonWeight = affinity;
          reason = this.buildReason(candidate, liked, affinity);
        }
      }
    }

    const normalizedAffinity = affinityTotal / likedMovies.length;
    const normalizedGlobalQuality = (globalAverage ?? 0) / 5;
    const score =
      AFFINITY_WEIGHT * normalizedAffinity +
      GLOBAL_QUALITY_WEIGHT * normalizedGlobalQuality;

    if (bestReasonWeight === 0 && globalAverage !== null) {
      reason = 'Una de las mejor valoradas por la comunidad';
    }

    return { score, reason };
  }

  private getAffinitySignal(candidate: Movie, liked: Movie): number {
    if (
      candidate.director &&
      liked.director &&
      candidate.director === liked.director
    ) {
      return DIRECTOR_AFFINITY;
    }

    const candidateSaga = this.getSaga(candidate.episodeId);
    const likedSaga = this.getSaga(liked.episodeId);

    if (
      candidateSaga !== 'other' &&
      candidateSaga === likedSaga &&
      candidate.id !== liked.id
    ) {
      return SAGA_AFFINITY;
    }

    if (
      candidate.episodeId &&
      liked.episodeId &&
      Math.abs(candidate.episodeId - liked.episodeId) === 1
    ) {
      return ADJACENT_AFFINITY;
    }

    return 0;
  }

  private buildReason(
    candidate: Movie,
    liked: Movie,
    affinity: number,
  ): string {
    if (affinity === DIRECTOR_AFFINITY) {
      return `Te gustó "${liked.title}" y comparte director (${liked.director})`;
    }

    if (affinity === SAGA_AFFINITY) {
      return `Te gustó "${liked.title}" y pertenece a la misma saga`;
    }

    return `Es la continuación cercana de "${liked.title}" en la saga`;
  }

  private getSaga(episodeId?: number | null): 'prequel' | 'original' | 'other' {
    if (!episodeId) {
      return 'other';
    }

    if (episodeId >= 1 && episodeId <= 3) {
      return 'prequel';
    }

    if (episodeId >= 4 && episodeId <= 6) {
      return 'original';
    }

    return 'other';
  }
}
