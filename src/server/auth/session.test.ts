import { describe, expect, it } from "vite-plus/test";
import { decodeSession, encodeSession, issueSession } from "./session.ts";

const secret = "x".repeat(32);

describe("session cookie", () => {
  it("round-trips a signed payload", () => {
    const payload = issueSession({ login: "falco", avatarUrl: "https://example/a.png" });
    const encoded = encodeSession(payload, secret);
    expect(decodeSession(encoded, secret)).toEqual(payload);
  });

  it("rejects a tampered mac", () => {
    const payload = issueSession({ login: "falco", avatarUrl: "" });
    const encoded = encodeSession(payload, secret);
    expect(decodeSession(`${encoded}x`, secret)).toBeNull();
    expect(decodeSession(encoded, "y".repeat(32))).toBeNull();
  });

  it("rejects expired sessions", () => {
    const encoded = encodeSession({ login: "falco", avatarUrl: "", iat: 1, exp: 2 }, secret);
    expect(decodeSession(encoded, secret)).toBeNull();
  });
});
