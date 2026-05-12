import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderProcessingProcessor } from './processors/order-processing.processor';
import { QUEUE_NAMES } from 'src/modules/queues/constants/queue-names';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    BullModule.registerQueue({
      name: QUEUE_NAMES.ORDER_PROCESSING,
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderProcessingProcessor],
  exports: [OrdersService],
})
export class OrdersModule {}
