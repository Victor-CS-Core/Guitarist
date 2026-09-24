import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("Sites-compatible password hashing", () => {
  it("uses an iteration count supported by the hosted Worker and verifies passwords", async () => {
    const first = await hashPassword("example-student-password");
    const second = await hashPassword("example-student-password");
    expect(first.iterations).toBeGreaterThan(0);
    expect(first.iterations).toBeLessThanOrEqual(100_000);
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
    const account = { password_salt: first.salt, password_hash: first.hash, password_iterations: first.iterations };
    expect(await verifyPassword("example-student-password", account)).toBe(true);
    expect(await verifyPassword("wrong-password", account)).toBe(false);
  });
});
