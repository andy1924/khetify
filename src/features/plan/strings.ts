import { planCopy } from '../../locales/plan';
import { translate } from '../../locales';
export { planCopy };
export type PlanCopyKey = keyof typeof planCopy;
export function planText(key: PlanCopyKey, params?: Record<string, string | number>): string {
  return translate('en', key, params);
}
