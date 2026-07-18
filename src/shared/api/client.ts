import type { MatchSnapshot } from "@/entities/match";
import type { MarketId, Prediction } from "@/entities/prediction";
import type { WalletAccount } from "@/entities/wallet";
import {
  historySchema,
  leaderboardSchema,
  matchSnapshotSchema,
  predictionSchema,
  profileSchema,
  walletAccountSchema,
  type LeaderboardDto,
  type ProfileDto,
} from "./schemas";
import type { z } from "zod";

const BASE = "/api";

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${body || res.statusText}`);
  }
  return schema.parse(await res.json());
}

export interface CommitPredictionInput {
  matchId: string;
  market: MarketId;
  stakeSol: number;
  address: string;
}

export const api = {
  connectWallet(provider: string): Promise<WalletAccount> {
    return request("/wallet/connect", walletAccountSchema, {
      method: "POST",
      body: JSON.stringify({ provider }),
    }) as Promise<WalletAccount>;
  },

  getFeed(matchId: string): Promise<MatchSnapshot> {
    return request(
      `/feed/${matchId}`,
      matchSnapshotSchema,
    ) as Promise<MatchSnapshot>;
  },

  commitPrediction(input: CommitPredictionInput): Promise<Prediction> {
    return request("/predictions", predictionSchema, {
      method: "POST",
      body: JSON.stringify(input),
    }) as Promise<Prediction>;
  },

  getPrediction(id: string): Promise<Prediction> {
    return request(
      `/predictions/${id}`,
      predictionSchema,
    ) as Promise<Prediction>;
  },

  getHistory(address: string): Promise<Prediction[]> {
    return request(
      `/predictions?address=${encodeURIComponent(address)}`,
      historySchema,
    ).then((result) => result.items as Prediction[]);
  },

  getProfile(address: string): Promise<ProfileDto> {
    return request(`/me?address=${encodeURIComponent(address)}`, profileSchema);
  },

  getLeaderboard(address: string): Promise<LeaderboardDto> {
    return request(
      `/leaderboard?address=${encodeURIComponent(address)}`,
      leaderboardSchema,
    );
  },
};
