import { createBrowserRouter } from "react-router-dom";
import { AppLayout, RequireWallet } from "./layout";
import { OnboardingPage } from "@/pages/onboarding";
import { LiveMatchPage } from "@/pages/live-match";
import { HistoryPage } from "@/pages/history";
import { ProfilePage } from "@/pages/profile";
import { LeaderboardPage } from "@/pages/leaderboard";

export const router = createBrowserRouter([
  { path: "/onboarding", element: <OnboardingPage /> },
  {
    path: "/",
    element: (
      <RequireWallet>
        <AppLayout />
      </RequireWallet>
    ),
    children: [
      { index: true, element: <LiveMatchPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "leaderboard", element: <LeaderboardPage /> },
    ],
  },
]);
