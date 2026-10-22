const ALLOWED_PHONES = new Set(["106", "3163907010", "018000931089"]);

function hasForbiddenPhone(text: string): boolean {
  const matches = text.match(/\d[\d\s\-.]{4,}\d/g) ?? [];
  for (const match of matches) {
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 6 && !ALLOWED_PHONES.has(digits)) return true;
  }
  return false;
}

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "EMAIL", re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
  { name: "URL", re: /https?:\/\/|www\./i },
  { name: "HANDLE", re: /@\w+/ },
  {
    name: "ADDRESS",
    re: /\b(calle|carrera|cra|cll|transversal|diagonal|barrio)\s*[\w#\d]/i,
  },
];

export interface PrefilterResult {
  block: boolean;
  reasonCode: string;
}

export function prefilter(text: string, maxChars = 360): PrefilterResult {
  if (text.length > maxChars) return { block: true, reasonCode: "TOO_LONG" };
  if (hasForbiddenPhone(text)) return { block: true, reasonCode: "PII" };

  for (const { re } of PATTERNS) {
    if (re.test(text)) return { block: true, reasonCode: "PII" };
  }

  return { block: false, reasonCode: "OK" };
}
