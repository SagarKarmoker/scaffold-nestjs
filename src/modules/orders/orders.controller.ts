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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
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
  @ApiCreatedResponse({ description: 'Order accepted and queued for processing' })
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.create(createOrderDto, user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all orders (paginated)' })
  @ApiOkResponse({ description: 'Paginated list of orders' })
  @Throttle({ default: { limit: 200, ttl: 60_000 } }) // relaxed limit for lists
  findAll(@Query() pagination: PaginationDto) {
    return this.ordersService.findAll(pagination);
  }

  /**
   * Fetches a single order.  Response is cached for 60 s.
   * The cache is automatically populated on first fetch and
   * invalidated whenever the order is updated or deleted.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (cached 60 s)' })
  @ApiOkResponse({ description: 'Order details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  /**
   * Update order fields.  Cache entry for this order is invalidated.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update order (invalidates cache)' })
  @ApiOkResponse({ description: 'Updated order' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete order (invalidates cache)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.remove(id);
  }
}
