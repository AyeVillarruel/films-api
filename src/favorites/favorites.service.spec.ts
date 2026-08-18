import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { MoviesService } from '../movies/movies.service';
import { Favorite } from './entities/favorite.entity';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

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

  const mockFavorite: Favorite = {
    id: 'favorite-uuid-1',
    userId: 'user-uuid-1',
    movieId: mockMovie.id,
    user: {} as Favorite['user'],
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
        FavoritesService,
        {
          provide: getRepositoryToken(Favorite),
          useValue: mockRepository,
        },
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    jest.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('debería retornar los favoritos del usuario', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockFavorite], 1]);

      const result = await service.findAllByUser('user-uuid-1');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].movie).toEqual(mockMovie);
      expect(result.data[0].favoritedAt).toEqual(mockFavorite.createdAt);
      expect(result.total).toBe(1);
    });
  });

  describe('add', () => {
    it('debería agregar una película a favoritos', async () => {
      mockMoviesService.findOne.mockResolvedValue(mockMovie);
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockFavorite);
      mockRepository.save.mockResolvedValue(mockFavorite);

      const result = await service.add('user-uuid-1', mockMovie.id);

      expect(result.movie).toEqual(mockMovie);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar ConflictException si ya está en favoritos', async () => {
      mockMoviesService.findOne.mockResolvedValue(mockMovie);
      mockRepository.findOne.mockResolvedValue(mockFavorite);

      await expect(service.add('user-uuid-1', mockMovie.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('debería quitar una película de favoritos', async () => {
      mockRepository.findOne.mockResolvedValue(mockFavorite);
      mockRepository.remove.mockResolvedValue(mockFavorite);

      await service.remove('user-uuid-1', mockMovie.id);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockFavorite);
    });

    it('debería lanzar NotFoundException si no está en favoritos', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('user-uuid-1', mockMovie.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
