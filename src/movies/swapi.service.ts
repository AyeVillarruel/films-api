import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom, retry, timer } from 'rxjs';

export interface SwapiFilm {
  title: string;
  episode_id: number;
  opening_crawl: string;
  director: string;
  producer: string;
  release_date: string;
  url: string;
}

export interface SwapiFilmsResponse {
  count: number;
  next: string | null;
  results: SwapiFilm[];
}

@Injectable()
export class SwapiService {
  private readonly logger = new Logger(SwapiService.name);
  private readonly baseUrl = 'https://swapi.dev/api';
  private readonly maxPages = 10;

  constructor(private readonly httpService: HttpService) {}

  async fetchAllFilms(): Promise<SwapiFilm[]> {
    const films: SwapiFilm[] = [];
    let nextUrl: string | null = `${this.baseUrl}/films/`;
    let pagesFetched = 0;

    while (nextUrl && pagesFetched < this.maxPages) {
      try {
        const response: { data: SwapiFilmsResponse } = await firstValueFrom(
          this.httpService.get<SwapiFilmsResponse>(nextUrl).pipe(
            retry({
              count: 2,
              delay: (_error, retryCount) => timer(retryCount * 1000),
            }),
          ),
        );

        films.push(...response.data.results);
        nextUrl = response.data.next;
        pagesFetched++;
      } catch (error) {
        throw this.mapSwapiError(error);
      }
    }

    return films;
  }

  extractSwapiId(url: string): string {
    const match = url.match(/\/(\d+)\/$/);
    return match ? match[1] : url;
  }

  private mapSwapiError(error: unknown): Error {
    this.logger.error('Error al obtener películas de SWAPI', error);

    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const isTimeout =
        error.code === 'ECONNABORTED' || error.message.includes('timeout');
      const isUpstreamFailure =
        isTimeout || (status !== undefined && status >= 500);

      if (isUpstreamFailure) {
        return new ServiceUnavailableException(
          'No se pudo conectar con la Star Wars API. Intentá nuevamente más tarde.',
        );
      }
    }

    return new InternalServerErrorException(
      'No se pudo procesar la respuesta de la Star Wars API.',
    );
  }
}
