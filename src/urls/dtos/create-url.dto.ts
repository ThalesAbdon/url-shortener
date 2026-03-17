import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUrlDto {
  @ApiProperty({ example: 'https://www.example.com/some/long/url' })
  @IsNotEmpty()
  @IsUrl({}, { message: 'url must be a valid URL' })
  url: string;
}
