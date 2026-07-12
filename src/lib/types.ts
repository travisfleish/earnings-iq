export type Sentiment = "positive" | "negative" | "neutral";
export type ThemeStatus = "new" | "recurring" | "fading";
export type Rating = "Buy" | "Hold" | "Sell" | "Mixed";

export interface CompanyProfile {
  ticker: string;
  name: string;
  sector: string;
  marketCap: string;
  price: number;
  change: number;
  changePct: number;
  earningsDate: string;
  earningsQuarter: string;
}

export interface PriceTarget {
  current: number;
  average: number;
  high: number;
  low: number;
  analysts: number;
  rating: Rating;
}

export interface EarningsReaction {
  oneDay: number;
  fiveDay: number;
  sinceEarnings: number;
  reasonSummary: string;
  marketReaction: string;
}

export interface EarningsTheme {
  title: string;
  explanation: string;
  evidence: string;
  sentiment: Sentiment;
  status: ThemeStatus;
}

export interface ManagementNarrative {
  coreStory: string;
  growthDrivers: string[];
  profitabilityStory: string;
  strategicPriorities: string[];
  confidenceLevel: "High" | "Medium" | "Low";
  toneChange: string;
}

export interface AnalystQA {
  topConcerns: string[];
  pushedTopics: string[];
  repeatedQuestions: string[];
  strongestAnswers: string[];
  weakestAnswers: string[];
}

export interface BullBearCase {
  mainArgument: string;
  points: string[];
  catalysts?: string[];
  risks?: string[];
  analystView: string;
}

export interface QoQComparison {
  increasing: string[];
  decreasing: string[];
  newThemes: string[];
  droppedThemes: string[];
  repeatedPhrases: string[];
  kpiChanges: string;
  guidanceChanges: string;
  analystSentimentChange: string;
}

export interface KeyMetric {
  label: string;
  value: string;
  change?: string;
  sentiment?: Sentiment;
}

export interface Quote {
  speaker: string;
  role: string;
  topic: string;
  quote: string;
  whyItMatters: string;
}

export interface WatchItem {
  category: "Metric" | "Theme" | "Risk" | "Question" | "Catalyst";
  item: string;
}

export interface Scorecard {
  overall: number; // 0-100
  managementConfidence: number; // 0-10
  analystSkepticism: number; // 0-10
  marginStory: number; // 0-10
  demandLanguage: number; // 0-10
  guidanceTone: Sentiment;
  headline: string;
}

export interface EarningsAnalysis {
  /** True when the analysis was synthesized (no curated dataset for this ticker). */
  isPreview?: boolean;
  profile: CompanyProfile;
  priceTarget: PriceTarget;
  reaction: EarningsReaction;
  callSummary: string;
  sentimentScore: number; // -100 to 100
  themes: EarningsTheme[];
  narrative: ManagementNarrative;
  qa: AnalystQA;
  bull: BullBearCase;
  bear: BullBearCase;
  qoq: QoQComparison;
  metrics: KeyMetric[];
  quotes: Quote[];
  watchlist: WatchItem[];
  scorecard?: Scorecard;
}
