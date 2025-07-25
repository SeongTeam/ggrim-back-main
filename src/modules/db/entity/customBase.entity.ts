import { ApiHideProperty } from "@nestjs/swagger";
import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn, VersionColumn } from "typeorm";

export class CustomBaseEntity {
	@ApiHideProperty()
	@CreateDateColumn({
		type: "timestamp with time zone",
		precision: 6,
		default: () => "CURRENT_TIMESTAMP(6)",
	})
	created_date!: Date;

	@ApiHideProperty()
	@UpdateDateColumn({
		type: "timestamp with time zone",
		precision: 6,
		nullable: true,
	})
	updated_date!: Date;

	@ApiHideProperty()
	@DeleteDateColumn({
		type: "timestamp with time zone",
		precision: 6,
		nullable: true,
	})
	deleted_date!: Date;

	@ApiHideProperty()
	@VersionColumn({
		nullable: true,
	})
	version!: number;
}
