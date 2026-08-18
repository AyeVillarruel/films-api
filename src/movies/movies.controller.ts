import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Role } from '../common/enums/role.enum';
import { RankingQueryDto } from '../ratings/dto/ranking-query.dto';
import { RatingsService } from '../ratings/ratings.service';
import { RecommendationsQueryDto } from '../recommendations/dto/recommendations-query.dto';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { User } from '../users/entities/user.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';
import { MoviesService } from './movies.service';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly ratingsService: RatingsService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener listado de películas' })
  @ApiResponse({ status: 200, description: 'Listado paginado de películas' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.moviesService.findAll(query.page, query.limit);
  }

  @Public()
  @Get('ranking')
  @ApiOperation({
    summary: 'Ranking de películas por puntuación promedio',
    description:
      'Solo incluye películas con al menos minVotes votos. Las películas sin puntuaciones quedan fuera del ranking.',
  })
  @ApiResponse({ status: 200, description: 'Ranking de películas' })
  getRanking(@Query() query: RankingQueryDto) {
    return this.ratingsService.getRanking(query.minVotes, query.limit);
  }

  @Get('recommendations')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Recomendaciones personalizadas según puntuaciones y favoritos',
  })
  @ApiResponse({ status: 200, description: 'Listado de recomendaciones' })
  getRecommendations(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query() query: RecommendationsQueryDto,
  ) {
    return this.recommendationsService.getForUser(user.id, query.limit);
  }

  @Post('sync')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sincronizar películas desde Star Wars API (solo administradores)',
  })
  @ApiResponse({ status: 201, description: 'Sincronización completada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  syncFromSwapi() {
    return this.moviesService.syncFromSwapi();
  }

  // Requisito del enunciado: el detalle solo lo ven usuarios regulares, no admins.
  @Get(':id')
  @Roles(Role.USER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener detalle de una película (solo usuarios regulares)',
  })
  @ApiResponse({ status: 200, description: 'Detalle de la película' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Película no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Movie> {
    return this.moviesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva película (solo administradores)' })
  @ApiResponse({ status: 201, description: 'Película creada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  create(@Body() createMovieDto: CreateMovieDto): Promise<Movie> {
    return this.moviesService.create(createMovieDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar una película existente (solo administradores)',
  })
  @ApiResponse({ status: 200, description: 'Película actualizada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Película no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ): Promise<Movie> {
    return this.moviesService.update(id, updateMovieDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una película (solo administradores)' })
  @ApiResponse({ status: 200, description: 'Película eliminada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Película no encontrada' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.moviesService.remove(id);
    return { message: 'Película eliminada exitosamente' };
  }
}
