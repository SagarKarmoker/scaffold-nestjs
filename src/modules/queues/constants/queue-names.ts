export const QUEUE_NAMES = {
  EMAIL: 'email',
  ORDER_PROCESSING: 'order-processing',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const EMAIL_JOB_NAMES = {
  SEND_EMAIL: 'send-email',
  SEND_WELCOME: 'send-welcome',
  SEND_NOTIFICATION: 'send-notification',
} as const;

export const ORDER_JOB_NAMES = {
  PROCESS_ORDER: 'process-order',
} as const;
