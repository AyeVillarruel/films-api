import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { MoviesService } from '../movies/movies.service';
import { WatchlistItem } from './entities/watchlist-item.entity';
import { WatchlistService } from './watchlist.service';

describe('WatchlistService', () => {
  let service: WatchlistService;

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

  const mockItem: WatchlistItem = {
    id: 'watchlist-uuid-1',
    userId: 'user-uuid-1',
    movieId: mockMovie.id,
    user: {} as WatchlistItem['user'],
    movie: mockMovie,
    createdAt: new Date('2026-01-01'),
  };

  const mockRepository = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockMoviesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: getRepositoryToken(WatchlistItem),
          useValue: mockRepository,
        },
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
    jest.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('debería retornar la lista de ver más tarde', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockItem], 1]);

      const result = await service.findAllByUser('user-uuid-1');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].movie).toEqual(mockMovie);
    });
  });

  describe('add', () => {
    it('debería agregar una película a ver más tarde', async () => {
      mockMoviesService.findOne.mockResolvedValue(mockMovie);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockItem);
      mockRepository.save.mockResolvedValue(mockItem);

      const result = await service.add('user-uuid-1', mockMovie.id);

      expect(result.movie).toEqual(mockMovie);
    });

    it('debería lanzar ConflictException si ya está en la lista', async () => {
      mockMoviesService.findOne.mockResolvedValue(mockMovie);
      mockRepository.findOne.mockResolvedValue(mockItem);

      await expect(service.add('user-uuid-1', mockMovie.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('debería quitar una película de ver más tarde', async () => {
      mockRepository.findOne.mockResolvedValue(mockItem);
      mockRepository.remove.mockResolvedValue(mockItem);

      await service.remove('user-uuid-1', mockMovie.id);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockItem);
    });

    it('debería lanzar NotFoundException si no está en la lista', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('user-uuid-1', mockMovie.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
