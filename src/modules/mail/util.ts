interface MailError extends Error {
	code: string;
	command: string;
	response: string;
	responseCode: number;
}

export function isMailException(err: unknown): err is MailError {
	return err instanceof Error && "code" in err && "responseCode" in err;
}
