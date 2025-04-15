import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable } from '@nestjs/common';
import { ServiceException } from '../_common/filter/exception/service/service-exception';

export const ENUM_MAIL_SUBJECT = {
  EMAIL_VERIFICATION: 'Email verification',
  UPDATE_FORGOTTEN_PW: 'Update Forgotten password',
  RECOVER_ACCOUNT: 'Recover Account',
} as const;

export type MailSubjectType = (typeof ENUM_MAIL_SUBJECT)[keyof typeof ENUM_MAIL_SUBJECT];

@Injectable()
export class MailService {
  private ENUM_TEMPLATE = {
    EMAIL_VERIFY: 'email-verify',
    FORGET_PASSWORD: 'forget-password',
    REPORT: 'report',
  };
  constructor(@Inject(MailerService) private readonly mailer: MailerService) {}
  async sendVerificationPinCode(to: string, pinCode: string) {
    try {
      const result = await this.mailer
        .sendMail({
          to,
          subject: ENUM_MAIL_SUBJECT.EMAIL_VERIFICATION,
          context: {
            pinCode,
          },
          template: this.ENUM_TEMPLATE.EMAIL_VERIFY,
        })
        .then((response) => {
          return response;
        })
        .catch((err) => {
          throw new ServiceException(
            'SERVICE_RUN_ERROR',
            'INTERNAL_SERVER_ERROR',
            `fail to send verification to ${to}`,
            { cause: err },
          );
        });
      return result;
    } catch (e) {
      throw new ServiceException('EXTERNAL_SERVICE_FAILED', 'INTERNAL_SERVER_ERROR', {
        cause: e,
      });
    }
  }

  //
  async sendSecurityTokenLink(to: string, subject: MailSubjectType, link: string) {
    try {
      const result = await this.mailer
        .sendMail({
          to,
          subject,
          context: {
            link,
            subject,
          },
          template: this.ENUM_TEMPLATE.FORGET_PASSWORD,
        })
        .then((response) => {
          return response;
        })
        .catch((err) => {
          throw new ServiceException(
            'SERVICE_RUN_ERROR',
            'INTERNAL_SERVER_ERROR',
            `fail to send verification to ${to}`,
            { cause: err },
          );
        });
      return result;
    } catch (e) {
      throw new ServiceException('EXTERNAL_SERVICE_FAILED', 'INTERNAL_SERVER_ERROR', {
        cause: e,
      });
    }
  }
}
