// Maps full party names (as ECI writes them in HTML) back to canonical short
// codes used elsewhere in the app. Uppercase keys for case-insensitive lookup.
// Source: tnelections2026.in/data/party_lookup.js, with ECI-side aliases added.

const RAW: Record<string, string> = {
  "DRAVIDA MUNNETRA KAZHAGAM": "DMK",
  "ALL INDIA ANNA DRAVIDA MUNNETRA KAZHAGAM": "AIADMK",
  "TAMILAGA VETTRI KAZHAGAM": "TVK",
  "NAAM TAMILAR KATCHI": "NTK",
  "BHARATIYA JANATA PARTY": "BJP",
  "INDIAN NATIONAL CONGRESS": "INC",
  "PATTALI MAKKAL KATCHI": "PMK",
  "VIDUTHALAI CHIRUTHAIGAL KATCHI": "VCK",
  "COMMUNIST PARTY OF INDIA": "CPI",
  "COMMUNIST PARTY OF INDIA (MARXIST)": "CPI(M)",
  "INDIAN UNION MUSLIM LEAGUE": "IUML",
  "DESIYA MURPOKKU DRAVIDA KAZHAGAM": "DMDK",
  "AMMA MAKKAL MUNNETTRA KAZAGAM": "AMMK",
  "AANAITHINTHIYA JANANAYAKA PATHUKAPPU KAZHAGAM": "AJPK",
  "ALL INDIA PURATCHI THALAIVAR MAKKAL MUNNETTRA KAZHAGAM": "AIPTMMK",
  "BAHUJAN SAMAJ PARTY": "BSP",
  "TAMIZHAGA VAAZHVURIMAI KATCHI": "TAVK",
  "PUTHIYA TAMILAGAM": "PT",
  "INDEPENDENT": "IND",
  "NONE OF THE ABOVE": "NOTA",
};

export const FULL_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(RAW).map(([k, v]) => [k.toUpperCase(), v]),
);

const ECI_SHORT_ALIASES: Record<string, string> = {
  ADMK: "AIADMK",
  AMMKMNKZ: "AMMK",
  NA: "PENDING",
};

export function normalizePartyName(raw: string): string {
  if (!raw) return "—";
  const upper = raw.toUpperCase().trim();
  // Direct full-name hit
  if (FULL_NAME_TO_CODE[upper]) return FULL_NAME_TO_CODE[upper];
  // ECI short-code alias
  if (ECI_SHORT_ALIASES[upper]) return ECI_SHORT_ALIASES[upper];
  // Already a short code? (≤ 8 chars, all letters/parens)
  if (upper.length <= 8 && /^[A-Z()]+$/.test(upper)) return upper;
  // Fall back to first 4 letters as a heuristic short code
  return upper.split(/\s+/).map((w) => w[0]).join("").slice(0, 6);
}
