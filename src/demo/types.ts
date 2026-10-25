import type { RegisteredField, PestReport } from '../features/tools/satelliteProvider';
import type { StringKey } from '../locales/en';

export type { StringKey };

export type Locale = 'en' | 'hi' | 'mr' | 'gu' | 'ta' | 'te';

export type WaterAvailability = 'rainfed' | 'limited' | 'reliable';

export type OtpStatus = 'idle' | 'sending' | 'verifying' | 'success' | 'error';

export type StageId = 'land' | 'seed' | 'preparation' | 'nutrition' | 'harvest' | 'selling';

export type StageStatus = 'completed' | 'current' | 'locked';

export type ObservationStatus = 'reported' | 'reviewed' | 'confirmed';

export type CommunityFilter = 'nearby' | 'crop' | 'week';

export type ConsentKey = 'approximateLocation' | 'communitySharing' | 'notifications';

export type ToolKind = 'soil' | 'cropPhoto' | 'grainQuality' | 'grainId' | 'forecast' | 'market' | 'satellite';

export type SoilParamKey =
  | 'ph'
  | 'organicCarbon'
  | 'electricalConductivity'
  | 'nitrogen'
  | 'phosphorus'
  | 'potassium'
  | 'sulphur'
  | 'zinc'
  | 'iron'
  | 'copper'
  | 'manganese'
  | 'boron';

export interface PlanStage {
  id: StageId;
  ordinal: '01' | '02' | '03' | '04' | '05' | '06';
  status: StageStatus;
  titleKey: StringKey;
  captionKey: StringKey;
  /** Farmer-entered seed quote in ₹/kg. `null` means unknown. */
  quotePerKg: number | null;
  /** Selected seed option id from the fixture shortlist. `null` means not chosen yet. */
  seedId: string | null;
}

export interface PlanChange {
  id: 'storage' | 'seed' | 'resources';
  titleKey: StringKey;
  detailKey: StringKey;
}

export interface PlanRevisionDraft {
  fromBudget: number;
  toBudget: number;
  delta: number;
  changes: PlanChange[];
}

export interface AssessmentDraft {
  farmName: string;
  areaAcres: number | null;
  district: string;
  season: string;
  budget: number | null;
  water: WaterAvailability;
}

export interface ProfileDraft {
  farmerName: string;
  district: string;
  stateName: string;
  farmName: string;
  areaAcres: number | null;
  water: WaterAvailability;
  budget: number | null;
}

export interface SoilResult {
  crop: string;
  units: Partial<Record<SoilParamKey, string>>;
  sampleDate: string;
  entered: { key: SoilParamKey; value: string }[];
  enteredCount: number;
  totalCount: number;
  createdAt: number;
}

export interface SoilState {
  units: Partial<Record<SoilParamKey, string>>;
  crop: string;
  sampleDate: string;
  values: Partial<Record<SoilParamKey, string>>;
  showAdditional: boolean;
  result: SoilResult | null;
  importDraft: boolean;
  imported: boolean;
}

export interface MarketCosts {
  transport: number | null;
  handling: number | null;
  fees: number | null;
}

export interface MarketQuote {
  id: 'lasalgaon' | 'nashik' | 'pimpalgaon';
  name: string;
  pricePerQuintal: number;
  costs: MarketCosts;
  /** Source date for the demo quotes. */
  quotedOn: string;
}

export interface MarketState {
  commodity: string;
  grade: string;
  quantityQuintals: number;
  quotes: MarketQuote[];
}

export interface Observation {
  id: string;
  titleKey: StringKey;
  detailKey: StringKey;
  status: ObservationStatus;
  district: string;
  crop: string;
  distanceKm: number;
  hoursAgo: number;
  photoId: string | null;
}

export interface ObservationDraft {
  type: string;
  crop: string;
  observedLabel: string;
  district: string;
  useApproximateLocation: boolean;
  photoId: string | null;
  notes: string;
}

export interface ToolHistoryEntry {
  id: string;
  tool: ToolKind;
  labelKey: StringKey;
  createdAt: number;
  summary: string;
}

export interface FarmSoilTest {
  crop?: string;
  units?: Partial<Record<SoilParamKey, string>>;
  sampleDate: string;
  values: Partial<Record<SoilParamKey, string>>;
}

export interface DemoState {
  deviceLocation: { latitude: number; longitude: number; accuracy: number | null; capturedAt: number } | null;
  locale: Locale;
  onboarding: {
    mobile: string;
    otpStatus: OtpStatus;
    otpAttempts: number;
    signedIn: boolean;
    completed: boolean;
  };
  farm: {
    farmerName: string;
    initials: string;
    district: string;
    stateName: string;
    farmName: string;
    areaAcres: number;
    crop: string;
    season: string;
    water: WaterAvailability;
    budget: number;
    soilTest: FarmSoilTest | null;
  };
  plan: {
    exists: boolean;
    version: number;
    budget: number;
    committedCost: number;
    stages: PlanStage[];
    revisionDraft: PlanRevisionDraft | null;
    revisionHistory: { version: number; budget: number; delta: number }[];
  };
  assessmentDraft: AssessmentDraft | null;
  profileDraft: ProfileDraft | null;
  soil: SoilState;
  market: MarketState;
  community: {
    filter: CommunityFilter;
    feed: Observation[];
    draft: ObservationDraft;
    submittedIds: string[];
    lastSubmittedId: string | null;
  };
  consents: Record<ConsentKey, boolean>;
  monitoring: { fields: RegisteredField[]; reports: PestReport[] };
  toolHistory: ToolHistoryEntry[];
}

