export interface DashboardStats {
  conversations: { value: number; percentChange: number };
  messages: { value: number; percentChange: number };
  messageLinkClicks: { value: number; percentChange: number };
  positiveFeedback: { value: number; percentChange: number };
  negativeFeedback: { value: number; percentChange: number };
  avgClickRate: { value: number; percentChange: number };
  countryCounts: Record<string, number>;
}
