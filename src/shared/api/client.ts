import type { MatchSnapshot } from '@/entities/match';
import type { MarketId, Prediction } from '@/entities/prediction';
import type { WalletAccount, WalletOverview } from '@/entities/wallet';
import type { Fixture } from '@/entities/fixture';
import {
  fixturesSchema,
  historySchema,
  leaderboardSchema,
  matchSnapshotSchema,
  predictionSchema,
  profileSchema,
  walletAccountSchema,
  walletOverviewSchema,
  type LeaderboardDto,
  type ProfileDto,
} from './schemas';
import type { z } from 'zod';

const BASE = '/api';

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
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
  connectWallet(provider: string, address?: string): Promise<WalletAccount> {
    return request('/wallet/connect', walletAccountSchema, {
      method: 'POST',
      body: JSON.stringify({ provider, address }),
    }) as Promise<WalletAccount>;
  },

  getFeed(matchId: string): Promise<MatchSnapshot> {
    return request(`/feed/${matchId}`, matchSnapshotSchema) as Promise<MatchSnapshot>;
  },

  commitPrediction(input: CommitPredictionInput): Promise<Prediction> {
    return request('/predictions', predictionSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    }) as Promise<Prediction>;
  },

  getPrediction(id: string): Promise<Prediction> {
    return request(`/predictions/${id}`, predictionSchema) as Promise<Prediction>;
  },

  getHistory(address: string): Promise<Prediction[]> {
    return request(`/predictions?address=${encodeURIComponent(address)}`, historySchema).then(
      (result) => result.items as Prediction[],
    );
  },

  getProfile(address: string): Promise<ProfileDto> {
    return request(`/me?address=${encodeURIComponent(address)}`, profileSchema);
  },

  getLeaderboard(address: string): Promise<LeaderboardDto> {
    return request(`/leaderboard?address=${encodeURIComponent(address)}`, leaderboardSchema);
  },

  getWallet(address: string): Promise<WalletOverview> {
    return request(
      `/wallet?address=${encodeURIComponent(address)}`,
      walletOverviewSchema,
    ) as Promise<WalletOverview>;
  },

  deposit(address: string, amountSol: number): Promise<WalletOverview> {
    return request('/wallet/deposit', walletOverviewSchema, {
      method: 'POST',
      body: JSON.stringify({ address, amountSol }),
    }) as Promise<WalletOverview>;
  },

  withdraw(address: string, amountSol: number, method: string): Promise<WalletOverview> {
    return request('/wallet/withdraw', walletOverviewSchema, {
      method: 'POST',
      body: JSON.stringify({ address, amountSol, method }),
    }) as Promise<WalletOverview>;
  },

  getUpcomingFixtures(): Promise<Fixture[]> {
    return request('/fixtures/upcoming', fixturesSchema).then(
      (result) => result.items as Fixture[],
    );
  },
};
