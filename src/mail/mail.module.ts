import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import {
  ENV_MAIL_SERVICE,
  ENV_SMTP_FROM_EMAIL,
  ENV_SMTP_ID,
  ENV_SMTP_PW,
} from '../_common/const/env-keys.const';
import { MailService } from './mail.service';

@Module({
  imports: [
    //need to async because env is loaded asynchronously by configModule
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          // host and port is not needed when you config service option
          // host: process.env[ENV_MAIL_HOST] || 'abc.com',
          // port: Number(process.env[ENV_SMTP_PORT] || '1234567'),
          service: process.env[ENV_MAIL_SERVICE] || ENV_MAIL_SERVICE,
          auth: {
            user: process.env[ENV_SMTP_ID],
            pass: process.env[ENV_SMTP_PW],
          },
          secure: true,
        },
        defaults: {
          from: process.env[ENV_SMTP_FROM_EMAIL],
        },
        template: {
          dir: process.cwd() + '/src/mail/templates/',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
