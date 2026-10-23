import type {
  DemoState,
  MarketQuote,
  Observation,
  ObservationDraft,
  PlanStage,
  SoilParamKey,
} from './types';
import { stageCaptionKeys, stageTitleKeys } from './stage-keys';

export const DEMO_OTP_CODE = '526448';
export const OTP_RESEND_SECONDS = 24;
export const SOIL_PARAMS: SoilParamKey[] = [
  'ph',
  'organicCarbon',
  'electricalConductivity',
  'nitrogen',
  'phosphorus',
  'potassium',
  'sulphur',
  'zinc',
  'iron',
  'copper',
  'manganese',
  'boron',
];

export const MARKET_COST_KEYS = ['transport', 'handling', 'fees'] as const;

const stages = (): PlanStage[] => [
  {
    id: 'land',
    ordinal: '01',
    status: 'completed',
    titleKey: stageTitleKeys.land,
    captionKey: stageCaptionKeys.land.completed,
    quotePerKg: null,
    seedId: null,
  },
  {
    id: 'seed',
    ordinal: '02',
    status: 'current',
    titleKey: stageTitleKeys.seed,
    captionKey: stageCaptionKeys.seed.current,
    quotePerKg: null,
    seedId: null,
  },
  {
    id: 'preparation',
    ordinal: '03',
    status: 'locked',
    titleKey: stageTitleKeys.preparation,
    captionKey: stageCaptionKeys.preparation.locked,
    quotePerKg: null,
    seedId: null,
  },
  {
    id: 'nutrition',
    ordinal: '04',
    status: 'locked',
    titleKey: stageTitleKeys.nutrition,
    captionKey: stageCaptionKeys.nutrition.locked,
    quotePerKg: null,
    seedId: null,
  },
  {
    id: 'harvest',
    ordinal: '05',
    status: 'locked',
    titleKey: stageTitleKeys.harvest,
    captionKey: stageCaptionKeys.harvest.locked,
    quotePerKg: null,
    seedId: null,
  },
  {
    id: 'selling',
    ordinal: '06',
    status: 'locked',
    titleKey: stageTitleKeys.selling,
    captionKey: stageCaptionKeys.selling.locked,
    quotePerKg: null,
    seedId: null,
  },
];

const marketQuotes = (): MarketQuote[] => [
  {
    id: 'lasalgaon',
    name: 'Lasalgaon',
    pricePerQuintal: 2520,
    costs: { transport: 600, handling: 100, fees: 150 },
    quotedOn: '2026-10-12',
  },
  {
    id: 'nashik',
    name: 'Nashik',
    pricePerQuintal: 2560,
    costs: { transport: 1100, handling: 100, fees: 150 },
    quotedOn: '2026-10-12',
  },
  {
    id: 'pimpalgaon',
    name: 'Pimpalgaon',
    pricePerQuintal: 2500,
    costs: { transport: null, handling: 100, fees: 150 },
    quotedOn: '2026-10-12',
  },
];

const observationDraft = (): ObservationDraft => ({
  type: 'compose.type.symptoms',
  crop: 'Wheat',
  observedLabel: 'Today, 8:30 am',
  district: 'Nashik, Maharashtra',
  useApproximateLocation: false,
  photoId: null,
  notes: '',
});

const feed = (): Observation[] => [
  {
    id: 'obs-leafspots',
    titleKey: 'community.item.leafspots.title',
    detailKey: 'community.item.leafspots.detail',
    status: 'reported',
    district: 'Nashik',
    crop: 'Wheat',
    distanceKm: 3,
    hoursAgo: 2,
    photoId: null,
  },
  {
    id: 'obs-waterlogging',
    titleKey: 'community.item.waterlogging.title',
    detailKey: 'community.item.waterlogging.detail',
    status: 'reviewed',
    district: 'Nashik',
    crop: 'Wheat',
    distanceKm: 6,
    hoursAgo: 5,
    photoId: null,
  },
  {
    id: 'obs-verified',
    titleKey: 'community.item.verified.title',
    detailKey: 'community.item.verified.detail',
    status: 'confirmed',
    district: 'Nashik',
    crop: 'Wheat',
    distanceKm: 4,
    hoursAgo: 30,
    photoId: null,
  },
];

/** Every fixture in the reference board. Everything else derives from this. */
export function createInitialState(): DemoState {
  return {
    deviceLocation: null,
    locale: 'en',
    onboarding: {
      mobile: '9876526448',
      otpStatus: 'idle',
      otpAttempts: 0,
      signedIn: false,
      completed: false,
    },
    farm: {
      farmerName: 'Asha Patil',
      initials: 'AP',
      district: 'Nashik',
      stateName: 'Maharashtra',
      farmName: 'East field',
      areaAcres: 2,
      crop: 'Wheat',
      season: 'Rabi',
      water: 'limited',
      budget: 30000,
      soilTest: null,
    },
    plan: {
      exists: true,
      version: 1,
      budget: 30000,
      committedCost: 5200,
      stages: stages(),
      revisionDraft: null,
      revisionHistory: [],
    },
    assessmentDraft: null,
    profileDraft: null,
    soil: {
      units: { organicCarbon: '%', electricalConductivity: 'dS/m' },
      crop: 'Wheat',
      sampleDate: '2026-10-12',
      values: { ph: '7.4', organicCarbon: '0.6' },
      showAdditional: false,
      result: null,
      importDraft: false,
      imported: false,
    },
    market: {
      commodity: 'Wheat',
      grade: 'FAQ',
      quantityQuintals: 10,
      quotes: marketQuotes(),
    },
    community: {
      filter: 'nearby',
      feed: feed(),
      draft: observationDraft(),
      submittedIds: [],
      lastSubmittedId: null,
    },
    consents: {
      approximateLocation: false,
      communitySharing: false,
      notifications: false,
    },
    monitoring: { fields: [], reports: [] },
    toolHistory: [],
  };
}

export const initialDemoState: DemoState = createInitialState();

export { observationDraft, feed };
