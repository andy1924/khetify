import { homeCopy } from '../../locales/home';
import { translate } from '../../locales';
export { homeCopy };
export type HomeCopyKey = keyof typeof homeCopy;
export function homeText(key: HomeCopyKey, params?: Record<string, string | number>): string {
  return translate('en', key, params);
}
