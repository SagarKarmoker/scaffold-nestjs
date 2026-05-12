import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotifyDto } from '../dto/notify.dto';
import { EmailProducerService } from '../services/email-producer.service';

@ApiTags('notifications')
@Controller('notify')
export class NotifyController {
  constructor(private readonly emailProducer: EmailProducerService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue an email notification (async, 202)' })
  @ApiResponse({
    status: 202,
    description: 'Email job accepted and queued for processing',
  })
  async notify(@Body() dto: NotifyDto) {
    const jobId = await this.emailProducer.sendEmail({
      to: dto.to,
      subject: dto.subject,
      body: dto.body,
      template: dto.template,
    });

    return {
      message: 'Email notification queued successfully',
      jobId,
      status: 'accepted',
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get email queue metrics' })
  async metrics() {
    return this.emailProducer.getQueueMetrics();
  }
}
