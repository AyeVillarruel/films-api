import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Favorite } from '../favorites/entities/favorite.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import { WatchlistItem } from '../watchlist/entities/watchlist-item.entity';
import { RecommendationsService } from './recommendations.service';

describe('RecommendationsService', () => {
  let service: RecommendationsService;

  const originalTrilogy: Movie[] = [
    {
      id: 'movie-4',
      title: 'A New Hope',
      episodeId: 4,
      openingCrawl: 'It is a period of civil war...',
      director: 'George Lucas',
      producer: 'Gary Kurtz',
      releaseDate: '1977-05-25',
      swapiId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'movie-5',
      title: 'The Empire Strikes Back',
      episodeId: 5,
      openingCrawl: 'The Empire strikes back...',
      director: 'Irvin Kershner',
      producer: 'Gary Kurtz',
      releaseDate: '1980-05-17',
      swapiId: '2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'movie-6',
      title: 'Return of the Jedi',
      episodeId: 6,
      openingCrawl: 'Return of the Jedi...',
      director: 'Richard Marquand',
      producer: 'Howard Kazanjian',
      releaseDate: '1983-05-25',
      swapiId: '3',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockMoviesRepository = {
    find: jest.fn(),
  };

  const mockRatingsRepository = {
    find: jest.fn(),
  };

  const mockFavoritesRepository = {
    find: jest.fn(),
  };

  const mockWatchlistRepository = {
    find: jest.fn(),
  };

  const mockRatingsService = {
    getRanking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMoviesRepository,
        },
        {
          provide: getRepositoryToken(Rating),
          useValue: mockRatingsRepository,
        },
        {
          provide: getRepositoryToken(Favorite),
          useValue: mockFavoritesRepository,
        },
        {
          provide: getRepositoryToken(WatchlistItem),
          useValue: mockWatchlistRepository,
        },
        {
          provide: RatingsService,
          useValue: mockRatingsService,
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    jest.clearAllMocks();
  });

  it('debería recomendar películas similares según puntuaciones altas', async () => {
    mockMoviesRepository.find.mockResolvedValue(originalTrilogy);
    mockRatingsRepository.find.mockResolvedValue([
      {
        movieId: 'movie-4',
        score: 5,
        movie: originalTrilogy[0],
      },
    ]);
    mockFavoritesRepository.find.mockResolvedValue([]);
    mockWatchlistRepository.find.mockResolvedValue([]);
    mockRatingsService.getRanking.mockResolvedValue([
      {
        movie: originalTrilogy[1],
        averageScore: 4.9,
        ratingsCount: 10,
      },
      {
        movie: originalTrilogy[2],
        averageScore: 4.7,
        ratingsCount: 8,
      },
    ]);

    const result = await service.getForUser('user-uuid-1', 2);

    expect(result).toHaveLength(2);
    expect(result.every((item) => item.movie.id !== 'movie-4')).toBe(true);
    expect(result[0].reason).toContain('A New Hope');
  });

  it('debería usar ranking global si el usuario no tiene preferencias', async () => {
    mockMoviesRepository.find.mockResolvedValue(originalTrilogy);
    mockRatingsRepository.find.mockResolvedValue([]);
    mockFavoritesRepository.find.mockResolvedValue([]);
    mockWatchlistRepository.find.mockResolvedValue([]);
    mockRatingsService.getRanking.mockResolvedValue([
      {
        movie: originalTrilogy[1],
        averageScore: 4.9,
        ratingsCount: 10,
      },
      {
        movie: originalTrilogy[0],
        averageScore: 4.8,
        ratingsCount: 12,
      },
      {
        movie: originalTrilogy[2],
        averageScore: 4.7,
        ratingsCount: 8,
      },
    ]);

    const result = await service.getForUser('user-uuid-1', 2);

    expect(result).toHaveLength(2);
    expect(result[0].movie.id).toBe('movie-5');
    expect(result[0].reason).toBe(
      'Una de las mejor valoradas por la comunidad',
    );
  });

  it('debería excluir películas en ver más tarde', async () => {
    mockMoviesRepository.find.mockResolvedValue(originalTrilogy);
    mockRatingsRepository.find.mockResolvedValue([]);
    mockFavoritesRepository.find.mockResolvedValue([]);
    mockWatchlistRepository.find.mockResolvedValue([
      { movieId: 'movie-5' },
      { movieId: 'movie-6' },
    ]);
    mockRatingsService.getRanking.mockResolvedValue([
      {
        movie: originalTrilogy[1],
        averageScore: 4.9,
        ratingsCount: 10,
      },
    ]);

    const result = await service.getForUser('user-uuid-1', 5);

    expect(result).toHaveLength(1);
    expect(result[0].movie.id).toBe('movie-4');
  });
});
