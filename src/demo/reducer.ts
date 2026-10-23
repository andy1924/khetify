import { createInitialState, SOIL_PARAMS } from './fixtures';
import { stageCaptionKeys } from './stage-keys';
import type {
  AssessmentDraft,
  DemoAction,
  DemoState,
  Observation,
  ObservationDraft,
  PlanStage,
  SoilParamKey,
  StageId,
} from './types';

/** Reference fixture for screen je22r: estimated cost delta −₹3,200 on a ₹4,000 budget cut. */
export const REVISION_COST_DELTA = 3200;

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 10);

const isValidMobile = (digits: string) => /^[6-9]\d{9}$/.test(digits);

const numberOrNull = (value: string): number | null => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

function assessmentFromState(state: DemoState): AssessmentDraft {
  return {
    farmName: state.farm.farmName,
    areaAcres: state.farm.areaAcres,
    district: `${state.farm.district}, ${state.farm.stateName}`,
    season: state.farm.season,
    budget: state.farm.budget,
    water: state.farm.water,
  };
}

function ensureStages(state: DemoState): PlanStage[] {
  if (state.plan.stages.length === 6) return state.plan.stages;
  return createInitialState().plan.stages;
}

/** Complete the given stage and unlock the next one, leaving later stages untouched. */
function advanceStage(stages: PlanStage[], stageId: StageId): PlanStage[] {
  const index = stages.findIndex(stage => stage.id === stageId);
  if (index < 0) return stages;
  const current = stages[index];
  if (current.status === 'locked') return stages;
  return stages.map((stage, i) => {
    if (i === index) {
      return { ...stage, status: 'completed' as const, captionKey: stageCaptionKeys[stage.id].completed };
    }
    if (i === index + 1) {
      return { ...stage, status: 'current' as const, captionKey: stageCaptionKeys[stage.id].current };
    }
    return stage;
  });
}

function clearDrafts(state: DemoState): DemoState {
  return {
    ...state,
    assessmentDraft: null,
    profileDraft: null,
    plan: { ...state.plan, revisionDraft: null },
    soil: { ...state.soil, importDraft: false },
    community: { ...state.community, draft: createInitialState().community.draft },
  };
}

