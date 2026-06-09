export interface MatchMeta {
  venue: string;
  utcDate: string; // ISO 8601 UTC format
}

export const matchMetadata: Record<string, MatchMeta> = {
  // --- GROUP STAGE (72 Matches) ---
  
  // Group A (MEX, RSA, KOR, CZE)
  "GA_M1": { venue: "Estadio Azteca, Mexico City", utcDate: "2026-06-11T19:00:00Z" }, // MEX vs RSA
  "GA_M2": { venue: "Estadio Akron, Guadalajara", utcDate: "2026-06-12T02:00:00Z" }, // KOR vs CZE
  "GA_M3": { venue: "Estadio BBVA, Monterrey", utcDate: "2026-06-19T01:00:00Z" }, // MEX vs KOR
  "GA_M4": { venue: "Estadio Azteca, Mexico City", utcDate: "2026-06-18T16:00:00Z" }, // RSA vs CZE
  "GA_M5": { venue: "Estadio Akron, Guadalajara", utcDate: "2026-06-25T01:00:00Z" }, // MEX vs CZE
  "GA_M6": { venue: "Estadio Azteca, Mexico City", utcDate: "2026-06-25T01:00:00Z" }, // RSA vs KOR

  // Group B (CAN, SUI, QAT, BIH)
  "GB_M1": { venue: "BMO Field, Toronto", utcDate: "2026-06-24T19:00:00Z" }, // CAN vs SUI
  "GB_M2": { venue: "BC Place, Vancouver", utcDate: "2026-06-24T19:00:00Z" }, // QAT vs BIH
  "GB_M3": { venue: "BMO Field, Toronto", utcDate: "2026-06-18T22:00:00Z" }, // CAN vs QAT
  "GB_M4": { venue: "BC Place, Vancouver", utcDate: "2026-06-18T19:00:00Z" }, // SUI vs BIH
  "GB_M5": { venue: "BC Place, Vancouver", utcDate: "2026-06-12T19:00:00Z" }, // CAN vs BIH
  "GB_M6": { venue: "BMO Field, Toronto", utcDate: "2026-06-13T19:00:00Z" }, // SUI vs QAT

  // Group C (BRA, MAR, SCO, HAI)
  "GC_M1": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-13T22:00:00Z" }, // BRA vs MAR
  "GC_M2": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-14T01:00:00Z" }, // SCO vs HAI
  "GC_M3": { venue: "Lincoln Financial Field, Philadelphia", utcDate: "2026-06-24T22:00:00Z" }, // BRA vs SCO
  "GC_M4": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-24T22:00:00Z" }, // MAR vs HAI
  "GC_M5": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-20T00:30:00Z" }, // BRA vs HAI
  "GC_M6": { venue: "Lincoln Financial Field, Philadelphia", utcDate: "2026-06-19T22:00:00Z" }, // MAR vs SCO

  // Group D (USA, AUS, PAR, TUR)
  "GD_M1": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-19T19:00:00Z" }, // USA vs AUS
  "GD_M2": { venue: "Lumen Field, Seattle", utcDate: "2026-06-20T03:00:00Z" }, // PAR vs TUR
  "GD_M3": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-13T01:00:00Z" }, // USA vs PAR
  "GD_M4": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-14T04:00:00Z" }, // AUS vs TUR
  "GD_M5": { venue: "Lumen Field, Seattle", utcDate: "2026-06-26T02:00:00Z" }, // USA vs TUR
  "GD_M6": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-26T02:00:00Z" }, // AUS vs PAR

  // Group E (GER, CIV, ECU, CUW)
  "GE_M1": { venue: "NRG Stadium, Houston", utcDate: "2026-06-20T20:00:00Z" }, // GER vs CIV
  "GE_M2": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-21T00:00:00Z" }, // ECU vs CUW
  "GE_M3": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-06-25T20:00:00Z" }, // GER vs ECU
  "GE_M4": { venue: "NRG Stadium, Houston", utcDate: "2026-06-25T20:00:00Z" }, // CIV vs CUW
  "GE_M5": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-14T17:00:00Z" }, // GER vs CUW
  "GE_M6": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-06-14T23:00:00Z" }, // CIV vs ECU

  // Group F (NED, JPN, SWE, TUN)
  "GF_M1": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-14T20:00:00Z" }, // NED vs JPN
  "GF_M2": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-15T02:00:00Z" }, // SWE vs TUN
  "GF_M3": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-20T17:00:00Z" }, // NED vs SWE
  "GF_M4": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-21T04:00:00Z" }, // JPN vs TUN
  "GF_M5": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-25T23:00:00Z" }, // NED vs TUN
  "GF_M6": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-25T23:00:00Z" }, // JPN vs SWE

  // Group G (BEL, IRN, EGY, NZL)
  "GG_M1": { venue: "Lumen Field, Seattle", utcDate: "2026-06-21T19:00:00Z" }, // BEL vs IRN
  "GG_M2": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-22T01:00:00Z" }, // EGY vs NZL
  "GG_M3": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-15T19:00:00Z" }, // BEL vs EGY
  "GG_M4": { venue: "Lumen Field, Seattle", utcDate: "2026-06-16T01:00:00Z" }, // IRN vs NZL
  "GG_M5": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-27T03:00:00Z" }, // BEL vs NZL
  "GG_M6": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-27T03:00:00Z" }, // IRN vs EGY

  // Group H (ESP, URU, KSA, CPV)
  "GH_M1": { venue: "Arrowhead Stadium, Kansas City", utcDate: "2026-06-27T00:00:00Z" }, // ESP vs URU
  "GH_M2": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-27T00:00:00Z" }, // KSA vs CPV
  "GH_M3": { venue: "NRG Stadium, Houston", utcDate: "2026-06-21T16:00:00Z" }, // ESP vs KSA
  "GH_M4": { venue: "Arrowhead Stadium, Kansas City", utcDate: "2026-06-21T22:00:00Z" }, // URU vs CPV
  "GH_M5": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-15T16:00:00Z" }, // ESP vs CPV
  "GH_M6": { venue: "NRG Stadium, Houston", utcDate: "2026-06-15T22:00:00Z" }, // URU vs KSA

  // Group I (FRA, SEN, NOR, IRQ)
  "GI_M1": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-06-16T19:00:00Z" }, // FRA vs SEN
  "GI_M2": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-16T22:00:00Z" }, // NOR vs IRQ
  "GI_M3": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-26T19:00:00Z" }, // FRA vs NOR
  "GI_M4": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-06-26T19:00:00Z" }, // SEN vs IRQ
  "GI_M5": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-22T21:00:00Z" }, // FRA vs IRQ
  "GI_M6": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-23T00:00:00Z" }, // SEN vs NOR

  // Group J (ARG, AUT, ALG, JOR)
  "GJ_M1": { venue: "Lincoln Financial Field, Philadelphia", utcDate: "2026-06-22T17:00:00Z" }, // ARG vs AUT
  "GJ_M2": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-23T03:00:00Z" }, // ALG vs JOR
  "GJ_M3": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-17T01:00:00Z" }, // ARG vs ALG
  "GJ_M4": { venue: "Lincoln Financial Field, Philadelphia", utcDate: "2026-06-17T04:00:00Z" }, // AUT vs JOR
  "GJ_M5": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-28T02:00:00Z" }, // ARG vs JOR
  "GJ_M6": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-28T02:00:00Z" }, // AUT vs ALG

  // Group K (POR, COL, UZB, COD)
  "GK_M1": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-27T23:30:00Z" }, // POR vs COL
  "GK_M2": { venue: "NRG Stadium, Houston", utcDate: "2026-06-27T23:30:00Z" }, // UZB vs COD
  "GK_M3": { venue: "Arrowhead Stadium, Kansas City", utcDate: "2026-06-23T17:00:00Z" }, // POR vs UZB
  "GK_M4": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-24T02:00:00Z" }, // COL vs COD
  "GK_M5": { venue: "NRG Stadium, Houston", utcDate: "2026-06-17T17:00:00Z" }, // POR vs COD
  "GK_M6": { venue: "Arrowhead Stadium, Kansas City", utcDate: "2026-06-18T02:00:00Z" }, // COL vs UZB

  // Group L (ENG, CRO, PAN, GHA)
  "GL_M1": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-17T20:00:00Z" }, // ENG vs CRO
  "GL_M2": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-17T23:00:00Z" }, // PAN vs GHA
  "GL_M3": { venue: "Lumen Field, Seattle", utcDate: "2026-06-27T21:00:00Z" }, // ENG vs PAN
  "GL_M4": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-27T21:00:00Z" }, // CRO vs GHA
  "GL_M5": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-23T20:00:00Z" }, // ENG vs GHA
  "GL_M6": { venue: "Lumen Field, Seattle", utcDate: "2026-06-23T23:00:00Z" }, // CRO vs PAN

  // --- PLAYOFFS (32 Matches) ---
  "P_1": { venue: "Los Angeles Stadium", utcDate: "2026-06-28T19:00:00Z" },
  "P_2": { venue: "Boston Stadium", utcDate: "2026-06-29T20:30:00Z" },
  "P_3": { venue: "Estadio Monterrey", utcDate: "2026-06-30T01:00:00Z" },
  "P_4": { venue: "Houston Stadium", utcDate: "2026-06-29T17:00:00Z" },
  "P_5": { venue: "New York New Jersey Stadium", utcDate: "2026-06-30T21:00:00Z" },
  "P_6": { venue: "Dallas Stadium", utcDate: "2026-06-30T17:00:00Z" },
  "P_7": { venue: "Mexico City Stadium", utcDate: "2026-07-01T01:00:00Z" },
  "P_8": { venue: "Atlanta Stadium", utcDate: "2026-07-01T16:00:00Z" },
  "P_9": { venue: "San Francisco Bay Area Stadium", utcDate: "2026-07-02T00:00:00Z" },
  "P_10": { venue: "Seattle Stadium", utcDate: "2026-07-01T20:00:00Z" },
  "P_11": { venue: "Toronto Stadium", utcDate: "2026-07-02T23:00:00Z" },
  "P_12": { venue: "Los Angeles Stadium", utcDate: "2026-07-02T19:00:00Z" },
  "P_13": { venue: "BC Place Vancouver", utcDate: "2026-07-03T03:00:00Z" },
  "P_14": { venue: "Miami Stadium", utcDate: "2026-07-03T22:00:00Z" },
  "P_15": { venue: "Kansas City Stadium", utcDate: "2026-07-04T01:30:00Z" },
  "P_16": { venue: "Dallas Stadium", utcDate: "2026-07-03T18:00:00Z" },

  // Round of 16 (17-24)
  "P_17": { venue: "Philadelphia Stadium", utcDate: "2026-07-04T21:00:00Z" },
  "P_18": { venue: "Houston Stadium", utcDate: "2026-07-04T17:00:00Z" },
  "P_19": { venue: "New York New Jersey Stadium", utcDate: "2026-07-05T20:00:00Z" },
  "P_20": { venue: "Mexico City Stadium", utcDate: "2026-07-06T00:00:00Z" },
  "P_21": { venue: "Dallas Stadium", utcDate: "2026-07-06T19:00:00Z" },
  "P_22": { venue: "Seattle Stadium", utcDate: "2026-07-07T00:00:00Z" },
  "P_23": { venue: "Atlanta Stadium", utcDate: "2026-07-07T16:00:00Z" },
  "P_24": { venue: "BC Place Vancouver", utcDate: "2026-07-07T20:00:00Z" },

  // Quarter-finals (25-28)
  "P_25": { venue: "Boston Stadium", utcDate: "2026-07-09T20:00:00Z" },
  "P_26": { venue: "Los Angeles Stadium", utcDate: "2026-07-10T19:00:00Z" },
  "P_27": { venue: "Miami Stadium", utcDate: "2026-07-11T21:00:00Z" },
  "P_28": { venue: "Kansas City Stadium", utcDate: "2026-07-12T01:00:00Z" },

  // Semi-finals (29-30)
  "P_29": { venue: "Dallas Stadium", utcDate: "2026-07-14T19:00:00Z" },
  "P_30": { venue: "Atlanta Stadium", utcDate: "2026-07-15T19:00:00Z" },

  // Third Place (31) & Final (32)
  "P_31": { venue: "Miami Stadium", utcDate: "2026-07-18T21:00:00Z" },
  "P_32": { venue: "New York New Jersey Stadium", utcDate: "2026-07-19T19:00:00Z" },
};