
import { describe, expect, it } from "vitest";
import { analyzeUrl } from "./urlAnalyzer.js";

describe("LinkSentry URL Analyzer", () => {
  it("classifies a normal HTTPS URL as low risk", () => {
    const result = analyzeUrl("https://www.google.com");

    expect(result.risk_status).toBe("low");
    expect(result.risk_score).toBe(0);
    expect(result.normalized_url).toBe("https://www.google.com/");
  });

  it("adds a warning for plain HTTP", () => {
    const result = analyzeUrl("http://example.com");

    expect(result.risk_score).toBe(5);
    expect(result.risk_status).toBe("low");
    expect(result.reasons).toContain(
      "URL does not use HTTPS"
    );
  });

  it("detects an IP address and suspicious keyword", () => {
    const result = analyzeUrl("http://192.168.1.1/login");

    expect(result.risk_score).toBe(38);
    expect(result.risk_status).toBe("medium");
    expect(result.reasons).toContain(
      "URL uses an IPv4 address instead of a domain name"
    );
  });

  it("detects possible brand impersonation patterns", () => {
    const result = analyzeUrl(
      "https://paypal-login-example.com/verify"
    );

    expect(result.risk_status).toBe("medium");
    expect(result.risk_score).toBe(46);
    expect(
      result.reasons.some((reason: string) =>
        reason.includes("Possible brand impersonation pattern")
      )
    ).toBe(true);
  });

  it("rejects an invalid URL", () => {
    expect(() => analyzeUrl("not-a-valid-url")).toThrow(
      "Invalid URL"
    );
  });

  it("rejects unsupported protocols", () => {
    expect(() => analyzeUrl("ftp://example.com")).toThrow(
      "Only HTTP and HTTPS URLs are allowed"
    );
  });

  it("keeps the score between 0 and 100", () => {
    const result = analyzeUrl(
      "http://192.168.1.1/login/verify/password/account"
    );

    expect(result.risk_score).toBeGreaterThanOrEqual(0);
    expect(result.risk_score).toBeLessThanOrEqual(100);
  });
});
