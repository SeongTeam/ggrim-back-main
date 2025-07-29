import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiForbiddenResponse } from "@nestjs/swagger";
import { UserRole } from "../../../user/const";
import { Roles } from "../../../user/metadata/role";
import { CheckOwnerOption, CheckOwner } from "../../metadata/owner";
import { OwnerGuard } from "../authorization/owner.guard";
import { RolesGuard } from "../authorization/roles.guard";
import { SecurityTokenGuardOptions } from "../../metadata/securityTokenGuardOption";
import { TokenAuthGuard } from "../authentication/tokenAuth.guard";
import { BasicGuard } from "../authentication/basic.guard";
import { UseBasicAuthGuard, UseSecurityTokenGuard, UseTokenAuthGuard } from "./authentication";
import { OneTimeTokenPurpose } from "../../types/oneTimeToken";
import { SecurityTokenGuard } from "../authentication/securityToken.guard";

type TokenAuthGuardConstructor = typeof TokenAuthGuard;
type BasicGuardConstructor = typeof BasicGuard;
type SecurityTokenGuardConstructor = typeof SecurityTokenGuard;

type AuthenticatedGuardSelector =
	| { guard: TokenAuthGuardConstructor }
	| { guard: BasicGuardConstructor }
	| {
			guard: SecurityTokenGuardConstructor;
			purpose: OneTimeTokenPurpose;
			authOptions?: SecurityTokenGuardOptions;
	  };

export function UseOwnerGuard(selector: AuthenticatedGuardSelector, options: CheckOwnerOption) {
	const defaultDecorators = [
		CheckOwner(options),
		UseGuards(OwnerGuard),
		ApiForbiddenResponse({ description: "User does not own the resource." }),
	];

	const guardDecorators = (() => {
		if ("purpose" in selector) {
			return [UseSecurityTokenGuard(selector.purpose, selector.authOptions)];
		} else if (selector.guard === BasicGuard) {
			return [UseBasicAuthGuard()];
		} else if (selector.guard === TokenAuthGuard) {
			return [UseTokenAuthGuard()];
		} else {
			throw new Error("Invalid guard selector");
		}
	})();

	return applyDecorators(...guardDecorators, ...defaultDecorators);
}

export function UseRolesGuard(role: UserRole) {
	return applyDecorators(
		UseTokenAuthGuard(),
		Roles(role),
		UseGuards(RolesGuard),
		ApiForbiddenResponse({ description: "Not allowed User's role" }),
	);
}
