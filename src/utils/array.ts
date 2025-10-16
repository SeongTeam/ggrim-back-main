/**
 *
 * @param strArr
 * @param locales
 * @param options
 * @returns reference of sorted origin array
 * @description sort origin array by locale and options
 */
export function sortByLocale(
	strArr: string[],
	locales?: Intl.LocalesArgument,
	options?: Intl.CollatorOptions,
) {
	return strArr.sort((s1, s2) => s1.localeCompare(s2, locales, options));
}
