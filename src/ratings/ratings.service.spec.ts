import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { RateMovieDto } from './dto/rate-movie.dto';
import { Rating } from './entities/rating.entity';
import { RatingsService } from './ratings.service';

describe('RatingsService', () => {
  let service: RatingsService;

  const mockMovie: Movie = {
    id: 'movie-uuid-1',
    title: 'A New Hope',
    episodeId: 4,
    openingCrawl: 'It is a period of civil war...',
    director: 'George Lucas',
    producer: 'Gary Kurtz',
    releaseDate: '1977-05-25',
    swapiId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRating: Rating = {
    id: 'rating-uuid-1',
    userId: 'user-uuid-1',
    movieId: mockMovie.id,
    score: 5,
    user: {} as Rating['user'],
    movie: mockMovie,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockRatingsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockMoviesRepository = {
    findOne: jest.fn(),
    findBy: jest.fn(),
  };

  const createQueryBuilderMock = () => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: getRepositoryToken(Rating),
          useValue: mockRatingsRepository,
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMoviesRepository,
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    jest.clearAllMocks();
  });

  describe('rate', () => {
    const rateMovieDto: RateMovieDto = { score: 5 };

    it('debería crear una puntuación nueva', async () => {
      mockMoviesRepository.findOne.mockResolvedValue(mockMovie);
      mockRatingsRepository.findOne.mockResolvedValue(null);
      mockRatingsRepository.create.mockReturnValue(mockRating);
      mockRatingsRepository.save.mockResolvedValue(mockRating);

      const result = await service.rate(
        'user-uuid-1',
        mockMovie.id,
        rateMovieDto,
      );

      expect(result.score).toBe(5);
      expect(mockRatingsRepository.create).toHaveBeenCalled();
    });

    it('debería actualizar una puntuación existente', async () => {
      mockMoviesRepository.findOne.mockResolvedValue(mockMovie);
      mockRatingsRepository.findOne.mockResolvedValue({
        ...mockRating,
        score: 3,
      });
      mockRatingsRepository.save.mockResolvedValue({ ...mockRating, score: 5 });

      const result = await service.rate(
        'user-uuid-1',
        mockMovie.id,
        rateMovieDto,
      );

      expect(result.score).toBe(5);
      expect(mockRatingsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getMovieStats', () => {
    it('debería retornar estadísticas de la película', async () => {
      mockMoviesRepository.findOne.mockResolvedValue(mockMovie);
      const qb = createQueryBuilderMock();
      qb.getRawOne.mockResolvedValue({
        averageScore: '4.5',
        ratingsCount: '2',
      });
      mockRatingsRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMovieStats(mockMovie.id);

      expect(result).toEqual({
        averageScore: 4.5,
        ratingsCount: 2,
      });
    });
  });

  describe('getRanking', () => {
    it('debería retornar el ranking de películas', async () => {
      const qb = createQueryBuilderMock();
      qb.getRawMany.mockResolvedValue([
        {
          movieId: mockMovie.id,
          averageScore: '4.8',
          ratingsCount: '10',
        },
      ]);
      mockRatingsRepository.createQueryBuilder.mockReturnValue(qb);
      mockMoviesRepository.findBy.mockResolvedValue([mockMovie]);

      const result = await service.getRanking(1, 5);

      expect(result).toHaveLength(1);
      expect(result[0].movie).toEqual(mockMovie);
      expect(result[0].averageScore).toBe(4.8);
      expect(result[0].ratingsCount).toBe(10);
    });
  });

  describe('remove', () => {
    it('debería lanzar NotFoundException si no hay puntuación', async () => {
      mockRatingsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('user-uuid-1', mockMovie.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
