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
	updated_date!: Date | null;

	@DeleteDateColumn({
		type: "timestamp with time zone",
		precision: 6,
		nullable: true,
	})
	deleted_date!: Date | null;

	@VersionColumn({ type: "integer", nullable: true })
	version!: number | null;
}
