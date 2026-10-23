import type { DemoState, MarketRow, Observation, PlanStage, SoilSummary, StageId } from './types';
import { SOIL_PARAMS } from './fixtures';

export function selectRemainingBudget(state: DemoState): number {
  return Math.max(0, state.plan.budget - state.plan.committedCost);
}

/** Net proceeds are `null` whenever any cost is unknown — never treated as zero. */
export function marketRows(state: DemoState): MarketRow[] {
  const quantity = state.market.quantityQuintals;
  return state.market.quotes
    .map(quote => {
      const costs = quote.costs;
      const known = [costs.transport, costs.handling, costs.fees].filter(
        (value): value is number => typeof value === 'number',
      );
      const costsTotal = known.length === 3 ? known.reduce((sum, value) => sum + value, 0) : null;
      const net = costsTotal === null ? null : quote.pricePerQuintal * quantity - costsTotal;
      return {
        id: quote.id,
        name: quote.name,
        pricePerQuintal: quote.pricePerQuintal,
        costs,
        costsTotal,
        net,
        incomplete: costsTotal === null,
      };
    })
    .sort((a, b) => {
      if (a.net === null && b.net === null) return 0;
      if (a.net === null) return 1;
      if (b.net === null) return -1;
      return b.net - a.net;
    });
}

export const selectMarketRows = marketRows;

export function selectSoilSummary(state: DemoState): SoilSummary {
  const entered = SOIL_PARAMS.flatMap(key => {
    const value = state.soil.values[key];
    return value !== undefined && value.trim() !== '' ? [{ key, value: value.trim() }] : [];
  });
  return {
    entered,
    enteredCount: entered.length,
    totalCount: SOIL_PARAMS.length,
    unknownCount: SOIL_PARAMS.length - entered.length,
  };
}

export function selectFilteredFeed(state: DemoState): Observation[] {
  const { filter, feed } = state.community;
  return feed.filter(item => {
    if (filter === 'nearby') return item.distanceKm <= 10;
    if (filter === 'crop') return item.crop === state.farm.crop;
    return item.hoursAgo <= 168;
  });
}

export function selectStage(state: DemoState, id: StageId): PlanStage | undefined {
  return state.plan.stages.find(stage => stage.id === id);
}

export function selectCurrentStage(state: DemoState): PlanStage | undefined {
  return state.plan.stages.find(stage => stage.status === 'current');
}

export function selectIsAuthenticated(state: DemoState): boolean {
  return state.onboarding.signedIn && state.onboarding.completed;
}

export function selectStageIndex(state: DemoState, id: StageId): number {
  return state.plan.stages.findIndex(stage => stage.id === id);
}
