// decorators/check-ownership.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const CHECK_OWNER_KEY = "checkOwner";

type ServiceClassType = new (...args: any[]) => any;

export interface CheckOwnerOption {
	serviceClass: ServiceClassType;
	idParam: string;
	ownerField: string;
	serviceMethod: string;
}

export const CheckOwner = (options: CheckOwnerOption) => SetMetadata(CHECK_OWNER_KEY, options);
