import { toolsCopy } from '../../locales/tools';
import { translate, type Translate } from '../../locales';
import type { SoilParamKey } from '../../demo';
export { toolsCopy };
export type ToolsCopyKey = keyof typeof toolsCopy;
export function toolCopy(key: ToolsCopyKey, params?: Record<string, string | number>): string {
  return translate('en', key, params);
}

/** Unit-free parameter label for result and import rows (the value carries the unit). */
export function soilParamLabel(t: Translate, key: SoilParamKey): string {
  if (key === 'ph') return t('soilResult.phLabel');
  if (key === 'organicCarbon') return t('soilResult.carbonLabel');
  return t(`soil.param.${key}` as const);
}
