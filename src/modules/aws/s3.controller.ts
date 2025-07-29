import { Controller, Get, Param, Query } from "@nestjs/common";

import { S3Service } from "./s3.service";
import { UseRolesGuard } from "../auth/guard/decorator/authorization";

@Controller("s3")
export class S3Controller {
	constructor(private readonly s3Service: S3Service) {}

	@UseRolesGuard("admin")
	@Get(":bucket")
	async readFile(
		@Param("bucket") bucket: string,
		@Query("key") key: string,
		@Query("destination") destination: string,
	) {
		await this.s3Service.downloadFile(bucket, key, destination);
	}
}
