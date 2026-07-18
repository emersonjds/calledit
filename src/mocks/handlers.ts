import { http, HttpResponse, delay } from "msw";
import { isMarketId } from "@/entities/prediction";
import type { WalletAccount, ChainKind } from "@/entities/wallet";
import { snapshotAt } from "./match-engine";
import { getLedger, getMatch } from "./state";
import { commit, getPrediction, leaderboard, profile } from "./onchain";
import { mulberry32, seedFromString } from "./prng";

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Stable per-provider address so a reconnect resumes the same on-chain ledger. */
function addressFor(provider: string): string {
  const rng = mulberry32(seedFromString(`addr-${provider}`));
  let out = provider === "guest" ? "guest" : "";
  while (out.length < 44) out += BASE58[Math.floor(rng() * BASE58.length)];
  return out.slice(0, 44);
}

function chainFor(provider: string): ChainKind {
  return provider === "metamask" ? "evm" : "solana";
}

export const handlers = [
  http.post("/api/wallet/connect", async ({ request }) => {
    const body = (await request.json()) as { provider?: string };
    const provider = body.provider ?? "guest";
    const address = addressFor(provider);
    await delay(180);
    const account: WalletAccount = {
      address,
      balanceSol: getLedger(address).balanceSol,
      chain: chainFor(provider),
      provider,
    };
    return HttpResponse.json(account);
  }),

  http.get("/api/feed/:matchId", () => {
    return HttpResponse.json(snapshotAt(getMatch()));
  }),

  http.post("/api/predictions", async ({ request }) => {
    const body = (await request.json()) as {
      matchId?: string;
      market?: string;
      stakeSol?: number;
      address?: string;
    };
    if (!body.market || !isMarketId(body.market) || !body.address) {
      return HttpResponse.text("Invalid prediction", { status: 400 });
    }
    await delay(220); // feels like a signed on-chain stamp
    const result = commit({
      matchId: body.matchId ?? "wc26-bra-fra",
      market: body.market,
      stakeSol: Number(body.stakeSol ?? 0),
      address: body.address,
    });
    if (!result.ok) return HttpResponse.text(result.error, { status: 400 });
    return HttpResponse.json(result.prediction);
  }),

  http.get("/api/predictions", ({ request }) => {
    const address = new URL(request.url).searchParams.get("address") ?? "";
    return HttpResponse.json({ items: getLedger(address).predictions });
  }),

  http.get("/api/predictions/:id", ({ params }) => {
    const prediction = getPrediction(String(params.id));
    if (!prediction) return HttpResponse.text("Not found", { status: 404 });
    return HttpResponse.json(prediction);
  }),

  http.get("/api/me", ({ request }) => {
    const address = new URL(request.url).searchParams.get("address");
    if (!address) return HttpResponse.text("address required", { status: 400 });
    return HttpResponse.json(profile(address));
  }),

  http.get("/api/leaderboard", ({ request }) => {
    const address = new URL(request.url).searchParams.get("address") ?? "";
    return HttpResponse.json(leaderboard(address));
  }),
];
