/**
 * Shared ECI fan-out logic. Used by /api/results (primary path) and
 * /api/full-results (alias). Fetches every candidateswise-S22{ac}.htm,
 * parses, and aggregates into a LiveResults shape with real votes, margins,
 * and vote shares.
 */

import { parseEciCandidatesPage, type EciConstituency } from "@/lib/eci-html-parser";
import { normalizePartyName } from "@/data/party_lookup";
import { CONSTITUENCIES } from "@/data/constituencies";
import { ALLIANCES } from "@/data/alliances";
import { PARTIES } from "@/data/parties";
import { partyToAlliance } from "@/data/aggregate";
import type { LiveResults } from "@/data/types";

const ECI_BASE = "https://results.eci.gov.in/ResultAcGenMay2026";
const BATCH_SIZE = 24;
const FETCH_TIMEOUT_MS = 8000;

async function fetchAc(acNo: number): Promise<EciConstituency | null> {
  const urls = [
    `${ECI_BASE}/candidateswise-S22${acNo}.htm`,
    `${ECI_BASE}/ConstituencywiseS22${acNo}.htm`,
  ];
  for (const u of urls) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      const r = await fetch(`${u}?t=${Date.now()}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Referer: `${ECI_BASE}/`,
          Accept: "text/html,application/xhtml+xml,*/*",
        },
        cache: "no-store",
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (!r.ok) continue;
      const ct = r.headers.get("content-type") ?? "";
      if (!ct.includes("html")) continue;
      const html = await r.text();
      const parsed = parseEciCandidatesPage(html, acNo);
      parsed.candidates = parsed.candidates.map((c) => ({ ...c, party: normalizePartyName(c.party) }));
      if (parsed.leader) parsed.leader = { ...parsed.leader, party: normalizePartyName(parsed.leader.party) };
      if (parsed.runnerUp) parsed.runnerUp = { ...parsed.runnerUp, party: normalizePartyName(parsed.runnerUp.party) };
      return parsed;
    } catch {
      // try next URL or return null
    }
  }
  return null;
}

export async function fetchAllAcs(): Promise<Map<number, EciConstituency>> {
  const out = new Map<number, EciConstituency>();
  const acNos = CONSTITUENCIES.map((c) => c.id);
  for (let i = 0; i < acNos.length; i += BATCH_SIZE) {
    const batch = acNos.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((n) => fetchAc(n)));
    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      if (r) out.set(batch[j], r);
    }
  }
  return out;
}

export function buildLiveResults(byAc: Map<number, EciConstituency>, dataAt?: string): LiveResults {
  const partyVotes: Record<string, number> = {};
  const partyWon: Record<string, number> = {};
  const partyLeading: Record<string, number> = {};
  let totalVotesAcrossState = 0;

  const constituencies = CONSTITUENCIES.map((c) => {
    const eci = byAc.get(c.id);
    if (!eci || !eci.leader) {
      return {
        acNo: c.id,
        status: "pending" as const,
        roundsCompleted: 0,
        roundsTotal: 0,
        totalVotes: 0,
        candidates: [],
        leader: null,
      };
    }
    totalVotesAcrossState += eci.totalVotes;
    for (const cand of eci.candidates) {
      partyVotes[cand.party] = (partyVotes[cand.party] ?? 0) + cand.votes;
    }
    const isWon = eci.leader.status === "won";
    if (isWon) {
      partyWon[eci.leader.party] = (partyWon[eci.leader.party] ?? 0) + 1;
    } else {
      partyLeading[eci.leader.party] = (partyLeading[eci.leader.party] ?? 0) + 1;
    }
    return {
      acNo: c.id,
      status: (isWon ? "won" : "leading") as "won" | "leading",
      roundsCompleted: eci.roundsCompleted,
      roundsTotal: eci.roundsTotal,
      totalVotes: eci.totalVotes,
      candidates: eci.candidates.map((cand, i) => ({
        candidateId: c.id * 100 + i + 1,
        name: cand.name,
        party: cand.party,
        votes: cand.votes,
      })),
      leader: {
        candidateId: c.id * 100 + 1,
        party: eci.leader.party,
        margin: Math.abs(eci.leader.margin),
      },
    };
  });

  const allianceWon: Record<string, number> = {};
  const allianceLeading: Record<string, number> = {};
  const allianceVotes: Record<string, number> = {};
  for (const code of Object.keys(partyWon)) {
    allianceWon[partyToAlliance(code)] = (allianceWon[partyToAlliance(code)] ?? 0) + partyWon[code];
  }
  for (const code of Object.keys(partyLeading)) {
    allianceLeading[partyToAlliance(code)] = (allianceLeading[partyToAlliance(code)] ?? 0) + partyLeading[code];
  }
  for (const code of Object.keys(partyVotes)) {
    allianceVotes[partyToAlliance(code)] = (allianceVotes[partyToAlliance(code)] ?? 0) + partyVotes[code];
  }

  return {
    updatedAt: dataAt ?? new Date().toISOString(),
    countingStartedAt: "2026-05-04T08:00:00+05:30",
    totalSeats: 234,
    majorityThreshold: 118,
    byAlliance: ALLIANCES.map((a) => ({
      allianceId: a.id,
      won: allianceWon[a.id] ?? 0,
      leading: allianceLeading[a.id] ?? 0,
      voteShare: totalVotesAcrossState > 0 ? ((allianceVotes[a.id] ?? 0) / totalVotesAcrossState) * 100 : 0,
    })),
    byParty: PARTIES.map((p) => ({
      party: p.code,
      won: partyWon[p.code] ?? 0,
      leading: partyLeading[p.code] ?? 0,
      voteShare: totalVotesAcrossState > 0 ? ((partyVotes[p.code] ?? 0) / totalVotesAcrossState) * 100 : 0,
    })),
    constituencies,
  };
}
