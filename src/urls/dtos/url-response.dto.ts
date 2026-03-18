import { ApiProperty } from '@nestjs/swagger';

export class UrlResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'https://www.example.com/some/long/url' })
  url: string;

  @ApiProperty({ example: 'abc123' })
  shortCode: string;

  @ApiProperty({ example: 0 })
  accessCount: number;

  @ApiProperty({ example: '2021-09-01T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2021-09-01T12:00:00Z' })
  updatedAt: Date;
}