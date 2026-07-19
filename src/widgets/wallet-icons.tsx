import { useState } from 'react';

/**
 * Prefers the official logo at `public/<id>.png`; falls back to the inline brand
 * mark below when that file is absent — so the app never shows a broken image.
 */
export function WalletLogo({ id }: { id: string }) {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      <img
        src={`/${id}.png`}
        alt=""
        className="size-9 shrink-0 rounded-lg"
        onError={() => setFailed(true)}
      />
    );
  }
  return id === 'phantom' ? <PhantomIcon /> : <MetaMaskIcon />;
}

/** Self-contained brand marks so the wallet list needs no image assets or extra dependency. */

export function PhantomIcon() {
  return (
    <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#AB9FF2" />
      <path
        fill="#fff"
        d="M20 9c-6.1 0-11 4.9-11 11v6.5c0 .8 1 1.2 1.6.6l1.6-1.4c.4-.4 1-.4 1.4 0l1.6 1.4c.4.4 1 .4 1.4 0l1.6-1.4c.4-.4 1-.4 1.4 0l1.6 1.4c.4.4 1 .4 1.4 0l1.6-1.4c.4-.4 1-.4 1.4 0l1.6 1.4c.6.5 1.6.1 1.6-.6V20c0-6.1-4.9-11-11-11Z"
      />
      <circle cx="17.3" cy="19" r="1.7" fill="#AB9FF2" />
      <circle cx="23.7" cy="19" r="1.7" fill="#AB9FF2" />
    </svg>
  );
}

export function MetaMaskIcon() {
  return (
    <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#1a1712" />
      <path fill="#E2761B" d="m12 12 5 2.9 1 3.5-4.2-1.1z" />
      <path fill="#E2761B" d="m28 12-5 2.9-1 3.5 4.2-1.1z" />
      <path fill="#F6851B" d="m14 18.3 6 2 6-2 1.3 6-2.5 4.2-4.8 1.7-4.8-1.7-2.5-4.2z" />
      <path fill="#fff" d="m16.8 25.4 3.2 1 3.2-1-.8 2.1-2.4 1-2.4-1z" opacity="0.9" />
    </svg>
  );
}
