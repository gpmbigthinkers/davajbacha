export type ThreatCategory =
  | "grooming"
  | "phishing"
  | "deepfake"
  | "kybersikana"
  | "oversharing";

export type ChatMessage = {
  sender: "user" | "other";
  name: string;
  message: string;
  timestamp?: string;
};

export type ScenarioOption = {
  id: string;
  label: string;
  feedback: string;
  principle: string;
  riskDelta: number;
  isSafe: boolean;
};

export type ScenarioInteractionMode = "multiple_choice" | "interactive_chat";

export type ScenarioChatConfig = {
  botName: string;
  maxTurns?: number;
};

export type ScenarioStep = {
  key: string;
  title: string;
  situation: string;
  question: string;
  options: ScenarioOption[];
  messages?: ChatMessage[];
  interactionMode?: ScenarioInteractionMode;
  chatConfig?: ScenarioChatConfig;
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
  matchedOptionId?: string;
};

export type BachavostBucket = {
  score: number;
  label: string;
  count: number;
  percentage: number;
};

export type FootprintQuestionId =
  | "bio"
  | "schoolLocation"
  | "livePosting"
  | "socialGraph"
  | "contactAccess";

export type FootprintQuestion = {
  id: FootprintQuestionId;
  label: string;
  description: string;
  placeholder: string;
};

export type FootprintVerificationAnswers = Record<FootprintQuestionId, string>;

export type FootprintVerificationRequest = {
  answers: FootprintVerificationAnswers;
};

export type FootprintSafetyLevel = "nizka" | "stredna" | "vysoka";
export type FootprintVerificationResult = {
  safetyScore: number;
  safetyLevel: FootprintSafetyLevel;
  profileLabel: string;
  riskyProfile: {
    summary: string;
    signals: string[];
  };
  saferProfile: {
    summary: string;
    replacements: string[];
  };
  advice: Array<{
    title: string;
    why: string;
  }>;
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
  averageBachavost: number;
  categories: DashboardCategory[];
  scoreDistribution: BachavostBucket[];
  riskAreas: string[];
  timeline: Array<{
    label: string;
    unsafeRate: number;
    offlineActivity: number;
  }>;
};

export type HomepageStats = {
  reduction: number;
  sessions: number;
  completion: number;
};
