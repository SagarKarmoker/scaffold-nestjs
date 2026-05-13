import * as nodemailer from 'nodemailer';

const isProduction = process.env.NODE_ENV === 'production';

const configService = {
  HOST: process.env.MAIL_HOST || 'localhost',
  PORT: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 1025,
  USER: process.env.SMTP_USER || undefined,
  PASSWORD: process.env.SMTP_PASSWORD || undefined,
};

const transportConfig: nodemailer.TransportOptions = {
  host: configService.HOST,
  port: configService.PORT,
  secure: configService.PORT === 465,
  auth:
    configService.USER && configService.PASSWORD
      ? {
          user: configService.USER,
          pass: configService.PASSWORD,
        }
      : undefined,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
};

if (isProduction) {
  const tlsConfig: nodemailer.TlsOptions = {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  };
  transportConfig.tls = tlsConfig;
  if (!configService.USER || !configService.PASSWORD) {
    console.warn(
      '[MailProvider] WARNING: SMTP auth not configured in production',
    );
  }
}

export const mailProvider = nodemailer.createTransport(transportConfig);
