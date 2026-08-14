import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class RankingQueryDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description: 'Mínimo de votos para aparecer en el ranking',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minVotes?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    minimum: 1,
    description: 'Cantidad máxima de películas en el ranking',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
