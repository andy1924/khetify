import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createInitialState } from './fixtures';
import { demoReducer } from './reducer';
import type { DemoAction, DemoActions, DemoState, SoilParamKey, StageId } from './types';

export interface DemoContextValue {
  state: DemoState;
  dispatch: React.Dispatch<DemoAction>;
  actions: DemoActions;
}

/**
 * The demo state lives in a tiny external store rather than in React state.
 *
 * Why: `DemoContext` used to hand the whole `state` object to every consumer,
 * so a single dispatch — one keystroke in a form, one timer tick — re-rendered
 * every mounted screen, every sheet and the tab bar. The reducer already
 * replaces only the slice it touches (`{ ...state, soil: { ... } }`), so each
 * top-level slice keeps its identity for unrelated actions. Components can
 * therefore subscribe to the slices they actually read and skip re-renders
 * caused by everything else.
 *
 * `useSyncExternalStore` is the React-supported way to read mutable external
 * state without tearing, and it keeps the reducer synchronous: `dispatch`
 * computes the next state and notifies subscribers immediately.
 */
export interface DemoStore {
  getState: () => DemoState;
  subscribe: (listener: () => void) => () => void;
  dispatch: (action: DemoAction) => void;
}

function createStore(initialState: DemoState): DemoStore {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispatch: action => {
      const next = demoReducer(state, action);
      if (next === state) return;
      state = next;
      // Copy first: a listener may unsubscribe while we are notifying.
      for (const listener of [...listeners]) listener();
    },
  };
}

const StoreContext = createContext<DemoStore | null>(null);
const ActionsContext = createContext<DemoActions | null>(null);

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

/**
 * Both provider values are created once, so mounting the provider never
 * re-renders its children; each subscriber re-renders itself when the store
 * notifies and its snapshot actually changed.
 */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createStore(createInitialState()));
  const actions = useMemo(() => createDemoActions(store.dispatch), [store]);
  return (
    <StoreContext.Provider value={store}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StoreContext.Provider>
  );
}

function useStore(): DemoStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('Demo hooks must be used inside <DemoProvider>.');
  }
  return store;
}

/** Requires `<DemoProvider>` (mounted by the root layout). Re-renders on every change. */
export function useDemo(): DemoContextValue {
  const store = useStore();
  const actions = useContext(ActionsContext);
  if (!actions) {
    throw new Error('Demo hooks must be used inside <DemoProvider>.');
  }
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  return { state, dispatch: store.dispatch, actions };
}

/** Stable dispatch for actions that have no `actions` helper (e.g. field monitoring). */
export function useDemoDispatch(): DemoStore['dispatch'] {
  return useStore().dispatch;
}

/** Full state. Prefer `useDemoSlices` when a screen reads only some slices. */
export function useDemoState(): DemoState {
  return useDemo().state;
}

/** The action bag is stable for the provider's lifetime, so this never re-renders. */
export function useDemoActions(): DemoActions {
  const actions = useContext(ActionsContext);
  if (!actions) throw new Error('Demo hooks must be used inside <DemoProvider>.');
  return actions;
}

/** The selected locale only — `useT()` subscribers ignore every other action. */
export function useLocale(): DemoState['locale'] {
  const store = useStore();
  const getSnapshot = () => store.getState().locale;
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

type SliceKey = keyof DemoState;

/**
 * Subscribe to a subset of the demo state. The returned object is rebuilt only
 * when one of the requested slices changes identity; unrelated dispatches
 * notify the store but re-render nothing here.
 *
 * ```tsx
 * const state = useDemoSlices(['plan', 'farm']);
 * ```
 */
export function useDemoSlices<K extends SliceKey>(keys: readonly K[]): Pick<DemoState, K> {
  const store = useStore();
  // Callers pass a fresh array literal each render, so the slice list is
  // normalised to a string and parsed back once per distinct list. That keeps
  // `getSnapshot` referentially stable, so React never re-subscribes on render.
  const keysKey = keys.join(',');
  const sliceKeys = useMemo(() => keysKey.split(',') as K[], [keysKey]);
  const cache = useRef<{ key: string; state: DemoState; value: Pick<DemoState, K> } | null>(null);

  const getSnapshot = useCallback((): Pick<DemoState, K> => {
    const state = store.getState();
    const previous = cache.current;
    if (previous && previous.key === keysKey) {
      let unchanged = true;
      for (const key of sliceKeys) {
        if (previous.state[key] !== state[key]) {
          unchanged = false;
          break;
        }
      }
      if (unchanged) {
        // Advance the comparison base so the next check compares adjacent states.
        previous.state = state;
        return previous.value;
      }
    }
    const value: Partial<DemoState> = {};
    for (const key of sliceKeys) {
      value[key] = state[key] as never;
    }
    const snapshot = value as Pick<DemoState, K>;
    cache.current = { key: keysKey, state, value: snapshot };
    return snapshot;
  }, [store, sliceKeys, keysKey]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

/** One-level equality for selectors that build a small object of primitives. */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }
  return true;
}

// External-store snapshots need a mutable cache, separate from React render
// state. Each selector/equality pair gets its own closure for concurrent reads.
function createSelectorSnapshot<T>(
  store: DemoStore,
  selector: (state: DemoState) => T,
  isEqual: (a: T, b: T) => boolean,
): () => T {
  let previous: { state: DemoState; value: T } | null = null;
  return () => {
    const state = store.getState();
    if (previous?.state === state) return previous.value;
    const next = selector(state);
    const value = previous && isEqual(previous.value, next) ? previous.value : next;
    previous = { state, value };
    return value;
  };
}

/**
 * Selector subscription with a cached snapshot. `isEqual` defaults to
 * `Object.is`, so selectors that build objects should pass `shallowEqual` or
 * select primitives.
 */
export function useDemoSelector<T>(
  selector: (state: DemoState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const store = useStore();
  const getSnapshot = useMemo(
    () => createSelectorSnapshot(store, selector, isEqual),
    [store, selector, isEqual],
  );
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
