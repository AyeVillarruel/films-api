import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class RecommendationsQueryDto {
  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    description: 'Cantidad máxima de recomendaciones',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 5;
}
