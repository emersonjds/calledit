import { useQuery } from "@tanstack/react-query";
import type { Fixture } from "@/entities/fixture";
import { api } from "@/shared/api";

/** Upcoming World Cup fixtures (next 5). */
export function useUpcomingFixtures() {
  return useQuery<Fixture[]>({
    queryKey: ["fixtures"],
    queryFn: () => api.getUpcomingFixtures(),
    staleTime: 60_000,
  });
}
