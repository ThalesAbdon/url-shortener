import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dtos/create-url.dto';
import { UpdateUrlDto } from './dtos/update-url.dto';

@ApiTags('URLs')
@Controller()
export class UrlsController {
  private readonly logger = new Logger(UrlsController.name);

  constructor(private readonly urlsService: UrlsService) {}

  @Post('shorten')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new short URL' })
  @ApiResponse({ status: 201, description: 'Short URL created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() createUrlDto: CreateUrlDto) {
    this.logger.log(`Create request for: ${createUrlDto.url}`);
    return this.urlsService.create(createUrlDto);
  }

  @Get('shorten/:shortCode')
  @ApiOperation({ summary: 'Retrieve original URL from short code' })
  @ApiParam({ name: 'shortCode', example: 'abc123' })
  @ApiResponse({ status: 200, description: 'URL found' })
  @ApiResponse({ status: 404, description: 'Short URL not found' })
  findOne(@Param('shortCode') shortCode: string) {
    this.logger.log(`Retrieve request for: ${shortCode}`);
    return this.urlsService.findByShortCode(shortCode);
  }

  @Put('shorten/:shortCode')
  @ApiOperation({ summary: 'Update an existing short URL' })
  @ApiParam({ name: 'shortCode', example: 'abc123' })
  @ApiResponse({ status: 200, description: 'URL updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Short URL not found' })
  update(
    @Param('shortCode') shortCode: string,
    @Body() updateUrlDto: UpdateUrlDto,
  ) {
    this.logger.log(`Update request for: ${shortCode}`);
    return this.urlsService.update(shortCode, updateUrlDto);
  }

  @Delete('shorten/:shortCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a short URL' })
  @ApiParam({ name: 'shortCode', example: 'abc123' })
  @ApiResponse({ status: 204, description: 'URL deleted successfully' })
  @ApiResponse({ status: 404, description: 'Short URL not found' })
  remove(@Param('shortCode') shortCode: string) {
    this.logger.log(`Delete request for: ${shortCode}`);
    return this.urlsService.remove(shortCode);
  }

  @Get('shorten/:shortCode/stats')
  @ApiOperation({ summary: 'Get statistics for a short URL' })
  @ApiParam({ name: 'shortCode', example: 'abc123' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Short URL not found' })
  getStats(@Param('shortCode') shortCode: string) {
    this.logger.log(`Stats request for: ${shortCode}`);
    return this.urlsService.getStats(shortCode);
  }
}