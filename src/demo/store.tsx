import React, { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { createInitialState } from './fixtures';
import { demoReducer } from './reducer';
import type { DemoAction, DemoActions, DemoState, SoilParamKey, StageId } from './types';

interface DemoContextValue {
  state: DemoState;
  dispatch: React.Dispatch<DemoAction>;
  actions: DemoActions;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function createDemoActions(dispatch: React.Dispatch<DemoAction>): DemoActions {
  const update = <K extends keyof DemoActions>(key: K, fn: DemoActions[K]) =>
    ({ [key]: fn } as Pick<DemoActions, K>);
  return Object.assign(
    {},
    update('setLocale', locale => dispatch({ type: 'locale/set', locale })),
    update('setMobile', digits => dispatch({ type: 'onboarding/mobile', digits })),
    update('otpSending', () => dispatch({ type: 'onboarding/otpSending' })),
    update('otpVerifying', () => dispatch({ type: 'onboarding/otpVerifying' })),
    update('otpSuccess', () => dispatch({ type: 'onboarding/otpSuccess' })),
    update('otpFailed', () => dispatch({ type: 'onboarding/otpFailed' })),
    update('otpReset', () => dispatch({ type: 'onboarding/otpReset' })),
    update('completeOnboarding', () => dispatch({ type: 'onboarding/complete' })),
    update('signOut', () => dispatch({ type: 'onboarding/signOut' })),
    update('resetDemo', () => dispatch({ type: 'demo/reset' })),
    update('startFirstVisit', () => dispatch({ type: 'plan/startFirstVisit' })),
    update('beginAssessment', () => dispatch({ type: 'assessment/begin' })),
    update('updateAssessment', patch => dispatch({ type: 'assessment/update', patch })),
    update('cancelAssessment', () => dispatch({ type: 'assessment/cancel' })),
    update('saveAssessment', () => dispatch({ type: 'assessment/save' })),
    update('beginRevision', () => dispatch({ type: 'plan/revisionBegin' })),
    update('cancelRevision', () => dispatch({ type: 'plan/revisionCancel' })),
    update('confirmRevision', () => dispatch({ type: 'plan/revisionConfirm' })),
    update('setStageQuote', (stageId: StageId, quotePerKg: number | null) =>
      dispatch({ type: 'plan/stageQuote', stageId, quotePerKg }),
    ),
    update('setStageSeed', (stageId: StageId, seedId: string | null) =>
      dispatch({ type: 'plan/stageSeed', stageId, seedId }),
    ),
    update('setRevisionBudget', (budget: number | null) =>
      dispatch({ type: 'plan/revisionBudget', budget }),
    ),
    update('markStageDone', (stageId: StageId) => dispatch({ type: 'plan/stageDone', stageId })),
    update('setSoilValue', (key, value) => dispatch({ type: 'soil/value', key, value })),
    update('setSoilUnit', (key, unit) => dispatch({ type: 'soil/unit', key, unit })),
    update('clearSoilValue', key => dispatch({ type: 'soil/clear', key })),
    update('toggleSoilAdditional', () => dispatch({ type: 'soil/toggleAdditional' })),
    update('setSoilContext', patch => dispatch({ type: 'soil/context', patch })),
    update('analyzeSoil', () => dispatch({ type: 'soil/analyze' })),
    update('beginSoilImport', () => dispatch({ type: 'soil/importBegin' })),
    update('cancelSoilImport', () => dispatch({ type: 'soil/importCancel' })),
    update('confirmSoilImport', (keys?: SoilParamKey[]) =>
      dispatch({ type: 'soil/importConfirm', keys }),
    ),
    update('setMarketQuantity', quintals => dispatch({ type: 'market/quantity', quintals })),
    update('setMarketCost', (marketId, field, value) =>
      dispatch({ type: 'market/cost', marketId, field, value }),
    ),
    update('setCommunityFilter', filter => dispatch({ type: 'community/filter', filter })),
    update('updateObservation', patch => dispatch({ type: 'community/draft', patch })),
    update('setObservationLocationConsent', value =>
      dispatch({ type: 'community/locationConsent', value }),
    ),
    update('setObservationPhoto', photoId => dispatch({ type: 'community/photo', photoId })),
    update('submitObservation', () => dispatch({ type: 'community/submit' })),
    update('resetObservationDraft', () => dispatch({ type: 'community/draftReset' })),
    update('beginProfileEdit', () => dispatch({ type: 'profile/editBegin' })),
    update('updateProfileDraft', patch => dispatch({ type: 'profile/editUpdate', patch })),
    update('cancelProfileEdit', () => dispatch({ type: 'profile/editCancel' })),
    update('saveProfileEdit', () => dispatch({ type: 'profile/editSave' })),
    update('setConsent', (key, value) => dispatch({ type: 'consent/set', key, value })),
    update('recordToolUse', (tool, labelKey, summary) => dispatch({ type: 'tool/record', tool, labelKey, summary })),
    update('clearToolHistory', () => dispatch({ type: 'tool/clear' })),
  ) as DemoActions;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, undefined, createInitialState);
  const actions = useMemo(() => createDemoActions(dispatch), [dispatch]);
  const value = useMemo(() => ({ state, dispatch, actions }), [state, actions]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

/** Requires `<DemoProvider>` (mounted by the root layout). */
export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used inside <DemoProvider>.');
  }
  return context;
}

export function useDemoState(): DemoState {
  return useDemo().state;
}

export function useDemoActions(): DemoActions {
  return useDemo().actions;
}

export function useDemoSelector<T>(selector: (state: DemoState) => T): T {
  return selector(useDemo().state);
}

export { DemoContext };
