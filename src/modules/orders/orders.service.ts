import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  QUEUE_NAMES,
  ORDER_JOB_NAMES,
} from 'src/modules/queues/constants/queue-names';
import {
  PaginationDto,
  PaginatedResult,
  paginate,
} from 'src/common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectQueue(QUEUE_NAMES.ORDER_PROCESSING)
    private readonly orderQueue: Queue,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId?: string): Promise<Order> {
    const order = this.orderRepository.create({
      ...createOrderDto,
      userId,
      status: OrderStatus.PENDING,
    });
    const saved = await this.orderRepository.save(order);

    // Queue background processing job – return 201 immediately
    await this.orderQueue.add(ORDER_JOB_NAMES.PROCESS_ORDER, {
      orderId: saved.id,
    });

    this.logger.log(`Order created id=${saved.id}, processing queued`);
    return saved;
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Order>> {
    const [data, total] = await this.orderRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return paginate(data, total, pagination);
  }

  async findOne(id: string): Promise<Order> {
    const cacheKey = this.cacheKey(id);
    const cached = await this.cache.get<Order>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for order ${id}`);
      return cached;
    }

    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    await this.cache.set(cacheKey, order, 60_000); // 60 s TTL
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, updateOrderDto);
    const updated = await this.orderRepository.save(order);

    // Invalidate cache after successful update
    await this.cache.del(this.cacheKey(id));
    this.logger.debug(`Cache invalidated for order ${id}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
    await this.cache.del(this.cacheKey(id));
    this.logger.debug(`Order ${id} deleted, cache invalidated`);
  }

  private cacheKey(id: string): string {
    return `order_${id}`;
  }
}
