import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsModule } from '../ratings/ratings.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { Movie } from './entities/movie.entity';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { SwapiService } from './swapi.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie]),
    HttpModule,
    RatingsModule,
    RecommendationsModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService, SwapiService],
  exports: [MoviesService],
})
export class MoviesModule {}