export type DemoAction =
  | { type: 'onboarding/details'; name: string; district: string; stateName: string; crop: string }
  | { type: 'onboarding/location'; location: DemoState['deviceLocation'] }
  | { type: 'monitoring/field'; field: RegisteredField }
  | { type: 'monitoring/report'; report: PestReport }
  | { type: 'monitoring/withdraw'; id: string }
  | { type: 'locale/set'; locale: Locale }
  | { type: 'onboarding/mobile'; digits: string }
  | { type: 'onboarding/otpSending' }
  | { type: 'onboarding/otpVerifying' }
  | { type: 'onboarding/otpSuccess' }
  | { type: 'onboarding/otpFailed' }
  | { type: 'onboarding/otpReset' }
  | { type: 'onboarding/complete' }
  /** Dummy Google sign-in: fills the demo account and signs in, in one update. */
  | { type: 'onboarding/googleSignIn'; location: boolean }
  | { type: 'onboarding/signOut' }
  | { type: 'demo/reset' }
  | { type: 'plan/startFirstVisit' }
  | { type: 'assessment/begin' }
  | { type: 'assessment/update'; patch: Partial<AssessmentDraft> }
  | { type: 'assessment/cancel' }
  | { type: 'assessment/save' }
  | { type: 'plan/revisionBegin' }
  | { type: 'plan/revisionCancel' }
  | { type: 'plan/revisionConfirm' }
  | { type: 'plan/stageQuote'; stageId: StageId; quotePerKg: number | null }
  | { type: 'plan/stageSeed'; stageId: StageId; seedId: string | null }
  | { type: 'plan/revisionBudget'; budget: number | null }
  | { type: 'plan/stageDone'; stageId: StageId }
  | { type: 'soil/value'; key: SoilParamKey; value: string }
  | { type: 'soil/unit'; key: SoilParamKey; unit: string }
  | { type: 'soil/clear'; key: SoilParamKey }
  | { type: 'soil/toggleAdditional' }
  | { type: 'soil/context'; patch: { crop?: string; sampleDate?: string } }
  | { type: 'soil/analyze' }
  | { type: 'soil/importBegin' }
  | { type: 'soil/importCancel' }
  | { type: 'soil/importConfirm'; keys?: SoilParamKey[] }
  | { type: 'market/quantity'; quintals: number }
  | { type: 'market/cost'; marketId: MarketQuote['id']; field: keyof MarketCosts; value: number | null }
  | { type: 'community/filter'; filter: CommunityFilter }
  | { type: 'community/draft'; patch: Partial<ObservationDraft> }
  | { type: 'community/locationConsent'; value: boolean }
  | { type: 'community/photo'; photoId: string | null }
  | { type: 'community/submit' }
  | { type: 'community/draftReset' }
  | { type: 'profile/editBegin' }
  | { type: 'profile/editUpdate'; patch: Partial<ProfileDraft> }
  | { type: 'profile/editCancel' }
  | { type: 'profile/editSave' }
  | { type: 'consent/set'; key: ConsentKey; value: boolean }
  | { type: 'tool/record'; tool: ToolKind; labelKey: StringKey; summary: string }
  | { type: 'tool/clear' };

export interface DemoActions {
  setLocale: (locale: Locale) => void;
  setMobile: (digits: string) => void;
  otpSending: () => void;
  otpVerifying: () => void;
  otpSuccess: () => void;
  otpFailed: () => void;
  otpReset: () => void;
  completeOnboarding: () => void;
  signOut: () => void;
  resetDemo: () => void;
  startFirstVisit: () => void;
  beginAssessment: () => void;
  updateAssessment: (patch: Partial<AssessmentDraft>) => void;
  cancelAssessment: () => void;
  saveAssessment: () => void;
  beginRevision: () => void;
  cancelRevision: () => void;
  confirmRevision: () => void;
  setStageQuote: (stageId: StageId, quotePerKg: number | null) => void;
  setStageSeed: (stageId: StageId, seedId: string | null) => void;
  setRevisionBudget: (budget: number | null) => void;
  markStageDone: (stageId: StageId) => void;
  setSoilValue: (key: SoilParamKey, value: string) => void;
  setSoilUnit: (key: SoilParamKey, unit: string) => void;
  clearSoilValue: (key: SoilParamKey) => void;
  toggleSoilAdditional: () => void;
  setSoilContext: (patch: { crop?: string; sampleDate?: string }) => void;
  analyzeSoil: () => void;
  beginSoilImport: () => void;
  cancelSoilImport: () => void;
  /** Imports only the reviewed, populated fields (defaults to every populated field). */
  confirmSoilImport: (keys?: SoilParamKey[]) => void;
  setMarketQuantity: (quintals: number) => void;
  setMarketCost: (marketId: MarketQuote['id'], field: keyof MarketCosts, value: number | null) => void;
  setCommunityFilter: (filter: CommunityFilter) => void;
  updateObservation: (patch: Partial<ObservationDraft>) => void;
  setObservationLocationConsent: (value: boolean) => void;
  setObservationPhoto: (photoId: string | null) => void;
  submitObservation: () => void;
  resetObservationDraft: () => void;
  beginProfileEdit: () => void;
  updateProfileDraft: (patch: Partial<ProfileDraft>) => void;
  cancelProfileEdit: () => void;
  saveProfileEdit: () => void;
  setConsent: (key: ConsentKey, value: boolean) => void;
  recordToolUse: (tool: ToolKind, labelKey: StringKey, summary: string) => void;
  clearToolHistory: () => void;
}

export interface MarketRow {
  id: MarketQuote['id'];
  name: string;
  pricePerQuintal: number;
  costs: MarketCosts;
  costsTotal: number | null;
  net: number | null;
  incomplete: boolean;
}

export interface SoilSummary {
  entered: { key: SoilParamKey; value: string }[];
  enteredCount: number;
  totalCount: number;
  unknownCount: number;
}
