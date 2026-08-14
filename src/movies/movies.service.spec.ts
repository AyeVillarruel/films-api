import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { Movie } from './entities/movie.entity';
import { MoviesService } from './movies.service';
import { SwapiService } from './swapi.service';

describe('MoviesService', () => {
  let service: MoviesService;

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

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockSwapiService = {
    fetchAllFilms: jest.fn(),
    extractSwapiId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: getRepositoryToken(Movie), useValue: mockRepository },
        { provide: SwapiService, useValue: mockSwapiService },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debería retornar un listado de películas', async () => {
      mockRepository.find.mockResolvedValue([mockMovie]);

      const result = await service.findAll();

      expect(result).toEqual([mockMovie]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { episodeId: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('debería retornar una película por id', async () => {
      mockRepository.findOne.mockResolvedValue(mockMovie);

      const result = await service.findOne('movie-uuid-1');

      expect(result).toEqual(mockMovie);
    });

    it('debería lanzar NotFoundException si la película no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('debería crear una nueva película', async () => {
      const createDto: CreateMovieDto = {
        title: 'A New Hope',
        director: 'George Lucas',
      };

      mockRepository.create.mockReturnValue(mockMovie);
      mockRepository.save.mockResolvedValue(mockMovie);

      const result = await service.create(createDto);

      expect(result).toEqual(mockMovie);
    });
  });

  describe('update', () => {
    it('debería actualizar una película existente', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockMovie });
      mockRepository.save.mockResolvedValue({
        ...mockMovie,
        title: 'Updated Title',
      });

      const result = await service.update('movie-uuid-1', {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('remove', () => {
    it('debería eliminar una película', async () => {
      mockRepository.findOne.mockResolvedValue(mockMovie);
      mockRepository.remove.mockResolvedValue(mockMovie);

      await service.remove('movie-uuid-1');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockMovie);
    });
  });

  describe('syncFromSwapi', () => {
    it('debería sincronizar películas desde SWAPI', async () => {
      const swapiFilms = [
        {
          title: 'A New Hope',
          episode_id: 4,
          opening_crawl: 'It is a period...',
          director: 'George Lucas',
          producer: 'Gary Kurtz',
          release_date: '1977-05-25',
          url: 'https://swapi.dev/api/films/1/',
        },
      ];

      mockSwapiService.fetchAllFilms.mockResolvedValue(swapiFilms);
      mockSwapiService.extractSwapiId.mockReturnValue('1');
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockMovie);
      mockRepository.save.mockResolvedValue(mockMovie);

      const result = await service.syncFromSwapi();

      expect(result.synced).toBe(1);
      expect(result.created).toBe(1);
      expect(result.updated).toBe(0);
    });
  });
});
