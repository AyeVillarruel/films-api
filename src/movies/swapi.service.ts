import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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
  results: SwapiFilm[];
}

@Injectable()
export class SwapiService {
  private readonly logger = new Logger(SwapiService.name);
  private readonly baseUrl = 'https://swapi.dev/api';

  constructor(private readonly httpService: HttpService) {}

  async fetchAllFilms(): Promise<SwapiFilm[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<SwapiFilmsResponse>(`${this.baseUrl}/films/`),
      );
      return response.data.results;
    } catch (error) {
      this.logger.error('Error al obtener películas de SWAPI', error);
      throw new InternalServerErrorException(
        'No se pudo conectar con la Star Wars API. Intentá nuevamente más tarde.',
      );
    }
  }

  extractSwapiId(url: string): string {
    const match = url.match(/\/(\d+)\/$/);
    return match ? match[1] : url;
  }
}
