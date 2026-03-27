/**
 * SL Academy Platform - TypeScript Types
 * Shared type definitions for the frontend
 */

// User and Authentication Types
export type UserRole = 'manager' | 'doctor';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  hospital_id: string;
  hospital_name?: string;
  is_focal_point?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
}

// Track and Lesson Types
export interface Track {
  id: string;
  hospital_id: string;
  title: string;
  description?: string;
  lesson_count?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Lesson {
  id: string;
  track_id: string;
  title: string;
  description?: string;
  video_url: string;
  duration_seconds: number;
  position: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LessonDetail extends Lesson {
  track?: Track;
  pre_test_questions_count?: number;
  post_test_questions_count?: number;
}

// Schedule and Shift Types
export type ShiftType = 'morning' | 'afternoon' | 'night';
export type ScheduleStatus = 'draft' | 'published';

export interface ScheduleSlot {
  id: string;
  schedule_id: string;
  doctor_id: string;
  doctor_email: string;
  slot_date: string; // YYYY-MM-DD
  shift: ShiftType;
  notes?: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  hospital_id: string;
  week_start: string; // YYYY-MM-DD (Monday)
  status: ScheduleStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  schedule_slots?: ScheduleSlot[];
}

export interface ScheduleSlotCreate {
  doctor_id: string;
  slot_date: string; // YYYY-MM-DD
  shift: ShiftType;
  notes?: string;
}

// Question and Test Types
export type QuestionType = 'pre' | 'post';

export interface Question {
  id: string;
  lesson_id: string;
  type: QuestionType;
  question_text: string;
  options: string[];
}

export interface TestAttemptAnswer {
  question_id: string;
  selected_option_index: number;
}

export interface TestAttemptCreate {
  lesson_id: string;
  type: QuestionType;
  answers: TestAttemptAnswer[];
}

export interface TestAttempt {
  id: string;
  profile_id: string;
  lesson_id: string;
  type: QuestionType;
  score: number;
  answers: Record<string, number>;
  created_at: string;
}

// Doubt Types
export type DoubtStatus = 'pending' | 'answered';

export interface DoubtCreate {
  lesson_id: string;
  text: string;
  image_url?: string;
}

export interface Doubt {
  id: string;
  profile_id: string;
  lesson_id: string;
  text: string;
  image_url?: string;
  status: DoubtStatus;
  answer?: string;
  answered_by?: string;
  answered_at?: string;
  ai_summary?: string;
  created_at: string;
  updated_at: string;
}

// Indicator Types
export interface Indicator {
  id: string;
  hospital_id: string;
  name: string;
  category: string;
  value: number;
  reference_date: string;
  unit?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IndicatorImportRow {
  name: string;
  category: string;
  value: number;
  reference_date: string;
  unit?: string;
  notes?: string;
}

export interface IndicatorImportError {
  row: number;
  error: string;
  data?: Record<string, any>;
}

export interface IndicatorImportResult {
  success_count: number;
  error_count: number;
  errors: IndicatorImportError[];
}

// AI Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantRequest {
  messages: ChatMessage[];
  context?: string;
}

export interface AssistantResponse {
  response: string;
  role: string;
  timestamp: string;
}

// AI Recommendation Types
export interface RecommendationRequest {
  lesson_id: string;
  pre_test_score: number;
  post_test_score: number;
}

export interface RecommendationItem {
  lesson_id: string;
  lesson_title: string;
  reason: string;
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
}

// API Response Types
export interface ApiError {
  message: string;
  status_code: number;
  details?: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// Form Types
export interface FormErrors {
  [key: string]: string;
}

// Video Progress Types
export interface VideoProgress {
  lesson_id: string;
  progress: number;
  completed: boolean;
  last_position: number;
  updated_at: string;
}
