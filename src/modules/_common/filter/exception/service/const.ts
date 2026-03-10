export const SERVICE_EXCEPTION_STATUS = {
	// Example :
	BASE: "Base Exception Situation",
	NOT_IMPLEMENTED: "Not implemented Function",

	//Related to typeORM Entity task
	ENTITY_NOT_FOUND: "Entity Not Found",
	ENTITY_CREATE_FAILED: "Entity Create Failed",
	ENTITY_UPDATE_FAILED: "Entity Update Failed",
	ENTITY_DELETE_FAILED: "Entity Delete Failed",
	ENTITY_RESTORE_FAILED: "Entity Restore Failed",
	ENTITY_DUPLICATED: "Entity Duplicated",

	SERVICE_RUN_ERROR: "Service run Error",
	SERVICE_RUN_TIMEOUT: "Service Run Timeout",
	EXTERNAL_SERVICE_FAILED: "External Service Failed",
	DEPENDENCY_UNAVAILABLE: "Dependency Unavailable", // If a required microservice, database, or external dependency is unavailable.
	RATE_LIMIT_EXCEEDED: "Rate Limit Exceeded", // When the client exceeds the allowed number of requests within a time period.
	DB_CONFLICT: "DB Conflict from constraint", // Conflict in resource (e.g., unique constraint violation)

	DB_INCONSISTENCY: "DB inconsistency",

	//Relation to Auth
	UNAUTHENTICATED: "Unauthenticated",
	UNAUTHORIZED: "Unauthorized",

	UNEXPECTED_JWT_ERROR: "Unexpected Jwt Error",
} as const;

export type ServiceExceptionCodeKey = keyof typeof SERVICE_EXCEPTION_STATUS;
export type ServiceErrorCode = (typeof SERVICE_EXCEPTION_STATUS)[ServiceExceptionCodeKey];
