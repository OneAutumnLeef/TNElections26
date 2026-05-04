import { z } from "zod";

export const allianceIdSchema = z.enum([
  "spa",
  "nda",
  "tvk",
  "ntk",
  "ajpk",
  "others",
  "independent",
]);
export type AllianceId = z.infer<typeof allianceIdSchema>;

export const allianceSchema = z.object({
  id: allianceIdSchema,
  name: z.string(),
  short: z.string(),
  color: z.string(),
  seatsContested: z.number(),
  candidates: z.number(),
  womenCandidates: z.number(),
  projectedSeats: z.number(),
});
export type Alliance = z.infer<typeof allianceSchema>;

export const partyTypeSchema = z.enum([
  "State Party",
  "National Party",
  "State Party - Other",
  "Unrecognised",
  "Independent",
]);
export type PartyType = z.infer<typeof partyTypeSchema>;

export const partySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  alliance: allianceIdSchema,
  color: z.string(),
  seatsContested: z.number(),
  type: partyTypeSchema,
  leader: z.string(),
  won2021: z.number().optional(),
});
export type Party = z.infer<typeof partySchema>;

export const constituencySchema = z.object({
  id: z.number(),
  name: z.string(),
  district: z.string(),
  electors: z.number(),
  male: z.number(),
  female: z.number(),
  thirdGender: z.number(),
  candidates: z.number(),
  prevWinner: z.string(),
  category: z.enum(["General", "SC", "ST"]),
});
export type Constituency = z.infer<typeof constituencySchema>;

export const candidateSchema = z.object({
  id: z.number(),
  name: z.string(),
  acNo: z.number(),
  slNo: z.number(),
  party: z.string(),
  alliance: allianceIdSchema,
  symbol: z.string(),
  age: z.number(),
  gender: z.enum(["Male", "Female", "Third Gender"]),
  education: z.string(),
  profession: z.string().optional(),
  assets: z.string().optional(),
  criminal: z.number(),
  incumbent: z.boolean(),
});
export type Candidate = z.infer<typeof candidateSchema>;

export const constituencyResultSchema = z.object({
  acNo: z.number(),
  status: z.enum(["pending", "counting", "leading", "won"]),
  roundsCompleted: z.number(),
  roundsTotal: z.number(),
  totalVotes: z.number(),
  candidates: z.array(
    z.object({
      candidateId: z.number(),
      name: z.string(),
      party: z.string(),
      votes: z.number(),
    }),
  ),
  leader: z.object({
    candidateId: z.number(),
    party: z.string(),
    margin: z.number(),
  }).nullable(),
});
export type ConstituencyResult = z.infer<typeof constituencyResultSchema>;

export const liveResultsSchema = z.object({
  updatedAt: z.string(),
  countingStartedAt: z.string(),
  totalSeats: z.literal(234),
  majorityThreshold: z.literal(118),
  byAlliance: z.array(
    z.object({
      allianceId: allianceIdSchema,
      won: z.number(),
      leading: z.number(),
      voteShare: z.number(),
    }),
  ),
  byParty: z.array(
    z.object({
      party: z.string(),
      won: z.number(),
      leading: z.number(),
      voteShare: z.number(),
    }),
  ),
  constituencies: z.array(constituencyResultSchema),
});
export type LiveResults = z.infer<typeof liveResultsSchema>;
