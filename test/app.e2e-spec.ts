import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { validationPipeOptions } from '../src/common/config/validation-pipe.config';
import { SwapiFilm, SwapiService } from '../src/movies/swapi.service';

const mockSwapiFilms: SwapiFilm[] = [
  {
    title: 'A New Hope',
    episode_id: 4,
    opening_crawl: 'It is a period of civil war...',
    director: 'George Lucas',
    producer: 'Gary Kurtz',
    release_date: '1977-05-25',
    url: 'https://swapi.dev/api/films/1/',
  },
  {
    title: 'The Empire Strikes Back',
    episode_id: 5,
    opening_crawl: 'It is a dark time for the Rebellion...',
    director: 'Irvin Kershner',
    producer: 'Gary Kurtz, Rick McCallum',
    release_date: '1980-05-17',
    url: 'https://swapi.dev/api/films/2/',
  },
];

describe('Films API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let movieId: string;
  let secondMovieId: string;
  let thirdMovieId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SwapiService)
      .useValue({
        fetchAllFilms: jest.fn().mockResolvedValue(mockSwapiFilms),
        extractSwapiId: (url: string) => url.match(/\/(\d+)\/$/)?.[1] ?? url,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
    await app.init();

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin-e2e@test.com',
        password: 'admin123',
      })
      .expect(200);

    adminToken = adminLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('rechaza role en el registro público', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'hacker@test.com',
          password: 'password123',
          name: 'Hacker',
          role: 'admin',
        })
        .expect(400);
    });

    it('devuelve 401 en login con contraseña corta', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin-e2e@test.com',
          password: '123',
        })
        .expect(401);
    });

    it('registra un usuario regular', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'user-e2e@test.com',
          password: 'user1234',
          name: 'Usuario E2E',
        })
        .expect(201);

      expect(response.body.user.role).toBe('user');
      expect(response.body.accessToken).toBeDefined();
      userToken = response.body.accessToken;
    });

    it('inicia sesión con credenciales válidas', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'user-e2e@test.com',
          password: 'user1234',
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      userToken = response.body.accessToken;
    });
  });

  describe('Movies', () => {
    it('lista películas públicamente con paginación', async () => {
      const response = await request(app.getHttpServer()).get('/movies').expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeDefined();
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(20);
    });

    it('permite sincronizar películas al administrador', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies/sync')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(response.body.synced).toBe(2);
      expect(response.body.created).toBeGreaterThanOrEqual(1);
    });

    it('obtiene películas luego del sync', async () => {
      const response = await request(app.getHttpServer()).get('/movies').expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      movieId = response.body.data[0].id;
      secondMovieId = response.body.data[1].id;
    });

    it('permite ver detalle a un usuario regular', () => {
      return request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('deniega ver detalle al administrador por diseño del enunciado', () => {
      return request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('deniega crear películas a un usuario regular', () => {
      return request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Película no autorizada' })
        .expect(403);
    });
  });

  describe('Favoritos, watchlist y puntuaciones', () => {
    it('agrega y lista favoritos', async () => {
      await request(app.getHttpServer())
        .post(`/favorites/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].movie.id).toBe(movieId);
    });

    it('agrega películas a ver más tarde', async () => {
      await request(app.getHttpServer())
        .post(`/watchlist/${secondMovieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/watchlist')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('puntúa una película', async () => {
      const response = await request(app.getHttpServer())
        .post(`/movies/${movieId}/rating`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ score: 5 })
        .expect(201);

      expect(response.body.score).toBe(5);
    });

    it('expone estadísticas públicas de puntuación', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}/ratings`)
        .expect(200);

      expect(response.body.ratingsCount).toBe(1);
      expect(response.body.averageScore).toBe(5);
    });

    it('muestra ranking público', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/ranking')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Recomendaciones', () => {
    it('crea una película adicional para recomendar', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Return of the Jedi',
          episodeId: 6,
          director: 'Richard Marquand',
        })
        .expect(201);

      thirdMovieId = response.body.id;
    });

    it('devuelve recomendaciones personalizadas', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/recommendations?limit=3')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const recommendations = response.body as Array<{
        movie: { id: string };
        reason: string;
      }>;

      expect(recommendations.length).toBeGreaterThanOrEqual(1);
      expect(recommendations.every((item) => item.movie && item.reason)).toBe(
        true,
      );
      expect(
        recommendations.every(
          (item) =>
            item.movie.id !== movieId && item.movie.id !== secondMovieId,
        ),
      ).toBe(true);
    });

    it('requiere autenticación', () => {
      return request(app.getHttpServer())
        .get('/movies/recommendations')
        .expect(401);
    });
  });
});
