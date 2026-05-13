import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES, EMAIL_JOB_NAMES } from '../constants/queue-names';

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  template?: string;
}

@Processor(QUEUE_NAMES.EMAIL, {
  concurrency: 5,
})
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<EmailJobData>): Promise<void> {
    this.logger.log(`Processing email job [${job.id}] name="${job.name}"`);

    switch (job.name) {
      case EMAIL_JOB_NAMES.SEND_EMAIL:
      case EMAIL_JOB_NAMES.SEND_WELCOME:
      case EMAIL_JOB_NAMES.SEND_NOTIFICATION:
        await this.sendEmail(job.data);
        break;
      default:
        this.logger.warn(`Unknown email job type: ${job.name}`);
    }
  }

  private async sendEmail(data: EmailJobData): Promise<void> {
    // Simulate random network delay (100ms – 600ms)
    const delay = 100 + Math.floor(Math.random() * 500);
    await new Promise((resolve) => setTimeout(resolve, delay));

    this.logger.log(
      `Email sent to=${data.to} subject="${data.subject}" (simulated ${delay}ms)`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Email job [${job.id}] completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(`Email job [${job.id}] failed: ${error.message}`);
  }
}
