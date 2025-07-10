import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({ example: 'Bibliotheek' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Kerkstraat' })
  @IsString()
  street: string;

  @ApiProperty({ example: '5' })
  @IsString()
  number: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  unitNumber?: string;

  @ApiProperty({ example: '8500' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 'Kortrijk' })
  @IsString()
  city: string;
}

