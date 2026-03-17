import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUrlDto {
  @ApiProperty({ example: 'https://www.example.com/some/updated/url' })
  @IsNotEmpty()
  @IsUrl({}, { message: 'url must be a valid URL' })
  url: string;
}