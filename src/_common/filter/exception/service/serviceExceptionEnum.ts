export const ServiceExceptionEnum = {
	BASE: 30000,
	NOT_IMPLEMENTED: 30001,

	//Related to typeORM Entity task
	ENTITY_NOT_FOUND: 31000,
	ENTITY_CREATE_FAILED: 31001,
	ENTITY_UPDATE_FAILED: 31002,
	ENTITY_DELETE_FAILED: 31003,
	ENTITY_RESTORE_FAILED: 31004,

	SERVICE_RUN_ERROR: 35000,
	SERVICE_RUN_TIMEOUT: 38000,
	EXTERNAL_SERVICE_FAILED: 38001,
	DEPENDENCY_UNAVAILABLE: 38002, // If a required microservice, database, or external dependency is unavailable.
	RATE_LIMIT_EXCEEDED: 38003, // When the client exceeds the allowed number of requests within a time period.
	DB_CONFLICT: 38004, // Conflict in resource (e.g., unique constraint violation)

	DB_INCONSISTENCY: 39000,
} as const;
