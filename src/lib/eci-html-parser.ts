/**
 * Parser for ECI's `candidateswise-S22{acNo}.htm` page.
 *
 * The page is a server-rendered HTML report (no JSON inside) generated per
 * counting round. It contains:
 *   - "Status as on Round, X / Y" header
 *   - One <div class='cand-box'> per candidate, with name, party, status,
 *     vote count, and signed margin "(+ N)" or "(- N)".
 *
 * The parser is intentionally regex-based (not DOM-based) so it runs in the
 * Edge runtime without an HTML parser dependency. Defensive: tolerates
 * attribute order, single/double quotes, optional whitespace, and missing
 * fields (returns undefined rather than throwing).
 */

export type EciCandidate = {
  name: string;
  party: string;
  status: "won" | "leading" | "trailing" | "counting";
  votes: number;
  margin: number; // signed: positive when leading, negative when trailing
};

export type EciConstituency = {
  acNo: number;
  roundsCompleted: number;
  roundsTotal: number;
  totalVotes: number;
  candidates: EciCandidate[];
  leader: EciCandidate | null;
  runnerUp: EciCandidate | null;
};

const ROUND_RE = /Status\s+as\s+on\s+Round[,\s]*<span[^>]*>\s*(\d+)\s*<\/span>\s*\/\s*(\d+)/i;
const ROUND_RE_FALLBACK = /Round[,\s]*(\d+)\s*\/\s*(\d+)/i;

// Match a full <div class='cand-box'>...</div> block, lazily.
const CAND_BOX_RE = /<div[^>]*class\s*=\s*['"][^'"]*\bcand-box\b[^'"]*['"][^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class\s*=\s*['"][^'"]*\bcand-box\b|<\/section>|<\/div>\s*<\/div>\s*<div\s+class\s*=\s*['"]nav-card)/gi;
// Fallback: match cand-box and stop at next cand-box opener or end-of-input.
const CAND_BOX_RE_LOOSE = /<div[^>]*class\s*=\s*['"][^'"]*\bcand-box\b[^'"]*['"][^>]*>([\s\S]*?)(?=<div[^>]*class\s*=\s*['"][^'"]*\bcand-box\b|$)/gi;

const STATUS_RE = /class\s*=\s*['"]status\s+(\w+)['"]/i;
const VOTES_AND_MARGIN_RE = /([\d,]+)\s*<span[^>]*>\s*\(\s*([+-]?)\s*([\d,]+)\s*\)\s*<\/span>/i;
// Candidate name and party — defensive: try common heading tags first
const NAME_RE = /<h[1-6][^>]*>\s*([^<]+?)\s*<\/h[1-6]>/i;
const NAME_RE_DIV = /<div[^>]*class\s*=\s*['"][^'"]*\b(?:cand-name|name|candidate)\b[^'"]*['"][^>]*>\s*([^<]+?)\s*<\/div>/i;
const PARTY_RE = /<(?:h[1-6]|div|span)[^>]*class\s*=\s*['"][^'"]*\b(?:party|cand-party)\b[^'"]*['"][^>]*>\s*([^<]+?)\s*<\/(?:h[1-6]|div|span)>/i;
const PARTY_RE_AFTER_NAME = /<h[1-6][^>]*>\s*([^<]+?)\s*<\/h[1-6]>\s*<h[1-6][^>]*>\s*([^<]+?)\s*<\/h[1-6]>/i;

function parseInt2(s: string): number {
  return parseInt(s.replace(/,/g, ""), 10) || 0;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function normalizeStatus(raw: string): EciCandidate["status"] {
  const s = raw.toLowerCase();
  if (s.includes("won")) return "won";
  if (s.includes("lead")) return "leading";
  if (s.includes("trail")) return "trailing";
  return "counting";
}

function parseCandidateBlock(inner: string): EciCandidate | null {
  const statusMatch = inner.match(STATUS_RE);
  const status = statusMatch ? normalizeStatus(statusMatch[1]) : "counting";

  const vm = inner.match(VOTES_AND_MARGIN_RE);
  let votes = 0;
  let margin = 0;
  if (vm) {
    votes = parseInt2(vm[1]);
    const sign = vm[2] === "-" ? -1 : 1;
    margin = sign * parseInt2(vm[3]);
  }

  // Try the "two adjacent headings" pattern first (most ECI templates use it)
  const both = inner.match(PARTY_RE_AFTER_NAME);
  let name: string | undefined;
  let party: string | undefined;
  if (both) {
    name = decodeHtml(both[1]);
    party = decodeHtml(both[2]);
  } else {
    const n = inner.match(NAME_RE) ?? inner.match(NAME_RE_DIV);
    if (n) name = decodeHtml(n[1]);
    const p = inner.match(PARTY_RE);
    if (p) party = decodeHtml(p[1]);
  }

  if (!name && !votes && !party) return null;

  return {
    name: name ?? "Unknown",
    party: party ?? "—",
    status,
    votes,
    margin,
  };
}

export function parseEciCandidatesPage(html: string, acNo: number): EciConstituency {
  // Round info
  let roundsCompleted = 0;
  let roundsTotal = 0;
  const r = html.match(ROUND_RE) ?? html.match(ROUND_RE_FALLBACK);
  if (r) {
    roundsCompleted = parseInt(r[1], 10) || 0;
    roundsTotal = parseInt(r[2], 10) || 0;
  }

  // Candidate boxes — try strict pattern first, fallback to loose
  const candidates: EciCandidate[] = [];
  const seen = new Set<string>();
  for (const re of [CAND_BOX_RE, CAND_BOX_RE_LOOSE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const c = parseCandidateBlock(m[1]);
      if (c) {
        const key = `${c.name}|${c.party}`;
        if (!seen.has(key)) {
          candidates.push(c);
          seen.add(key);
        }
      }
    }
    if (candidates.length > 0) break;
  }

  // Sort by votes desc, fall back to margin
  candidates.sort((a, b) => (b.votes - a.votes) || (b.margin - a.margin));

  const totalVotes = candidates.reduce((s, c) => s + c.votes, 0);
  const leader = candidates[0] ?? null;
  const runnerUp = candidates[1] ?? null;

  return {
    acNo,
    roundsCompleted,
    roundsTotal,
    totalVotes,
    candidates,
    leader,
    runnerUp,
  };
}
