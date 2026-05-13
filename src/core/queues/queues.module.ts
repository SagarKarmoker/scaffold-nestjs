import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { QUEUE_NAMES } from './constants/queue-names';
import { EmailProcessor } from './processors/email.processor';
import { EmailProducerService } from './services/email-producer.service';

const enableBullBoard = process.env.ENABLE_BULL_BOARD === 'true' ||
  process.env.ENVIRONMENT !== 'production';

function getBullBoardFeature(): any[] {
  if (!enableBullBoard) return [];
  return [
    BullBoardModule.forFeature(
      { name: QUEUE_NAMES.EMAIL, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.ORDER_PROCESSING, adapter: BullMQAdapter },
    ),
  ];
}

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.EMAIL,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { age: 3600, count: 1000 },
          removeOnFail: { age: 86400, count: 5000 },
        },
      },
      {
        name: QUEUE_NAMES.ORDER_PROCESSING,
        defaultJobOptions: {
          attempts: 2,
          backoff: { type: 'fixed', delay: 5000 },
          removeOnComplete: { age: 7200, count: 500 },
          removeOnFail: { age: 172800, count: 1000 },
        },
      },
    ),
    ...getBullBoardFeature(),
  ],
  providers: [EmailProcessor, EmailProducerService],
  exports: [EmailProducerService, BullModule],
})
export class QueuesModule {}
