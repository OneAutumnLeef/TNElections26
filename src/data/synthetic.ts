import { CONSTITUENCIES } from "./constituencies";
import { PARTY_BY_CODE, PARTIES } from "./parties";
import { ALLIANCES, partyToAlliance } from "./aggregate";
import type { AllianceId, ConstituencyResult, LiveResults } from "./types";

// Seeded RNG so synthetic results are deterministic across renders.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALLIANCE_PROBS: Record<AllianceId, number> = {
  spa: 0.55,
  nda: 0.32,
  tvk: 0.05,
  ntk: 0.0,
  ajpk: 0.0,
  others: 0.03,
  independent: 0.05,
};

const ALLIANCE_PARTIES: Record<AllianceId, string[]> = {
  spa: ["DMK", "INC", "VCK", "CPI", "CPI(M)", "IUML"],
  nda: ["AIADMK", "BJP", "PMK"],
  tvk: ["TVK"],
  ntk: ["NTK"],
  ajpk: ["AJPK", "AIPTMMK"],
  others: ["BSP", "TAVK", "PT"],
  independent: ["IND"],
};

function pickAllianceForSeat(rng: () => number, seatBias: number): AllianceId {
  // Bias toward incumbent alliance using prevWinner; seatBias in [-0.2, 0.2]
  const adjusted: Record<AllianceId, number> = { ...ALLIANCE_PROBS };
  adjusted.spa = Math.max(0, adjusted.spa + seatBias);
  adjusted.nda = Math.max(0, adjusted.nda - seatBias);
  const total = Object.values(adjusted).reduce((s, v) => s + v, 0);
  let r = rng() * total;
  for (const k of Object.keys(adjusted) as AllianceId[]) {
    r -= adjusted[k];
    if (r <= 0) return k;
  }
  return "spa";
}

function pickPartyInAlliance(allianceId: AllianceId, rng: () => number, prev: string): string {
  const parties = ALLIANCE_PARTIES[allianceId];
  if (parties.includes(prev)) return prev;
  if (parties.length === 1) return parties[0];
  // Weight by seatsContested
  const weights = parties.map((code) => PARTY_BY_CODE[code]?.seatsContested ?? 1);
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < parties.length; i++) {
    r -= weights[i];
    if (r <= 0) return parties[i];
  }
  return parties[0];
}

export function generateSyntheticResults(
  seed: number,
  countingProgress: number = 0.4, // 0..1 — fraction of seats decided
): LiveResults {
  const rng = mulberry32(seed);
  const constituencyResults: ConstituencyResult[] = [];
  const partyTallyWon: Record<string, number> = {};
  const partyTallyLeading: Record<string, number> = {};
  const partyVotes: Record<string, number> = {};
  let totalVotesAcrossState = 0;

  for (const c of CONSTITUENCIES) {
    const incumbentAlliance = partyToAlliance(c.prevWinner);
    const seatBias = incumbentAlliance === "spa" ? 0.05 : incumbentAlliance === "nda" ? -0.05 : 0;
    const winnerAlliance = pickAllianceForSeat(rng, seatBias);
    const winnerParty = pickPartyInAlliance(winnerAlliance, rng, c.prevWinner);

    const turnoutPct = 0.78 + rng() * 0.12;
    const totalVotes = Math.round(c.electors * turnoutPct);
    totalVotesAcrossState += totalVotes;

    const numCandidates = Math.min(c.candidates, 8);
    const winnerShare = 0.32 + rng() * 0.22;
    const runnerUpShare = 0.22 + rng() * 0.14;

    const candidates: ConstituencyResult["candidates"] = [];
    let allocated = 0;

    candidates.push({
      candidateId: c.id * 100 + 1,
      name: `${winnerParty} Candidate (AC ${c.id})`,
      party: winnerParty,
      votes: Math.round(totalVotes * winnerShare),
    });
    allocated += winnerShare;

    // Runner-up — pick from a different alliance than winner
    const otherAlliances: AllianceId[] = (Object.keys(ALLIANCE_PARTIES) as AllianceId[]).filter((a) => a !== winnerAlliance);
    const runnerAlliance = otherAlliances[Math.floor(rng() * otherAlliances.length)];
    const runnerParty = ALLIANCE_PARTIES[runnerAlliance][0];
    candidates.push({
      candidateId: c.id * 100 + 2,
      name: `${runnerParty} Candidate (AC ${c.id})`,
      party: runnerParty,
      votes: Math.round(totalVotes * runnerUpShare),
    });
    allocated += runnerUpShare;

    // Sprinkle remaining among 2-6 minor candidates
    const remaining = 1 - allocated - 0.04;
    for (let i = 2; i < numCandidates; i++) {
      const share = (remaining / (numCandidates - 2)) * (0.5 + rng());
      const minorParty = ["NTK", "AJPK", "BSP", "IND", "TVK"][i % 5];
      candidates.push({
        candidateId: c.id * 100 + i + 1,
        name: `${minorParty} Candidate (AC ${c.id})`,
        party: minorParty,
        votes: Math.round(totalVotes * share),
      });
    }

    candidates.sort((a, b) => b.votes - a.votes);

    // Decide if this seat is "decided" or still counting based on countingProgress
    const decided = rng() < countingProgress;
    const status: ConstituencyResult["status"] = decided ? "won" : rng() < 0.5 ? "leading" : "counting";
    const roundsTotal = 18 + Math.floor(rng() * 12);
    const roundsCompleted = decided ? roundsTotal : Math.floor(roundsTotal * (0.3 + rng() * 0.5));

    const leader = candidates[0];
    const margin = candidates[0].votes - candidates[1].votes;

    constituencyResults.push({
      acNo: c.id,
      status,
      roundsCompleted,
      roundsTotal,
      totalVotes: candidates.reduce((s, k) => s + k.votes, 0),
      candidates,
      leader: { candidateId: leader.candidateId, party: leader.party, margin },
    });

    if (status === "won") {
      partyTallyWon[winnerParty] = (partyTallyWon[winnerParty] ?? 0) + 1;
    } else if (status === "leading") {
      partyTallyLeading[winnerParty] = (partyTallyLeading[winnerParty] ?? 0) + 1;
    }

    for (const cand of candidates) {
      partyVotes[cand.party] = (partyVotes[cand.party] ?? 0) + cand.votes;
    }
  }

  const allianceWon: Record<AllianceId, number> = { spa: 0, nda: 0, tvk: 0, ntk: 0, ajpk: 0, others: 0, independent: 0 };
  const allianceLead: Record<AllianceId, number> = { spa: 0, nda: 0, tvk: 0, ntk: 0, ajpk: 0, others: 0, independent: 0 };
  const allianceVotes: Record<AllianceId, number> = { spa: 0, nda: 0, tvk: 0, ntk: 0, ajpk: 0, others: 0, independent: 0 };

  for (const [party, count] of Object.entries(partyTallyWon)) {
    allianceWon[partyToAlliance(party)] += count;
  }
  for (const [party, count] of Object.entries(partyTallyLeading)) {
    allianceLead[partyToAlliance(party)] += count;
  }
  for (const [party, votes] of Object.entries(partyVotes)) {
    allianceVotes[partyToAlliance(party)] += votes;
  }

  const byAlliance = ALLIANCES.map((a) => ({
    allianceId: a.id,
    won: allianceWon[a.id],
    leading: allianceLead[a.id],
    voteShare: totalVotesAcrossState > 0 ? (allianceVotes[a.id] / totalVotesAcrossState) * 100 : 0,
  }));

  const byParty = PARTIES.map((p) => ({
    party: p.code,
    won: partyTallyWon[p.code] ?? 0,
    leading: partyTallyLeading[p.code] ?? 0,
    voteShare: totalVotesAcrossState > 0 ? ((partyVotes[p.code] ?? 0) / totalVotesAcrossState) * 100 : 0,
  }));

  return {
    updatedAt: new Date().toISOString(),
    countingStartedAt: "2026-05-04T08:00:00+05:30",
    totalSeats: 234,
    majorityThreshold: 118,
    byAlliance,
    byParty,
    constituencies: constituencyResults,
  };
}

