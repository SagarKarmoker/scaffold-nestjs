import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { QUEUE_NAMES, ORDER_JOB_NAMES } from 'src/modules/queues/constants/queue-names';

export interface ProcessOrderJobData {
  orderId: string;
}

@Processor(QUEUE_NAMES.ORDER_PROCESSING, { concurrency: 3 })
export class OrderProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderProcessingProcessor.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {
    super();
  }

  async process(job: Job<ProcessOrderJobData>): Promise<void> {
    if (job.name === ORDER_JOB_NAMES.PROCESS_ORDER) {
      await this.processOrder(job.data.orderId);
    }
  }

  private async processOrder(orderId: string): Promise<void> {
    this.logger.log(`Starting order processing orderId=${orderId}`);

    await this.orderRepository.update(orderId, {
      status: OrderStatus.PROCESSING,
    });

    // Simulate heavy processing (e.g. inventory check, payment, fulfillment)
    const processingTime = 1000 + Math.floor(Math.random() * 4000);
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    await this.orderRepository.update(orderId, {
      status: OrderStatus.COMPLETED,
    });

    this.logger.log(
      `Order ${orderId} processed successfully (${processingTime}ms)`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Order job [${job.id}] completed`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ProcessOrderJobData>, error: Error): Promise<void> {
    this.logger.error(
      `Order job [${job.id}] failed: ${error.message}`,
      error.stack,
    );
    if (job.data?.orderId) {
      await this.orderRepository.update(job.data.orderId, {
        status: OrderStatus.FAILED,
      });
    }
  }
}
