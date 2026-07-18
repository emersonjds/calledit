import { useQuery } from '@tanstack/react-query';
import type { MatchSnapshot } from '@/entities/match';
import { api } from '@/shared/api';
import { useSession } from '@/store/session';

/** Live match feed — polled like an SSE stream (swap for real /scores/stream later). */
export function useMatchFeed() {
  const matchId = useSession((state) => state.matchId);
  return useQuery<MatchSnapshot>({
    queryKey: ['feed', matchId],
    queryFn: () => api.getFeed(matchId),
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });
}
