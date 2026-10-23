import type { StageId, StringKey } from './types';

/**
 * Stage copy keys live here (not in fixtures) so the localization module can
 * reference them without importing the store. Feature screens read
 * `stage.titleKey` / `stage.captionKey` from state.
 */
export const stageTitleKeys: Record<StageId, StringKey> = {
  land: 'plan.stage.land.title',
  seed: 'plan.stage.seed.title',
  preparation: 'plan.stage.preparation.title',
  nutrition: 'plan.stage.nutrition.title',
  harvest: 'plan.stage.harvest.title',
  selling: 'plan.stage.selling.title',
};

type CaptionSet = Record<'completed' | 'current' | 'locked', StringKey>;

export const stageCaptionKeys: Record<StageId, CaptionSet> = {
  land: {
    completed: 'plan.stage.land.done',
    current: 'plan.stage.land.current',
    locked: 'plan.stage.land.locked',
  },
  seed: {
    completed: 'plan.stage.seed.done',
    current: 'plan.stage.seed.current',
    locked: 'plan.stage.seed.locked',
  },
  preparation: {
    completed: 'plan.stage.preparation.done',
    current: 'plan.stage.preparation.current',
    locked: 'plan.stage.preparation.locked',
  },
  nutrition: {
    completed: 'plan.stage.nutrition.done',
    current: 'plan.stage.nutrition.current',
    locked: 'plan.stage.nutrition.locked',
  },
  harvest: {
    completed: 'plan.stage.harvest.done',
    current: 'plan.stage.harvest.current',
    locked: 'plan.stage.harvest.locked',
  },
  selling: {
    completed: 'plan.stage.selling.done',
    current: 'plan.stage.selling.current',
    locked: 'plan.stage.selling.locked',
  },
};

export function stageTitleKey(id: StageId): StringKey {
  return stageTitleKeys[id];
}
