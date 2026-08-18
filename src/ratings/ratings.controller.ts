import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { RateMovieDto } from './dto/rate-movie.dto';
import { RatingsService } from './ratings.service';

@ApiTags('Ratings')
@Controller('movies')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Public()
  @Get(':id/ratings')
  @ApiOperation({
    summary: 'Obtener promedio y cantidad de puntuaciones de una película',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas de puntuación' })
  @ApiResponse({ status: 404, description: 'Película no encontrada' })
  getMovieStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.ratingsService.getMovieStats(id);
  }

  @Get(':id/rating')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mi puntuación de una película' })
  @ApiResponse({
    status: 200,
    description: 'Puntuación del usuario autenticado',
  })
  @ApiResponse({ status: 404, description: 'Película no encontrada' })
  getMyRating(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ratingsService.getMyRating(user.id, id);
  }

  @Post(':id/rating')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Puntuar una película (crear o actualizar)' })
  @ApiResponse({ status: 201, description: 'Puntuación registrada' })
  @ApiResponse({ status: 404, description: 'Película no encontrada' })
  rate(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rateMovieDto: RateMovieDto,
  ) {
    return this.ratingsService.rate(user.id, id, rateMovieDto);
  }

  @Delete(':id/rating')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar mi puntuación de una película' })
  @ApiResponse({ status: 200, description: 'Puntuación eliminada' })
  @ApiResponse({ status: 404, description: 'No has puntuado esta película' })
  async remove(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.ratingsService.remove(user.id, id);
    return { message: 'Puntuación eliminada exitosamente' };
  }
}
