import { useQuery } from '@tanstack/react-query';
import type { MatchCard } from '@/entities/fixture';
import { api } from '@/shared/api';

/** Live match + recently finished World Cup matches. Refetches so the live score stays current. */
export function useMatchList() {
  return useQuery<MatchCard[]>({
    queryKey: ['matches'],
    queryFn: () => api.getMatches(),
    refetchInterval: 5_000,
  });
}
