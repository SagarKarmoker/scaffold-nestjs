import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { User } from 'src/modules/users/entities/user.entity';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create a new order.  The heavy processing is queued in the background –
   * the endpoint returns 201 immediately without waiting for fulfilment.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create order (async processing, returns 201)' })
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedResponse({ description: 'Order accepted and queued for processing' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: User) {
    return this.ordersService.create(createOrderDto, user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all orders (paginated)' })
  @ApiOkResponse({ description: 'Paginated list of orders' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page (default: 10)' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @Throttle({ default: { limit: 200, ttl: 60_000 } })
  findAll(@Query() pagination: PaginationDto, @CurrentUser() user: User) {
    return this.ordersService.findAll(pagination, user?.id);
  }

  /**
   * Fetches a single order.  Response is cached for 60 s.
   * The cache is automatically populated on first fetch and
   * invalidated whenever the order is updated or deleted.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (cached 60 s)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse({ description: 'Order details' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.findOne(id, user?.id);
  }

  /**
   * Update order fields.  Cache entry for this order is invalidated.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update order (invalidates cache)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiBody({ type: () => UpdateOrderDto })
  @ApiOkResponse({ description: 'Updated order' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.update(id, updateOrderDto, user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete order (invalidates cache)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiNoContentResponse({ description: 'Order deleted' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.remove(id, user?.id);
  }
}
