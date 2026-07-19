import { useQuery } from '@tanstack/react-query';
import type { MatchSnapshot } from '@/entities/match';
import { api } from '@/shared/api';
import { isDemo } from '@/shared/config';
import { useSession } from '@/store/session';

export function useMatchFeed() {
  const matchId = useSession((state) => state.matchId);
  return useQuery<MatchSnapshot>({
    queryKey: ['feed', matchId],
    queryFn: () => api.getFeed(matchId),
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });
}

/**
 * Kickoff (epoch ms) of the tracked fixture, or null if unknown. LIVE mode only:
 * the raw feed has no match clock, so kickoff + wall-clock is the only real
 * source of the running minute. Demo derives its clock from the mock engine.
 */
export function useLiveKickoff(): number | null {
  const matchId = useSession((state) => state.matchId);
  const { data } = useQuery({
    queryKey: ['fixtures'],
    queryFn: () => api.getUpcomingFixtures(),
    enabled: !isDemo(),
    staleTime: 60_000,
  });
  return data?.find((fixture) => fixture.id === matchId)?.kickoff ?? null;
}
