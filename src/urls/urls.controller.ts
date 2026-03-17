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
  ApiBody,
} from '@nestjs/swagger';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dtos/create-url.dto';
import { UpdateUrlDto } from './dtos/update-url.dto';
import { Url } from './entities/url.entity';

@ApiTags('URLs')
@Controller()
export class UrlsController {
  private readonly logger = new Logger(UrlsController.name);
  /* c8 ignore next */
  constructor(private readonly urlsService: UrlsService) {}

  @Post('shorten')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new short URL' })
  @ApiBody({ type: CreateUrlDto })
  @ApiResponse({
    status: 201,
    description: 'Short URL created successfully',
    type: Url,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: ['url must be a valid URL'],
        error: 'Bad Request',
      },
    },
  })
  /* c8 ignore next */
  create(@Body() createUrlDto: CreateUrlDto) {
    this.logger.log(`Create request for: ${createUrlDto.url}`);
    return this.urlsService.create(createUrlDto);
  }

  @Get('shorten/:shortCode')
  @ApiOperation({ summary: 'Retrieve original URL from short code' })
  @ApiParam({ name: 'shortCode', example: 'abc123', description: 'The short code of the URL' })
  @ApiResponse({
    status: 200,
    description: 'URL found',
    type: Url,
  })
  @ApiResponse({
    status: 404,
    description: 'Short URL not found',
    schema: {
      example: {
        statusCode: 404,
        message: "Short URL 'abc123' not found",
        error: 'Not Found',
      },
    },
  })
  findOne(@Param('shortCode') shortCode: string) {
    this.logger.log(`Retrieve request for: ${shortCode}`);
    return this.urlsService.findByShortCode(shortCode);
  }

  @Put('shorten/:shortCode')
  @ApiOperation({ summary: 'Update an existing short URL' })
  @ApiParam({ name: 'shortCode', example: 'abc123', description: 'The short code of the URL' })
  @ApiBody({ type: UpdateUrlDto })
  @ApiResponse({
    status: 200,
    description: 'URL updated successfully',
    type: Url,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: ['url must be a valid URL'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Short URL not found',
    schema: {
      example: {
        statusCode: 404,
        message: "Short URL 'abc123' not found",
        error: 'Not Found',
      },
    },
  })
  update(
    @Param('shortCode') shortCode: string,
    /* c8 ignore next */
    @Body() updateUrlDto: UpdateUrlDto,
  ) {
    this.logger.log(`Update request for: ${shortCode}`);
    return this.urlsService.update(shortCode, updateUrlDto);
  }

  @Delete('shorten/:shortCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a short URL' })
  @ApiParam({ name: 'shortCode', example: 'abc123', description: 'The short code of the URL' })
  @ApiResponse({ status: 204, description: 'URL deleted successfully' })
  @ApiResponse({
    status: 404,
    description: 'Short URL not found',
    schema: {
      example: {
        statusCode: 404,
        message: "Short URL 'abc123' not found",
        error: 'Not Found',
      },
    },
  })
  remove(@Param('shortCode') shortCode: string) {
    this.logger.log(`Delete request for: ${shortCode}`);
    return this.urlsService.remove(shortCode);
  }

  @Get('shorten/:shortCode/stats')
  @ApiOperation({ summary: 'Get statistics for a short URL' })
  @ApiParam({ name: 'shortCode', example: 'abc123', description: 'The short code of the URL' })
  @ApiResponse({
    status: 200,
    description: 'Stats retrieved successfully',
    type: Url,
  })
  @ApiResponse({
    status: 404,
    description: 'Short URL not found',
    schema: {
      example: {
        statusCode: 404,
        message: "Short URL 'abc123' not found",
        error: 'Not Found',
      },
    },
  })
  getStats(@Param('shortCode') shortCode: string) {
    this.logger.log(`Stats request for: ${shortCode}`);
    return this.urlsService.getStats(shortCode);
  }
}