function submittedObservation(draft: ObservationDraft, id: string): Observation {
  return {
    id,
    titleKey: 'community.item.leafspots.title',
    detailKey: 'community.item.leafspots.detail',
    status: 'reported',
    district: draft.district,
    crop: draft.crop,
    distanceKm: 2,
    hoursAgo: 0,
    photoId: draft.photoId,
  };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'locale/set':
      return { ...state, locale: action.locale };

    case 'onboarding/mobile':
      return {
        ...state,
        onboarding: { ...state.onboarding, mobile: digitsOnly(action.digits), otpStatus: 'idle' },
      };

    case 'onboarding/otpSending':
      return {
        ...state,
        onboarding: { ...state.onboarding, otpStatus: 'sending', otpAttempts: 0 },
      };

    case 'onboarding/otpVerifying':
      return { ...state, onboarding: { ...state.onboarding, otpStatus: 'verifying' } };

    case 'onboarding/otpSuccess':
      return {
        ...state,
        onboarding: {
          ...state.onboarding,
          otpStatus: 'success',
          signedIn: true,
          completed: true,
        },
      };

    case 'onboarding/otpFailed':
      return {
        ...state,
        onboarding: {
          ...state.onboarding,
          otpStatus: 'error',
          otpAttempts: state.onboarding.otpAttempts + 1,
        },
      };

    case 'onboarding/otpReset':
      return {
        ...state,
        onboarding: { ...state.onboarding, otpStatus: 'idle', otpAttempts: 0 },
      };

    case 'onboarding/complete':
      return {
        ...state,
        onboarding: { ...state.onboarding, otpStatus: 'success', signedIn: true, completed: true },
      };

    case 'onboarding/signOut':
      return {
        ...clearDrafts(state),
        onboarding: {
          mobile: '',
          otpStatus: 'idle',
          otpAttempts: 0,
          signedIn: false,
          completed: false,
        },
        consents: { approximateLocation: false, communitySharing: false, notifications: false },
      };

    case 'demo/reset':
      return createInitialState();

    case 'plan/startFirstVisit':
      return { ...state, plan: { ...state.plan, exists: false } };

    case 'assessment/begin':
      return { ...state, assessmentDraft: assessmentFromState(state) };

    case 'assessment/update':
      return state.assessmentDraft
        ? { ...state, assessmentDraft: { ...state.assessmentDraft, ...action.patch } }
        : state;

    case 'assessment/cancel':
      return { ...state, assessmentDraft: null };

    case 'assessment/save': {
      const draft = state.assessmentDraft;
      if (!draft) return state;
      const exists = state.plan.exists;
      const base = createInitialState();
      return {
        ...state,
        farm: {
          ...state.farm,
          farmName: draft.farmName.trim() || state.farm.farmName,
          areaAcres: draft.areaAcres ?? state.farm.areaAcres,
          district: draft.district.trim() || state.farm.district,
          season: draft.season.trim() || state.farm.season,
          water: draft.water,
          budget: draft.budget ?? state.farm.budget,
        },
        plan: {
          ...state.plan,
          exists: true,
          budget: draft.budget ?? state.plan.budget,
          stages: exists ? ensureStages(state) : base.plan.stages,
        },
        assessmentDraft: null,
      };
    }

    case 'plan/revisionBegin': {
      if (state.plan.revisionDraft) return state;
      const fromBudget = state.plan.budget;
      const toBudget = 26000;
      return {
        ...state,
        plan: {
          ...state.plan,
          revisionDraft: {
            fromBudget,
            toBudget,
            // Fixture estimate from the reference screen — not a derived algorithm.
            delta: REVISION_COST_DELTA,
            changes: [
              { id: 'storage', titleKey: 'revision.change.storage', detailKey: 'revision.change.storageDetail' },
              { id: 'seed', titleKey: 'revision.change.seed', detailKey: 'revision.change.seedDetail' },
              { id: 'resources', titleKey: 'revision.change.resources', detailKey: 'revision.change.resourcesDetail' },
            ],
          },
        },
      };
    }

    case 'plan/revisionBudget': {
      const draft = state.plan.revisionDraft;
      if (!draft) return state;
      const toBudget = action.budget !== null && action.budget > 0 ? action.budget : draft.toBudget;
      return {
        ...state,
        plan: {
          ...state.plan,
          revisionDraft: { ...draft, toBudget },
        },
      };
    }

    case 'plan/revisionCancel':
      return { ...state, plan: { ...state.plan, revisionDraft: null } };

    case 'plan/revisionConfirm': {
      const draft = state.plan.revisionDraft;
      if (!draft) return state;
      const nextVersion = state.plan.version + 1;
      const committedCost = Math.max(0, state.plan.committedCost - draft.delta);
      return {
        ...state,
        farm: { ...state.farm, budget: draft.toBudget },
        plan: {
          ...state.plan,
          budget: draft.toBudget,
          committedCost,
          version: nextVersion,
          revisionDraft: null,
          revisionHistory: [
            ...state.plan.revisionHistory,
            { version: state.plan.version, budget: draft.fromBudget, delta: draft.delta },
          ],
        },
      };
    }

    case 'plan/stageQuote': {
      const quote = action.quotePerKg !== null && action.quotePerKg > 0 ? action.quotePerKg : null;
      return {
        ...state,
        plan: {
          ...state.plan,
          stages: state.plan.stages.map(stage =>
            stage.id === action.stageId ? { ...stage, quotePerKg: quote } : stage,
          ),
        },
      };
    }

    case 'plan/stageSeed':
      return {
        ...state,
        plan: {
          ...state.plan,
          stages: state.plan.stages.map(stage =>
            stage.id === action.stageId ? { ...stage, seedId: action.seedId } : stage,
          ),
        },
      };

    case 'plan/stageDone':
      return {
        ...state,
        plan: { ...state.plan, stages: advanceStage(state.plan.stages, action.stageId) },
      };

    case 'soil/unit':
      return { ...state, soil: { ...state.soil, units: { ...state.soil.units, [action.key]: action.unit } } };

    case 'soil/value': {
      const value = action.value;
      const values = { ...state.soil.values };
      if (value.trim() === '') delete values[action.key];
      else values[action.key] = value;
      return { ...state, soil: { ...state.soil, values, result: state.soil.result } };
    }

    case 'soil/clear': {
      const values = { ...state.soil.values };
      delete values[action.key];
      return { ...state, soil: { ...state.soil, values } };
    }

    case 'soil/toggleAdditional':
      return { ...state, soil: { ...state.soil, showAdditional: !state.soil.showAdditional } };

    case 'soil/context':
      return { ...state, soil: { ...state.soil, ...action.patch } };

    case 'soil/analyze': {
      const entered = SOIL_PARAMS.flatMap(key => {
        const value = state.soil.values[key];
        return value !== undefined && value.trim() !== '' ? [{ key, value: value.trim() }] : [];
      });
      if (entered.length === 0) return state;
      return {
        ...state,
        soil: {
          ...state.soil,
          imported: false,
          importDraft: false,
          result: {
            crop: state.soil.crop,
            units: { ...state.soil.units },
            sampleDate: state.soil.sampleDate,
            entered,
            enteredCount: entered.length,
            totalCount: SOIL_PARAMS.length,
            createdAt: Date.now(),
          },
        },
      };
    }

    case 'soil/importBegin':
      return state.soil.result ? { ...state, soil: { ...state.soil, importDraft: true } } : state;

    case 'soil/importCancel':
      return { ...state, soil: { ...state.soil, importDraft: false } };

    case 'soil/importConfirm': {
      const result = state.soil.result;
      if (!result || !state.soil.importDraft) return state;
      const selected = action.keys ? new Set(action.keys) : null;
      const values: Partial<Record<SoilParamKey, string>> = {};
      for (const entry of result.entered) {
        if (selected && !selected.has(entry.key)) continue;
        values[entry.key] = entry.value;
      }
      return {
        ...state,
        farm: { ...state.farm, soilTest: { crop: result.crop, sampleDate: result.sampleDate, values, units: Object.fromEntries(Object.keys(values).map(key => [key, result.units[key as SoilParamKey] ?? ''])) } },
        soil: { ...state.soil, importDraft: false, imported: true },
      };
    }

    case 'market/quantity':
      return {
        ...state,
        market: {
          ...state.market,
          quantityQuintals: Math.max(0, Math.round(action.quintals * 100) / 100),
        },
      };

    case 'market/cost': {
      const quotes = state.market.quotes.map(quote =>
        quote.id === action.marketId
          ? { ...quote, costs: { ...quote.costs, [action.field]: action.value } }
          : quote,
      );
      return { ...state, market: { ...state.market, quotes } };
    }

    case 'community/filter':
      return { ...state, community: { ...state.community, filter: action.filter } };

    case 'community/draft':
      return {
        ...state,
        community: {
          ...state.community,
          draft: { ...state.community.draft, ...action.patch },
        },
      };

    case 'community/locationConsent':
      return {
        ...state,
        consents: { ...state.consents, approximateLocation: action.value },
        community: {
          ...state.community,
          draft: { ...state.community.draft, useApproximateLocation: action.value },
        },
      };

    case 'community/photo':
      return {
        ...state,
        community: {
          ...state.community,
          draft: { ...state.community.draft, photoId: action.photoId },
        },
      };

    case 'community/submit': {
      const id = `obs-local-${state.community.submittedIds.length + 1}`;
      return {
        ...state,
        community: {
          ...state.community,
          feed: [submittedObservation(state.community.draft, id), ...state.community.feed],
          submittedIds: [...state.community.submittedIds, id],
          lastSubmittedId: id,
          draft: createInitialState().community.draft,
        },
      };
    }

    case 'community/draftReset':
      return {
        ...state,
        community: { ...state.community, draft: createInitialState().community.draft },
      };

    case 'profile/editBegin':
      return {
        ...state,
        profileDraft: {
          farmerName: state.farm.farmerName,
          district: state.farm.district,
          stateName: state.farm.stateName,
          farmName: state.farm.farmName,
          areaAcres: state.farm.areaAcres,
          water: state.farm.water,
          budget: state.farm.budget,
        },
      };

    case 'profile/editUpdate':
      return state.profileDraft
        ? { ...state, profileDraft: { ...state.profileDraft, ...action.patch } }
        : state;

    case 'profile/editCancel':
      return { ...state, profileDraft: null };

    case 'profile/editSave': {
      const draft = state.profileDraft;
      if (!draft) return state;
      const budget = draft.budget ?? state.plan.budget;
      return {
        ...state,
        farm: {
          ...state.farm,
          farmerName: draft.farmerName.trim() || state.farm.farmerName,
          initials: initialsFor(draft.farmerName) || state.farm.initials,
          district: draft.district.trim() || state.farm.district,
          stateName: draft.stateName.trim() || state.farm.stateName,
          farmName: draft.farmName.trim() || state.farm.farmName,
          areaAcres: draft.areaAcres ?? state.farm.areaAcres,
          water: draft.water,
          budget,
        },
        plan: { ...state.plan, budget },
        profileDraft: null,
      };
    }

    case 'consent/set':
      return { ...state, consents: { ...state.consents, [action.key]: action.value } };

    case 'tool/record': {
      const createdAt = Date.now();
      return {
        ...state,
        toolHistory: [{ id: `${action.tool}-${createdAt}`, tool: action.tool, labelKey: action.labelKey, summary: action.summary, createdAt }, ...state.toolHistory.filter(item => item.tool !== action.tool)].slice(0, 5),
      };
    }

    case 'tool/clear':
      return { ...state, toolHistory: [] };

    default:
      return state;
  }
}

export function initialsFor(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

export { numberOrNull, isValidMobile, digitsOnly };
