import {
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
import { User } from '../users/entities/user.entity';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar películas favoritas del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Listado de favoritos' })
  findAll(@CurrentUser() user: Omit<User, 'password'>) {
    return this.favoritesService.findAllByUser(user.id);
  }

  @Post(':movieId')
  @ApiOperation({ summary: 'Agregar una película a favoritos' })
  @ApiResponse({ status: 201, description: 'Película agregada a favoritos' })
  @ApiResponse({ status: 404, description: 'Película no encontrada' })
  @ApiResponse({ status: 409, description: 'La película ya está en favoritos' })
  add(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('movieId', ParseUUIDPipe) movieId: string,
  ) {
    return this.favoritesService.add(user.id, movieId);
  }

  @Delete(':movieId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar una película de favoritos' })
  @ApiResponse({ status: 200, description: 'Película eliminada de favoritos' })
  @ApiResponse({ status: 404, description: 'La película no está en favoritos' })
  async remove(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('movieId', ParseUUIDPipe) movieId: string,
  ) {
    await this.favoritesService.remove(user.id, movieId);
    return { message: 'Película eliminada de favoritos' };
  }
}
