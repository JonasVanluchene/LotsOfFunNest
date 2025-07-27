import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ 
    example: '604800', 
    description: 'Token expiration time in seconds' 
  })
  expiresIn: string;
}