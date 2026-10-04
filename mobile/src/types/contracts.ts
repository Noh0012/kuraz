// AUTO-GENERATED from backend/src/contracts.ts by `npm run contracts:sync` (in backend/). Do not edit.
// Response shapes of the Kuraz API (/v1).
// Copied verbatim to mobile/src/types/contracts.ts by `npm run contracts:sync`; edit only here.

export type ContentKind = 'videos' | 'qbank' | 'tests';
export type TestType = 'national' | 'mock' | 'unit';
export type Tier = 'basic' | 'premium';

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export interface Grade {
  id: number;
  name: string;
}

export interface Plan {
  package_id: string;
  name: string;
  tier: Tier;
  grade_id: number;
  includes: ContentKind[];
  /** End of the last paid period, renewals included. */
  expires_at: string;
}

export interface Me {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  grade: Grade | null;
  school: string | null;
  region: string | null;
  city: string | null;
  avatar_url: string | null;
  /** Best active plan for the current grade; null means "Free Plan". */
  plan: Plan | null;
}

export interface SubjectLite {
  id: string;
  name: string;
  icon: string;
  color: string;
  teacher_name: string | null;
  teacher_avatar_url: string | null;
}

export interface SubjectSummary extends SubjectLite {
  video_count: number;
  chapter_count: number;
  qbank: { answered: number; total: number };
}

export interface VideoProgress {
  position_seconds: number;
  completed: boolean;
}

export interface VideoCard {
  id: string;
  title: string;
  duration_seconds: number;
  thumbnail_url: string | null;
  is_free: boolean;
  locked: boolean;
  has_notes: boolean;
  subject: SubjectLite;
  chapter: { id: string; title: string };
  progress: VideoProgress | null;
}

export interface VideoListItem {
  id: string;
  title: string;
  duration_seconds: number;
  thumbnail_url: string | null;
  is_free: boolean;
  locked: boolean;
  has_notes: boolean;
  bookmarked: boolean;
  progress: VideoProgress | null;
}

export interface SubjectVideos {
  subject: SubjectLite;
  chapters: { id: string; title: string; videos: VideoListItem[] }[];
}

export interface VideoDetail extends VideoCard {
  description: string | null;
  source_url: string;
  notes_url: string | null;
  bookmarked: boolean;
  next: { id: string; title: string; locked: boolean } | null;
}

export interface ContinueWatching {
  video: VideoCard;
  remaining_seconds: number;
}

export interface QuestionOption {
  key: string;
  text: string;
}

/** Revealed only after the student has answered. */
export interface AnswerReveal {
  selected_option: string;
  is_correct: boolean;
  correct_option: string;
  explanation: string | null;
}

export interface PublicQuestion {
  id: string;
  stem: string;
  options: QuestionOption[];
  difficulty: number;
  bookmarked: boolean;
  attempt: AnswerReveal | null;
}

export interface QbankChapter {
  id: string;
  title: string;
  total: number;
  answered: number;
  correct: number;
  locked: boolean;
}

export interface SubjectQbank {
  subject: SubjectLite;
  chapters: QbankChapter[];
}

export interface ChapterQuestions {
  subject: SubjectLite;
  chapter: { id: string; title: string };
  questions: PublicQuestion[];
}

export interface QuestionOfTheDay {
  date: string;
  subject: SubjectLite;
  question: PublicQuestion;
}

export interface HomeData {
  plan: Plan | null;
  most_watched: VideoCard[];
  continue_watching: ContinueWatching | null;
  qotd: QuestionOfTheDay | null;
  free: { videos: number; questions: number };
}

export interface TestCard {
  id: string;
  type: TestType;
  title: string;
  subject_name: string | null;
  year_label: string | null;
  question_count: number;
  duration_minutes: number;
  is_free: boolean;
  locked: boolean;
  /** Set when the test opens on a future date (YYYY-MM-DD); null when it can be taken now. */
  opens_on: string | null;
  best: { score: number; total: number } | null;
  open_attempt_id: string | null;
}

export interface TestSection {
  title: string;
  tests: TestCard[];
}

export interface TestsList {
  type: TestType;
  sections: TestSection[];
}

export interface AttemptSummary {
  id: string;
  started_at: string;
  submitted_at: string | null;
  score: number | null;
  total: number | null;
}

export interface TestDetail extends TestCard {
  description: string | null;
  attempts: AttemptSummary[];
}

export interface AttemptQuestion {
  id: string;
  stem: string;
  options: QuestionOption[];
}

export interface AttemptSession {
  attempt: {
    id: string;
    test_id: string;
    started_at: string;
    deadline_at: string;
    answers: Record<string, string>;
  };
  test: { id: string; title: string; duration_minutes: number };
  questions: AttemptQuestion[];
  /** Lets the client correct for a skewed phone clock. */
  server_time: string;
}

export interface ReviewItem {
  question_id: string;
  stem: string;
  options: QuestionOption[];
  selected_option: string | null;
  correct_option: string;
  explanation: string | null;
  is_correct: boolean;
}

export interface AttemptResult {
  id: string;
  test: { id: string; title: string; type: TestType };
  started_at: string;
  submitted_at: string;
  score: number;
  total: number;
  /** True when the attempt was finalised after the deadline (late answers are ignored). */
  late: boolean;
  review: ReviewItem[];
}

export interface Package {
  id: string;
  name: string;
  tier: Tier;
  description: string | null;
  features: string[];
  price_etb: number;
  duration_days: number;
  includes: ContentKind[];
  /** When the user already owns it: end of the paid period. */
  active_until: string | null;
}

export interface PackagesList {
  grade: Grade;
  packages: Package[];
}

export interface Subscription {
  id: string;
  package: { id: string; name: string; tier: Tier; grade_id: number };
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  amount_etb: number;
  provider: string;
  created_at: string;
}

export interface PurchaseResult {
  subscription: Subscription;
  plan: Plan | null;
}

export interface BookmarkedQuestion extends PublicQuestion {
  subject: SubjectLite;
  chapter: { id: string; title: string } | null;
}

export interface Bookmarks {
  videos: VideoCard[];
  questions: BookmarkedQuestion[];
}

export interface SearchResults {
  videos: VideoCard[];
  chapters: { id: string; title: string; subject: SubjectLite; locked: boolean; question_count: number }[];
  tests: TestCard[];
}
