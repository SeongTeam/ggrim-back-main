// decorators/check-ownership.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const CHECK_OWNER_KEY = "checkOwner";

export interface OwnerCheckable {
	isOwner(resourceId: number, userId: number): Promise<boolean>;
}

type OwnerCheckableClass = new (...args: any[]) => OwnerCheckable;

export interface CheckOwnerOption {
	serviceClass: OwnerCheckableClass;
}

export const CheckOwner = (options: CheckOwnerOption) => SetMetadata(CHECK_OWNER_KEY, options);