// Synthetic candidate generator used by candidate explorer / drilldown.
const SAMPLE_NAMES = [
  "M. Karthik", "S. Priya", "R. Murugan", "K. Lakshmi", "V. Selvam",
  "T. Anitha", "P. Raja", "G. Meena", "B. Suresh", "A. Devi",
  "D. Arun", "L. Kavitha", "N. Senthil", "C. Padma", "J. Bharath",
  "U. Saraswathi", "H. Vivek", "F. Yamini", "E. Karthikeyan", "Q. Ramya",
];

const PROFESSIONS = ["Agriculture", "Business", "Lawyer", "Teacher", "Politician", "Doctor", "Engineer", "Social Worker"];
const EDUCATION = ["10th Grade (SSLC)", "12th Grade (HSC/+2)", "Bachelor's Degree", "Master's Degree", "Doctorate (Ph.D/MD)", "Diploma/ITI"];

export function generateCandidatesForConstituency(acNo: number) {
  const c = CONSTITUENCIES.find((x) => x.id === acNo);
  if (!c) return [];
  const rng = mulberry32(acNo * 31);
  const count = Math.min(c.candidates, 12);
  const allianceParties: { alliance: AllianceId; party: string }[] = [
    { alliance: "spa", party: "DMK" },
    { alliance: "nda", party: "AIADMK" },
    { alliance: "tvk", party: "TVK" },
    { alliance: "ntk", party: "NTK" },
    { alliance: "ajpk", party: "AJPK" },
    { alliance: "others", party: "BSP" },
    { alliance: "independent", party: "IND" },
  ];
  return Array.from({ length: count }, (_, i) => {
    const ap = allianceParties[i % allianceParties.length];
    const name = SAMPLE_NAMES[(acNo + i) % SAMPLE_NAMES.length] + ` (#${i + 1})`;
    return {
      id: acNo * 100 + i + 1,
      name,
      acNo,
      slNo: i + 1,
      party: ap.party,
      alliance: ap.alliance,
      symbol: PARTY_BY_CODE[ap.party]?.code ?? "—",
      age: 32 + Math.floor(rng() * 35),
      gender: rng() < 0.85 ? "Male" : ("Female" as const),
      education: EDUCATION[Math.floor(rng() * EDUCATION.length)],
      profession: PROFESSIONS[Math.floor(rng() * PROFESSIONS.length)],
      assets: `₹${(0.5 + rng() * 25).toFixed(2)} Cr`,
      criminal: rng() < 0.15 ? Math.floor(rng() * 5) + 1 : 0,
      incumbent: i === 0 && c.prevWinner === ap.party,
    };
  });
}
