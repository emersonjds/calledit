const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const STORAGE_KEY = 'called-it:embedded-wallet';

export interface EmbeddedWallet {
  address: string;
  secret: string;
}

export function base58Encode(bytes: Uint8Array): string {
  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) leadingZeros += 1;
  let value = 0n;
  for (const byte of bytes) value = value * 256n + BigInt(byte);
  let encoded = '';
  while (value > 0n) {
    encoded = BASE58_ALPHABET[Number(value % 58n)] + encoded;
    value /= 58n;
  }
  return '1'.repeat(leadingZeros) + encoded;
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function createEmbeddedWallet(): Promise<EmbeddedWallet> {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const seed = base64UrlToBytes(jwk.d ?? '');
  const secretKey = new Uint8Array(64);
  secretKey.set(seed, 0);
  secretKey.set(publicKey, 32);
  return { address: base58Encode(publicKey), secret: base58Encode(secretKey) };
}

export function saveEmbeddedWallet(wallet: EmbeddedWallet): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
}

export function loadEmbeddedWallet(): EmbeddedWallet | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'address' in parsed &&
      'secret' in parsed &&
      typeof parsed.address === 'string' &&
      typeof parsed.secret === 'string'
    ) {
      return { address: parsed.address, secret: parsed.secret };
    }
    return null;
  } catch {
    return null;
  }
}

export function hasEmbeddedWallet(): boolean {
  return loadEmbeddedWallet() !== null;
}
