import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMovieDto {
  @ApiProperty({ example: 'A New Hope' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @IsNumber()
  episodeId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  openingCrawl?: string;

  @ApiProperty({ example: 'George Lucas', required: false })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  producer?: string;

  @ApiProperty({ example: '1977-05-25', required: false })
  @IsOptional()
  @IsString()
  releaseDate?: string;
}
