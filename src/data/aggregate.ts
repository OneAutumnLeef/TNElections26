import { CONSTITUENCIES } from "./constituencies";
import { ALLIANCES, ALLIANCE_BY_ID } from "./alliances";
import { PARTIES, PARTY_BY_CODE } from "./parties";
import type { AllianceId } from "./types";

export const TOTAL_SEATS = 234;
export const MAJORITY = 118;
export const TOTAL_ELECTORS = CONSTITUENCIES.reduce((s, c) => s + c.electors, 0);
export const TOTAL_MALE = CONSTITUENCIES.reduce((s, c) => s + c.male, 0);
export const TOTAL_FEMALE = CONSTITUENCIES.reduce((s, c) => s + c.female, 0);
export const TOTAL_THIRD_GENDER = CONSTITUENCIES.reduce((s, c) => s + c.thirdGender, 0);
export const TOTAL_CANDIDATES = CONSTITUENCIES.reduce((s, c) => s + c.candidates, 0);

export function partyToAlliance(partyCode: string): AllianceId {
  return PARTY_BY_CODE[partyCode]?.alliance ?? "independent";
}

export function prev2021Counts() {
  const out: Record<string, number> = {};
  for (const c of CONSTITUENCIES) {
    out[c.prevWinner] = (out[c.prevWinner] ?? 0) + 1;
  }
  return out;
}

export function prev2021AllianceCounts(): Record<AllianceId, number> {
  const out: Record<string, number> = {};
  for (const c of CONSTITUENCIES) {
    const a = partyToAlliance(c.prevWinner);
    out[a] = (out[a] ?? 0) + 1;
  }
  return out as Record<AllianceId, number>;
}

export function constituenciesByDistrict() {
  const map = new Map<string, typeof CONSTITUENCIES>();
  for (const c of CONSTITUENCIES) {
    const arr = map.get(c.district) ?? [];
    arr.push(c);
    map.set(c.district, arr);
  }
  return map;
}

export { ALLIANCES, ALLIANCE_BY_ID, PARTIES, PARTY_BY_CODE };
