// ============================================================
// WattZup — TypeScript Type Definitions
// ============================================================
// This interface was created using Generative AI
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string;
  monthly_budget: number;
  alert_threshold: number;
  household_size: number;
  notify_energy_alerts: boolean;
  notify_weekly_reports: boolean;
  notify_community: boolean;
  notify_badges: boolean;
  voice_enabled: boolean;
  created_at: string;
  updated_at: string;
}
// This interface was created using Generative AI
export interface Appliance {
  id: string;
  user_id: string;
  appliance_type: ApplianceType;
  custom_name: string | null;
  wattage: number;
  quantity: number;
  is_always_on: boolean;
  default_daily_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
// This type was created using Generative AI
export type ApplianceType =
  | 'ac' | 'refrigerator' | 'electric_fan' | 'washing_machine'
  | 'rice_cooker' | 'microwave' | 'tv' | 'computer'
  | 'water_heater' | 'lighting' | 'flat_iron' | 'water_dispenser'
  | 'router' | 'other';
// This interface was created using Generative AI
export interface NewAppliance {
  appliance_type: ApplianceType;
  custom_name?: string;
  wattage: number;
  quantity?: number;
  is_always_on?: boolean;
  default_daily_hours?: number;
}
// This interface was created using Generative AI
export interface UsageLog {
  id: string;
  user_id: string;
  appliance_id: string;
  date: string;
  hours_used: number;
  estimated_kwh: number;
  source: 'manual' | 'voice' | 'auto';
  created_at: string;
}
// This interface was created using Generative AI
export interface NewUsageLog {
  user_id: string;
  appliance_id: string;
  date?: string;
  hours_used: number;
  source?: 'manual' | 'voice' | 'auto';
}
// This interface was created using Generative AI
export interface EnergyRate {
  id: string;
  provider: string;
  rate_per_kwh: number;
  effective_date: string;
  created_at: string;
}
// This interface was created using Generative AI
export interface AiInsight {
  id: string;
  user_id: string;
  insight_type: 'optimization' | 'alert' | 'achievement' | 'forecast';
  title: string;
  description: string;
  potential_savings: number | null;
  is_read: boolean;
  expires_at: string;
  created_at: string;
}
// This interface was created using Generative AI
export interface Achievement {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  earned_at: string;
}
// This interface was created using Generative AI
export type BadgeType =
  | 'first_week_under_budget' | 'seven_day_streak' | 'thirty_day_streak'
  | 'off_peak_hero' | 'carbon_neutral' | 'master_saver'
  | '500kwh_saved' | 'community_champion';
// This interface was created using Generative AI
export interface CommunityTeam {
  id: string;
  name: string;
  region: string | null;
  created_at: string;
  member_count?: number;
}
// This interface was created using Generative AI
export interface TeamMember {
  team_id: string;
  user_id: string;
  joined_at: string;
}
// This interface was created using Generative AI
export interface Challenge {
  id: string;
  title: string;
  team_a_id: string;
  team_b_id: string;
  team_a?: CommunityTeam;
  team_b?: CommunityTeam;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}
// This interface was created using Generative AI
export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  savings_percent: number;
  total_kwh: number;
}
// This interface was created using Generative AI
export interface DashboardData {
  totalKwh: number;
  totalCost: number;
  projectedBill: number;
  burnRate: number;
  budgetRemaining: number;
  budgetStatus: 'under' | 'warning' | 'over';
  dailyAvgCost: number;
  daysLeft: number;
  percentUsed: number;
  monthlyBudget: number;
}
// This interface was created using Generative AI
export interface WeeklyDataPoint {
  name: string;
  value: number;
  date: string;
}
// This interface was created using Generative AI
export interface MeralcoBill {
  id: string;
  user_id: string;
  billing_month: string; // 'YYYY-MM' format
  actual_kwh: number;
  actual_amount: number;
  our_estimated_kwh: number;
  our_estimated_amount: number;
  accuracy_percent: number;
  kwh_difference: number;
  amount_difference: number;
  created_at: string;
}
// This interface was created using Generative AI
export interface BillAccuracy {
  currentMonth: {
    estimated: number;
    estimatedKwh: number;
    billingMonth: string;
  };
  history: MeralcoBill[];
  avgAccuracy: number;
  trend: 'improving' | 'declining' | 'stable' | 'no_data';
}
// This interface was created using Generative AI
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
// This interface was created using Generative AI
export interface ParsedVoiceEntry {
  appliance_type: ApplianceType;
  appliance_id?: string;
  hours: number;
  date: string;
  appliance_name?: string;
}
// This interface was created using Generative AI
export interface VoiceParseResult {
  parsed_entries: ParsedVoiceEntry[];
  confirmation_text: string;
}
// This interface was created using Generative AI
export interface PredictionResult {
  predictedBill: number;
  confidence: { low: number; high: number };
  adjustmentFactors: { historical: number; weather: number; trend: number };
  dailyForecast: { date: string; predictedKwh: number }[];
}
// This interface was created using Generative AI
export interface BillBreakdown {
  generation: number;
  transmission: number;
  distribution: number;
  subsidies: number;
  governmentTaxes: number;
  totalRate: number;
  totalBill: number;
  totalKwh: number;
}
// This interface was created using Generative AI
export interface TemperatureInsight {
  currentTemp: number;
  avgTemp: number;
  heatIndex: string;
  acImpactPercent: number;
  acExtraCost: number;
  recommendation: string;
}
// This interface was created using Generative AI
export interface MonthlyEstimate {
  estimatedKwh: number;
  estimatedBill: number;
  confidenceLow: number;
  confidenceHigh: number;
  breakdown: BillBreakdown;
  topConsumers: { name: string; type: string; kwhPercent: number; monthlyCost: number }[];
  temperatureImpact: TemperatureInsight | null;
  comparisonVsLastMonth: { kwhChange: number; costChange: number; direction: 'up' | 'down' | 'same' };
  dailyAvgKwh: number;
  dailyAvgCost: number;
  daysRemaining: number;
  savingsPotential: number;
}
// This interface was created using Generative AI
export interface EnhancedInsightsData {
  monthlyEstimate: MonthlyEstimate;
  prediction: PredictionResult;
  insights: AiInsight[];
  achievements: Achievement[];
}
