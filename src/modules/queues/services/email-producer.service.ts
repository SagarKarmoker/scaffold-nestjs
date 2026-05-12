import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, EMAIL_JOB_NAMES } from '../constants/queue-names';
import { EmailJobData } from '../processors/email.processor';

@Injectable()
export class EmailProducerService {
  private readonly logger = new Logger(EmailProducerService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
  ) {}

  async sendEmail(data: EmailJobData): Promise<string> {
    const job = await this.emailQueue.add(EMAIL_JOB_NAMES.SEND_EMAIL, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 1000, age: 3600 },
      removeOnFail: { count: 5000, age: 86400 },
    });
    this.logger.log(`Email job queued id=${job.id} to=${data.to}`);
    return job.id!;
  }

  async sendWelcomeEmail(to: string, name: string): Promise<string> {
    const job = await this.emailQueue.add(
      EMAIL_JOB_NAMES.SEND_WELCOME,
      {
        to,
        subject: 'Welcome aboard!',
        body: `Hi ${name}, welcome to our platform!`,
        template: 'welcome',
      } satisfies EmailJobData,
      { attempts: 3 },
    );
    return job.id!;
  }

  async sendNotification(to: string, message: string): Promise<string> {
    const job = await this.emailQueue.add(
      EMAIL_JOB_NAMES.SEND_NOTIFICATION,
      {
        to,
        subject: 'Notification',
        body: message,
      } satisfies EmailJobData,
      { attempts: 2, priority: 10 },
    );
    return job.id!;
  }

  async getQueueMetrics() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }
}
