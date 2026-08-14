import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { User } from '../users/entities/user.entity';
import { WatchlistService } from './watchlist.service';

@ApiTags('Watchlist')
@ApiBearerAuth()
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: 'Listar películas para ver más tarde' })
  @ApiResponse({ status: 200, description: 'Listado paginado de ver más tarde' })
  findAll(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query() query: PaginationQueryDto,
  ) {
    return this.watchlistService.findAllByUser(user.id, query.page, query.limit);
  }

  @Post(':movieId')
  @ApiOperation({ summary: 'Agregar una película a ver más tarde' })
  @ApiResponse({ status: 201, description: 'Película agregada a ver más tarde' })
  @ApiResponse({ status: 404, description: 'Película no encontrada' })
  @ApiResponse({ status: 409, description: 'La película ya está en ver más tarde' })
  add(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('movieId', ParseUUIDPipe) movieId: string,
  ) {
    return this.watchlistService.add(user.id, movieId);
  }

  @Delete(':movieId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar una película de ver más tarde' })
  @ApiResponse({ status: 200, description: 'Película eliminada de ver más tarde' })
  @ApiResponse({ status: 404, description: 'La película no está en ver más tarde' })
  async remove(
    @CurrentUser() user: Omit<User, 'password'>,
    @Param('movieId', ParseUUIDPipe) movieId: string,
  ) {
    await this.watchlistService.remove(user.id, movieId);
    return { message: 'Película eliminada de ver más tarde' };
  }
}
