import type { Party } from "./types";

export const PARTIES: Party[] = [
  { id: "dmk", code: "DMK", name: "Dravida Munnetra Kazhagam", alliance: "spa", color: "#E53935", seatsContested: 176, type: "State Party", leader: "M.K. Stalin", won2021: 133 },
  { id: "inc", code: "INC", name: "Indian National Congress", alliance: "spa", color: "#1565C0", seatsContested: 28, type: "National Party", leader: "K. Selvaperunthagai", won2021: 18 },
  { id: "vck", code: "VCK", name: "Viduthalai Chiruthaigal Katchi", alliance: "spa", color: "#1E90FF", seatsContested: 8, type: "State Party", leader: "Thol. Thirumavalavan", won2021: 4 },
  { id: "cpi", code: "CPI", name: "Communist Party of India", alliance: "spa", color: "#B71C1C", seatsContested: 5, type: "National Party", leader: "R. Mutharasan", won2021: 2 },
  { id: "cpim", code: "CPI(M)", name: "Communist Party of India (Marxist)", alliance: "spa", color: "#C62828", seatsContested: 5, type: "National Party", leader: "K. Balakrishnan", won2021: 2 },
  { id: "iuml", code: "IUML", name: "Indian Union Muslim League", alliance: "spa", color: "#006600", seatsContested: 2, type: "State Party - Other", leader: "K.M. Kader Mohideen", won2021: 0 },
  { id: "dmdk", code: "DMDK", name: "Desiya Murpokku Dravida Kazhagam", alliance: "spa", color: "#F57C00", seatsContested: 10, type: "State Party", leader: "Premalatha Vijayakant", won2021: 0 },
  { id: "aiadmk", code: "AIADMK", name: "All India Anna Dravida Munnetra Kazhagam", alliance: "nda", color: "#43A047", seatsContested: 172, type: "State Party", leader: "K. Palaniswami", won2021: 66 },
  { id: "bjp", code: "BJP", name: "Bharatiya Janata Party", alliance: "nda", color: "#FF6F00", seatsContested: 33, type: "National Party", leader: "Nainar Nagendran", won2021: 4 },
  { id: "pmk", code: "PMK", name: "Pattali Makkal Katchi", alliance: "nda", color: "#FFB300", seatsContested: 18, type: "Unrecognised", leader: "Anbumani Ramadoss", won2021: 5 },
  { id: "ammk", code: "AMMK", name: "Amma Makkal Munnettra Kazagam", alliance: "nda", color: "#388E3C", seatsContested: 11, type: "Unrecognised", leader: "T.T.V. Dhinakaran" },
  { id: "tvk", code: "TVK", name: "Tamilaga Vettri Kazhagam", alliance: "tvk", color: "#A67C00", seatsContested: 233, type: "Unrecognised", leader: "Vijay" },
  { id: "ntk", code: "NTK", name: "Naam Tamilar Katchi", alliance: "ntk", color: "#B31818", seatsContested: 234, type: "State Party", leader: "Seeman" },
  { id: "ajpk", code: "AJPK", name: "Aanaithinthiya Jananayaka Pathukappu Kazhagam", alliance: "ajpk", color: "#F1C40F", seatsContested: 29, type: "Unrecognised", leader: "S. Ramadoss" },
  { id: "aiptmmk", code: "AIPTMMK", name: "All India Puratchi Thalaivar Makkal Munnettra Kazhagam", alliance: "ajpk", color: "#16A085", seatsContested: 78, type: "Unrecognised", leader: "V.K. Sasikala" },
  { id: "bsp", code: "BSP", name: "Bahujan Samaj Party", alliance: "others", color: "#1565C0", seatsContested: 160, type: "National Party", leader: "H. Anandan" },
  { id: "tavk", code: "TAVK", name: "Tamizhaga Vaazhvurimai Katchi", alliance: "others", color: "#7B1FA2", seatsContested: 20, type: "Unrecognised", leader: "T. Velmurugan" },
  { id: "pt", code: "PT", name: "Puthiya Tamilagam", alliance: "others", color: "#D32F2F", seatsContested: 10, type: "Unrecognised", leader: "K. Krishnasamy" },
  { id: "oth", code: "OTH", name: "Other Parties", alliance: "others", color: "#607D8B", seatsContested: 0, type: "Unrecognised", leader: "—" },
  { id: "ind", code: "IND", name: "Independent", alliance: "independent", color: "#757575", seatsContested: 0, type: "Independent", leader: "—" },
];

export const PARTY_BY_CODE: Record<string, Party> = Object.fromEntries(
  PARTIES.map((p) => [p.code, p]),
);

export function partyColor(code: string): string {
  return PARTY_BY_CODE[code]?.color ?? "#94A3B8";
}
