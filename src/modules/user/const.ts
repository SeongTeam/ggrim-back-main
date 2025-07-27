export const USER_ROLE = {
	ADMIN: "admin",
	USER: "user",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const USER_STATE = {
	ACTIVE: "active",
	INACTIVE: "inactive",
	BANNED: "banned",
} as const;

export type UserState = (typeof USER_STATE)[keyof typeof USER_STATE];
