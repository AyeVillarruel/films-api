import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from '../favorites/entities/favorite.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { RatingsModule } from '../ratings/ratings.module';
import { WatchlistItem } from '../watchlist/entities/watchlist-item.entity';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, Rating, Favorite, WatchlistItem]),
    RatingsModule,
  ],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
