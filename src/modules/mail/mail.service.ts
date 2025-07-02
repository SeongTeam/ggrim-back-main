/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import Handlebars from "handlebars";
import * as nodemailer from "nodemailer";
import {
	ENV_MAIL_SERVICE,
	ENV_SMTP_FROM_EMAIL,
	ENV_SMTP_ID,
	ENV_SMTP_PW,
	NODE_ENV,
} from "../_common/const/envKeys.const";
import { ServiceException } from "../_common/filter/exception/service/serviceException";

export const MAIL_SUBJECT = {
	EMAIL_VERIFICATION: "Email verification",
	UPDATE_FORGOTTEN_PW: "Update Forgotten password",
	RECOVER_ACCOUNT: "Recover Account",
} as const;

export type MailSubjectType = (typeof MAIL_SUBJECT)[keyof typeof MAIL_SUBJECT];

@Injectable()
export class MailService {
	private TEMPLATE = {
		EMAIL_VERIFY: "email-verify",
		FORGET_PASSWORD: "forget-password",
		REPORT: "report",
	};

	private TEMPLATE_PATH = "src/mail/templates";

	private transporter: nodemailer.Transporter;

	constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
		const isProduction = this.configService.get(NODE_ENV) === "production";
		this.transporter = nodemailer.createTransport({
			service: this.configService.get(ENV_MAIL_SERVICE) || ENV_MAIL_SERVICE,
			auth: {
				user: this.configService.get(ENV_SMTP_ID),
				pass: this.configService.get(ENV_SMTP_PW),
			},
			logger: !isProduction,
			secure: true,
			// debug: !isProduction,
		});

		Handlebars.registerHelper("safeLink", (url: string) => {
			const isSafe = /^(https?):\/\/[\w.-]+/i.test(url);
			return isSafe ? new Handlebars.SafeString(url) : "#?message=UnSafeLinkContained";
		});
	}
	async sendVerificationPinCode(to: string, pinCode: string) {
		const html = this.getTemplate(this.TEMPLATE.EMAIL_VERIFY, { pinCode });
		try {
			const result = await this.transporter
				.sendMail({
					to,
					subject: MAIL_SUBJECT.EMAIL_VERIFICATION,
					html,
					from: this.configService.get(ENV_SMTP_FROM_EMAIL),
				})
				.then((response) => {
					return response;
				})
				.catch((err) => {
					throw new ServiceException(
						"SERVICE_RUN_ERROR",
						"INTERNAL_SERVER_ERROR",
						`fail to send verification to ${to.replace(/(.{2}).+(@.*)/, "$1***$2")}`,
						{ cause: err },
					);
				});
			return result;
		} catch (e) {
			throw new ServiceException("EXTERNAL_SERVICE_FAILED", "INTERNAL_SERVER_ERROR", {
				cause: e,
			});
		}
	}

	//
	async sendSecurityTokenLink(to: string, subject: MailSubjectType, link: string) {
		const html = this.getTemplate(this.TEMPLATE.FORGET_PASSWORD, { link, subject });
		try {
			const result = await this.transporter
				.sendMail({
					to,
					subject,
					html,
					from: this.configService.get(ENV_SMTP_FROM_EMAIL),
				})
				.then((response) => {
					return response;
				})
				.catch((err) => {
					throw new ServiceException(
						"SERVICE_RUN_ERROR",
						"INTERNAL_SERVER_ERROR",
						`fail to send verification to ${to.replace(/(.{2}).+(@.*)/, "$1***$2")}`,
						{ cause: err },
					);
				});
			return result;
		} catch (e) {
			throw new ServiceException("EXTERNAL_SERVICE_FAILED", "INTERNAL_SERVER_ERROR", {
				cause: e,
			});
		}
	}

	private getTemplate(path: string, context: any) {
		const filePath = `${this.TEMPLATE_PATH}/${path}.hbs`;
		const source = fs.readFileSync(filePath, "utf-8").toString();
		const template = Handlebars.compile(source);

		return template({ ...context });
	}
}
