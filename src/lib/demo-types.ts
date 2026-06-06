export type ThreatCategory =
  | "grooming"
  | "phishing"
  | "deepfake"
  | "kybersikana"
  | "oversharing";

export type ScenarioOption = {
  id: string;
  label: string;
  feedback: string;
  principle: string;
  riskDelta: number;
  isSafe: boolean;
};

export type ScenarioStep = {
  key: string;
  title: string;
  situation: string;
  question: string;
  options: ScenarioOption[];
};

export type ScenarioTemplate = {
  slug: string;
  title: string;
  category: ThreatCategory;
  summary: string;
  accent: string;
  steps: ScenarioStep[];
};

export type ScenarioFeedback = {
  attemptId?: string;
  isSafe: boolean;
  riskDelta: number;
  feedback: string;
  principle: string;
};

export type FootprintInput = {
  publicName: string;
  selectedSignals: string[];
};

export type FootprintRiskSummary = {
  riskScore: number;
  level: "nizke" | "stredne" | "vysoke";
  derivedRisks: string[];
  safeProfile: string[];
};

export type DashboardCategory = {
  category: ThreatCategory;
  label: string;
  errorRate: number;
  improvement: number;
  responses: number;
};

export type DashboardOverview = {
  updatedAt: string;
  sampleSize: number;
  completionRate: number;
  targetReduction: number;
  categories: DashboardCategory[];
  riskAreas: string[];
  timeline: Array<{
    label: string;
    unsafeRate: number;
    offlineActivity: number;
  }>;
};
