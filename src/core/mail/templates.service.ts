import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class EmailTemplatesService {
  private readonly appName: string;
  private readonly year: number;
  private readonly dashboardUrl: string;
  private readonly resetUrlBase: string;

  constructor(private readonly configService: ConfigService) {
    this.appName = this.configService.get<string>('APP_NAME') || 'MyApp';
    this.year = new Date().getFullYear();
    this.dashboardUrl =
      this.configService.get<string>('DASHBOARD_URL') ||
      'http://localhost:3000/dashboard';
    this.resetUrlBase =
      this.configService.get<string>('RESET_URL') ||
      'http://localhost:3000/reset-password';
  }

  renderWelcomeEmail(data: { name: string; email: string }): string {
    const template = fs.readFileSync(
      path.join(__dirname, 'templates', 'welcome.html'),
      'utf-8',
    );

    return this.renderTemplate(template, {
      name: data.name,
      appName: this.appName,
      year: this.year.toString(),
      dashboardUrl: this.dashboardUrl,
    });
  }

  renderPasswordResetEmail(data: {
    name: string;
    email: string;
    code: string;
    expiryMinutes: number;
  }): string {
    const template = fs.readFileSync(
      path.join(__dirname, 'templates', 'password-reset.html'),
      'utf-8',
    );

    const resetUrl = `${this.resetUrlBase}?email=${encodeURIComponent(data.email)}&code=${data.code}`;

    return this.renderTemplate(template, {
      name: data.name,
      code: data.code,
      expiryMinutes: data.expiryMinutes.toString(),
      appName: this.appName,
      year: this.year.toString(),
      resetUrl,
    });
  }

  private renderTemplate(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replaceAll(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }
}
