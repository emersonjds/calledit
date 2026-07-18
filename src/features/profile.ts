import { useQuery } from "@tanstack/react-query";
import type { Prediction } from "@/entities/prediction";
import { api, type LeaderboardDto, type ProfileDto } from "@/shared/api";
import { useSession } from "@/store/session";

export function useProfile() {
  const address = useSession((state) => state.address);
  return useQuery<ProfileDto>({
    queryKey: ["me", address],
    queryFn: () => api.getProfile(address as string),
    enabled: address !== null,
  });
}

export function useHistory() {
  const address = useSession((state) => state.address);
  return useQuery<Prediction[]>({
    queryKey: ["history", address],
    queryFn: () => api.getHistory(address as string),
    enabled: address !== null,
    refetchInterval: 2000,
  });
}

export function useLeaderboard() {
  const address = useSession((state) => state.address);
  return useQuery<LeaderboardDto>({
    queryKey: ["leaderboard", address],
    queryFn: () => api.getLeaderboard(address ?? ""),
  });
}
