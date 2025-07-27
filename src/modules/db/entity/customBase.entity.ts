import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn, VersionColumn } from "typeorm";

export class CustomBaseEntity {
	@CreateDateColumn({
		type: "timestamp with time zone",
		precision: 6,
		default: () => "CURRENT_TIMESTAMP(6)",
	})
	created_date!: Date;

	@UpdateDateColumn({
		type: "timestamp with time zone",
		precision: 6,
		nullable: true,
	})
	updated_date!: Date;

	@DeleteDateColumn({
		type: "timestamp with time zone",
		precision: 6,
		nullable: true,
	})
	deleted_date!: Date;

	@VersionColumn({
		nullable: true,
	})
	version!: number;
}
