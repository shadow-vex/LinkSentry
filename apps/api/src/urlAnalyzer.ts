
export type RiskLevel = "low" | "medium" | "high";

export type UrlAnalysis = {
  risk_status: RiskLevel;
  risk_score: number;
  reasons: string[];
  normalized_url: string;
};

const SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "is.gd",
  "cutt.ly",
  "rb.gy",
  "shorturl.at",
  "rebrand.ly",
  "ow.ly",
  "buff.ly",
]);

const SUSPICIOUS_WORDS = [
  "login",
  "verify",
  "password",
  "wallet",
  "account",
  "signin",
  "confirm",
  "banking",
  "credential",
  "reset-password",
  "unlock",
  "suspended",
  "payment",
];

const SUSPICIOUS_TLDS = new Set([
  "zip",
  "mov",
  "top",
  "click",
  "work",
  "country",
  "gq",
  "tk",
  "ml",
  "cf",
]);

const BRAND_NAMES = [
  "paypal",
  "google",
  "microsoft",
  "apple",
  "amazon",
  "facebook",
  "instagram",
  "netflix",
  "whatsapp",
];

function isValidIPv4(hostname: string): boolean {
  const parts = hostname.split(".");

  return (
    parts.length === 4 &&
    parts.every(
      (part) =>
        /^\d{1,3}$/.test(part) &&
        Number(part) >= 0 &&
        Number(part) <= 255
    )
  );
}

export function analyzeUrl(input: string): UrlAnalysis {
  const reasons: string[] = [];
  let score = 0;

  const value = input.trim();

  if (!value) {
    throw new Error("Please enter a URL");
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      "Invalid URL. Enter a complete URL starting with http:// or https://"
    );
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  if (!parsed.hostname) {
    throw new Error("URL must contain a hostname");
  }

  const hostname = parsed.hostname.toLowerCase();
  const labels = hostname.split(".");
  const lowerUrl = parsed.href.toLowerCase();

  // 1. Credentials embedded inside a URL.
  if (parsed.username || parsed.password) {
    score += 30;
    reasons.push("URL contains embedded credentials");
  }

  // 2. IP address used instead of a domain name.
  if (isValidIPv4(hostname)) {
    score += 25;
    reasons.push("URL uses an IPv4 address instead of a domain name");
  }

  // 3. Internationalized or punycode domain labels.
  if (labels.some((label) => label.startsWith("xn--"))) {
    score += 25;
    reasons.push("Domain contains a punycode label");
  }

  // 4. Excessive subdomain levels.
  if (labels.length >= 5) {
    score += 15;
    reasons.push("Domain has many subdomain levels");
  }

  // 5. Multiple hyphens in the hostname.
  if ((hostname.match(/-/g) || []).length >= 2) {
    score += 10;
    reasons.push("Domain contains multiple hyphens");
  }

  // 6. Known URL shortening services.
  if (SHORTENERS.has(hostname)) {
    score += 20;
    reasons.push("URL uses a known link-shortening service");
  }

  // 7. Suspicious keywords anywhere in the URL.
  const matchedWords = SUSPICIOUS_WORDS.filter((word) =>
    lowerUrl.includes(word)
  );

  if (matchedWords.length > 0) {
    score += Math.min(matchedWords.length * 8, 24);
    reasons.push(
      `Suspicious keywords found: ${matchedWords.join(", ")}`
    );
  }

  // 8. Suspicious-looking TLD.
  const tld = labels[labels.length - 1];

  if (SUSPICIOUS_TLDS.has(tld)) {
    score += 15;
    reasons.push(`Domain uses a higher-caution TLD: .${tld}`);
  }

  // 9. Brand name used in a domain that does not end
  // in the brand's actual name.
  // This is only a heuristic, not proof of impersonation.
  const domainWithoutWww = hostname.replace(/^www\./, "");
  const domainParts = domainWithoutWww.split(".");
  const registeredDomainPart =
    domainParts.length >= 2
      ? domainParts[domainParts.length - 2]
      : domainParts[0];

  const brandMatches = BRAND_NAMES.filter((brand) =>
    domainParts.some(
      (part) => part.includes(brand) && part !== brand
    )
  );

  if (brandMatches.length > 0) {
    score += 20;
    reasons.push(
      `Possible brand impersonation pattern: ${brandMatches.join(", ")}`
    );
  }

  // 10. URL length.
  if (parsed.href.length > 200) {
    score += 10;
    reasons.push("URL is unusually long");
  }

  // 11. Unusual web port.
  if (parsed.port && !["80", "443"].includes(parsed.port)) {
    score += 10;
    reasons.push("URL uses a non-standard web port");
  }

  // 12. Plain HTTP instead of HTTPS.
  if (parsed.protocol === "http:") {
    score += 5;
    reasons.push("URL does not use HTTPS");
  }

  // 13. Multiple encoded or redirect-related URL parameters.
  const redirectParams = [
    "redirect",
    "redirect_url",
    "return_url",
    "continue",
    "next",
    "url",
    "target",
  ];

  const matchedRedirectParams = redirectParams.filter((key) =>
    parsed.searchParams.has(key)
  );

  if (matchedRedirectParams.length > 0) {
    score += 10;
    reasons.push(
      `Redirect-related parameters found: ${matchedRedirectParams.join(", ")}`
    );
  }

  // Keep score between 0 and 100.
  score = Math.min(score, 100);

  // Classification thresholds.
  const risk_status: RiskLevel =
    score >= 70 ? "high" : score >= 30 ? "medium" : "low";

  if (reasons.length === 0) {
    reasons.push("No configured URL warning rules were triggered");
  }

  return {
    risk_status,
    risk_score: score,
    reasons,
    normalized_url: parsed.href,
  };
}
