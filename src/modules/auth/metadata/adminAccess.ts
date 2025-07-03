import { SetMetadata } from "@nestjs/common";

export const ADMIN_ACCESS_KEY = "administrator";

export const AdminAccess = () => SetMetadata(ADMIN_ACCESS_KEY, true);
