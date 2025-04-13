import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable } from '@nestjs/common';
import { ServiceException } from '../_common/filter/exception/service/service-exception';

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
          subject: 'Email verification ',
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
  async sendForgetPassword(to: string, link: string) {
    try {
      const result = await this.mailer
        .sendMail({
          to,
          subject: 'Update forgotten password',
          context: {
            link,
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
