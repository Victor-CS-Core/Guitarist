import type { AccountRow } from "./db";

const ITERATIONS = 310_000;

function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function decode(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: encode(salt), hash: encode(await derive(password, salt, ITERATIONS)), iterations: ITERATIONS };
}

export async function verifyPassword(password: string, account: Pick<AccountRow, "password_salt" | "password_hash" | "password_iterations">): Promise<boolean> {
  try {
    const expected = decode(account.password_hash);
    const actual = await derive(password, decode(account.password_salt), account.password_iterations);
    if (expected.length !== actual.length) return false;
    let difference = 0;
    for (let index = 0; index < actual.length; index++) difference |= actual[index] ^ expected[index];
    return difference === 0;
  } catch {
    return false;
  }
}
