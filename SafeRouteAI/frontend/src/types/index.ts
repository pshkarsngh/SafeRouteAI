export interface HazardInfo {
  type: string;
  severity: "critical" | "warning" | "info";
  location: [number, number];
  description: string;
  confidence: number;
}

export interface IncidentInfo {
  title: string;
  source: string;
  severity: "critical" | "warning" | "info";
  date: string;
  description: string;
  url: string;
}

export interface RouteInfo {
  polyline: string;
  distance_m: number;
  duration_s: number;
  distance_str: string;
  duration_str: string;
}

export interface HazardSummary {
  [key: string]: {
    count: number;
    avg_confidence: number;
    severities: string[];
  };
}

export interface RouteAlternative {
  route_index: number;
  score: number;
  safety_score: number;
  rank_score: number;
  distance: string;
  duration: string;
  distance_m: number;
  duration_s: number;
  hazards: number;
  polyline: string;
  hazard_summary: HazardSummary;
  incidents?: IncidentInfo[];
}

export interface SafetyResponse {
  safety_score: number | null;
  recommended_path: [number, number][];
  hazards: HazardInfo[] | null;
  incidents?: IncidentInfo[];
  explanation: string;
  route_info?: RouteInfo | null;
}

export interface FullSafetyResponse extends SafetyResponse {
  alternatives: RouteAlternative[] | null;
  llm_response?: string;
  selected_route_index?: number;
  user_preferences_parsed?: {
    alpha: number;
    avoidClasses: string[];
    priority: string;
  };
}

export interface RouteFormData {
  start: string;
  destination: string;
  preferences: string;
}
