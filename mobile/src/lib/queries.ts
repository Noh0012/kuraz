import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AnswerReveal,
  AttemptResult,
  AttemptSession,
  Bookmarks,
  ChapterQuestions,
  ContinueWatching,
  Grade,
  HomeData,
  Me,
  PackagesList,
  PurchaseResult,
  QuestionOfTheDay,
  SearchResults,
  SubjectQbank,
  SubjectSummary,
  SubjectVideos,
  TestDetail,
  TestsList,
  TestType,
  VideoDetail,
} from '@/types/contracts';
import { api, ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
    },
  },
});

export const keys = {
  me: ['me'] as const,
  home: ['home'] as const,
  subjects: ['subjects'] as const,
  subjectVideos: (id: string) => ['subject-videos', id] as const,
  video: (id: string) => ['video', id] as const,
  continue: ['continue'] as const,
  subjectQbank: (id: string) => ['subject-qbank', id] as const,
  chapterQuestions: (id: string) => ['chapter-questions', id] as const,
  qotd: ['qotd'] as const,
  tests: (type: TestType) => ['tests', type] as const,
  test: (id: string) => ['test', id] as const,
  attemptResult: (id: string) => ['attempt-result', id] as const,
  packages: ['packages'] as const,
  bookmarks: ['bookmarks'] as const,
  search: (q: string) => ['search', q] as const,
};

export const useGrades = () => useQuery({ queryKey: ['grades'], queryFn: () => api<Grade[]>('/grades'), staleTime: Infinity });
export const useMe = () => useQuery({ queryKey: keys.me, queryFn: () => api<Me>('/me') });
export const useHome = (enabled = true) => useQuery({ queryKey: keys.home, queryFn: () => api<HomeData>('/home'), enabled });
export const useSubjects = () => useQuery({ queryKey: keys.subjects, queryFn: () => api<SubjectSummary[]>('/subjects') });
export const useSubjectVideos = (id: string) =>
  useQuery({ queryKey: keys.subjectVideos(id), queryFn: () => api<SubjectVideos>(`/subjects/${id}/videos`) });
export const useVideo = (id: string) => useQuery({ queryKey: keys.video(id), queryFn: () => api<VideoDetail>(`/videos/${id}`) });
export const useContinue = () =>
  useQuery({ queryKey: keys.continue, queryFn: () => api<ContinueWatching | null>('/videos/continue') });
export const useSubjectQbank = (id: string) =>
  useQuery({ queryKey: keys.subjectQbank(id), queryFn: () => api<SubjectQbank>(`/subjects/${id}/qbank`) });
export const useChapterQuestions = (id: string) =>
  useQuery({ queryKey: keys.chapterQuestions(id), queryFn: () => api<ChapterQuestions>(`/qbank/chapters/${id}/questions`) });
export const useQotd = () => useQuery({ queryKey: keys.qotd, queryFn: () => api<QuestionOfTheDay>('/qotd') });
export const useTests = (type: TestType) => useQuery({ queryKey: keys.tests(type), queryFn: () => api<TestsList>(`/tests?type=${type}`) });
export const useTest = (id: string) => useQuery({ queryKey: keys.test(id), queryFn: () => api<TestDetail>(`/tests/${id}`) });
export const useAttemptResult = (id: string) =>
  useQuery({ queryKey: keys.attemptResult(id), queryFn: () => api<AttemptResult>(`/attempts/${id}`) });
export const usePackages = () => useQuery({ queryKey: keys.packages, queryFn: () => api<PackagesList>('/packages') });
export const useBookmarks = () => useQuery({ queryKey: keys.bookmarks, queryFn: () => api<Bookmarks>('/bookmarks') });
export const useSearch = (q: string) =>
  useQuery({
    queryKey: keys.search(q),
    queryFn: () => api<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
    placeholderData: (prev) => prev,
  });

/** Answers a QBank question; the reveal is merged into every cached copy of it. */
export function useAnswerQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, option }: { questionId: string; option: string }) =>
      api<AnswerReveal>(`/questions/${questionId}/answer`, { method: 'POST', body: { selected_option: option } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.subjects });
      qc.invalidateQueries({ queryKey: ['subject-qbank'] });
      qc.invalidateQueries({ queryKey: keys.bookmarks });
    },
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id, on }: { type: 'video' | 'question'; id: string; on: boolean }) =>
      on
        ? api('/bookmarks', { method: 'POST', body: { item_type: type, item_id: id } })
        : api(`/bookmarks/${type}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bookmarks });
      qc.invalidateQueries({ queryKey: ['subject-videos'] });
      qc.invalidateQueries({ queryKey: ['chapter-questions'] });
      qc.invalidateQueries({ queryKey: ['video'] });
      qc.invalidateQueries({ queryKey: keys.home });
    },
  });
}

export function usePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (packageId: string) =>
      api<PurchaseResult>('/subscriptions', { method: 'POST', body: { package_id: packageId } }),
    // Locks change everywhere after a purchase.
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Pick<Me, 'full_name' | 'phone' | 'school' | 'region' | 'city'>> & { grade_id?: number }) =>
      api<Me>('/me', { method: 'PATCH', body: patch }),
    onSuccess: (me, patch) => {
      qc.setQueryData(keys.me, me);
      // Switching grade changes every list in the app.
      if (patch.grade_id !== undefined) qc.invalidateQueries();
    },
  });
}

export function useStartAttempt() {
  return useMutation({
    mutationFn: (testId: string) => api<AttemptSession>(`/tests/${testId}/attempts`, { method: 'POST' }),
  });
}
