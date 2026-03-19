/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import Handlebars from "handlebars";
import * as nodemailer from "nodemailer";
import {
	ENABLE_MAIL_SERVICE_LOG,
	ENV_MAIL_SERVICE,
	ENV_SMTP_FROM_EMAIL,
	ENV_SMTP_ID,
	ENV_SMTP_PW,
} from "../_common/const/envKeys";
import { ServiceException } from "../_common/filter/exception/service/serviceException";
import { LoggerService } from "../logger/logger.service";
import { isMailException } from "./util";

export const MAIL_SUBJECT = {
	EMAIL_VERIFICATION: "Email verification",
	UPDATE_FORGOTTEN_PW: "Update Forgotten password",
	RECOVER_ACCOUNT: "Recover Account",
} as const;

export type MailSubjectType = (typeof MAIL_SUBJECT)[keyof typeof MAIL_SUBJECT];

@Injectable()
export class MailService implements OnModuleInit {
	private TEMPLATE = {
		EMAIL_VERIFY: "email-verify",
		FORGET_PASSWORD: "forget-password",
		REPORT: "report",
	};

	private TEMPLATE_PATH = "src/modules/mail/templates";

	private transporter: nodemailer.Transporter;

	constructor(
		@Inject(ConfigService) private readonly configService: ConfigService,
		@Inject(LoggerService) readonly logger: LoggerService,
	) {
		this.transporter = nodemailer.createTransport({
			service: this.configService.get(ENV_MAIL_SERVICE) || ENV_MAIL_SERVICE,
			auth: {
				user: this.configService.get(ENV_SMTP_ID),
				pass: this.configService.get(ENV_SMTP_PW),
			},
			logger: this.configService.get(ENABLE_MAIL_SERVICE_LOG) === "true",
			connectionTimeout: 30 * 1000,
			greetingTimeout: 30 * 1000,
			secure: true,
			// debug: !isProduction,
		});

		Handlebars.registerHelper("safeLink", (url: string) => {
			const isSafe = /^(https?):\/\/[\w.-]+/i.test(url);
			return isSafe ? new Handlebars.SafeString(url) : "#?message=UnSafeLinkContained";
		});
	}

	async onModuleInit() {
		try {
			await this.transporter.verify();
			Logger.log(`MailService initialized`, { className: MailService.name });
		} catch (err) {
			const currentError = new Error();
			Logger.error(`MailService initialization Fail`, currentError.stack || "", {
				className: MailService.name,
			});
			this.handleError(err);
		}
	}
	async sendVerificationPinCode(to: string, pinCode: string) {
		const html = this.getTemplate(this.TEMPLATE.EMAIL_VERIFY, { pinCode });
		try {
			await this.transporter.verify();
			const result = await this.transporter.sendMail({
				to,
				subject: MAIL_SUBJECT.EMAIL_VERIFICATION,
				html,
				from: this.configService.get(ENV_SMTP_FROM_EMAIL),
			});
			return result;
		} catch (e) {
			this.handleError(e);
		}
	}

	//
	async sendSecurityTokenLink(to: string, subject: MailSubjectType, link: string) {
		const html = this.getTemplate(this.TEMPLATE.FORGET_PASSWORD, { link, subject });
		try {
			await this.transporter.verify();
			const result = await this.transporter.sendMail({
				to,
				subject,
				html,
				from: this.configService.get(ENV_SMTP_FROM_EMAIL),
			});

			return result;
		} catch (e) {
			this.handleError(e);
		}
	}

	private getTemplate(path: string, context: any) {
		const filePath = `${this.TEMPLATE_PATH}/${path}.hbs`;
		const source = fs.readFileSync(filePath, "utf-8").toString();
		const template = Handlebars.compile(source);

		return template({ ...context });
	}

	private handleError(err: unknown) {
		if (!isMailException(err)) {
			this.logger.logUnknownError("Unexpected error:", err, {
				className: MailService.name,
			});
			throw new ServiceException("EXTERNAL_SERVICE_FAILED", "INTERNAL_SERVER_ERROR", {
				cause: err,
			});
		}

		switch (err.code) {
			case "ECONNECTION":
			case "ETIMEDOUT":
			case "EDNS":
			case "ESOCKET":
				this.logger.error("Network error - will retry later", err.stack || "", {
					className: MailService.name,
				});
				// Schedule retry
				break;

			case "EAUTH":
			case "ENOAUTH":
				this.logger.error("Authentication failed - check credentials", err.stack || "", {
					className: MailService.name,
				});
				// Do not retry without fixing credentials
				break;

			case "EOAUTH2":
				this.logger.error("OAuth2 error - check token configuration", err.stack || "", {
					className: MailService.name,
				});
				// Refresh token or re-authenticate
				break;

			case "EENVELOPE":
				this.logger.error("Invalid recipients:", err.stack || "", {
					className: MailService.name,
				});
				// Remove invalid recipients and retry
				break;

			case "EMESSAGE":
				this.logger.error("Message rejected by server", err.stack || "", {
					className: MailService.name,
				});
				// Check message content
				break;

			case "ETLS":
			case "EREQUIRETLS":
				this.logger.error("TLS/Security error", err.stack || "", {
					className: MailService.name,
				});
				// Check TLS configuration
				break;

			case "ECONFIG":
				this.logger.error("Configuration error", err.stack || "", {
					className: MailService.name,
				});
				// Review transport configuration
				break;

			case "ESENDMAIL":
				this.logger.error("Sendmail error", err.stack || "", {
					className: MailService.name,
				});
				// Check sendmail installation
				break;

			default:
				this.logger.logUnknownError("Unexpected error:", err, {
					className: MailService.name,
				});
		}

		throw new ServiceException("EXTERNAL_SERVICE_FAILED", "INTERNAL_SERVER_ERROR", {
			cause: err,
		});
	}
}
