export interface MatchMeta {
  venue: string;
  utcDate: string; // ISO 8601 UTC format
}

export const matchMetadata: Record<string, MatchMeta> = {
  // --- GROUP STAGE (72 Matches) ---
  "GA_M1": { venue: "Estadio Azteca, Mexico City", utcDate: "2026-06-11T20:00:00Z" },
  "GA_M2": { venue: "Estadio Akron, Guadalajara", utcDate: "2026-06-11T23:00:00Z" },
  "GA_M3": { venue: "Estadio BBVA, Monterrey", utcDate: "2026-06-18T19:00:00Z" },
  "GA_M4": { venue: "Estadio Azteca, Mexico City", utcDate: "2026-06-18T22:00:00Z" },
  "GA_M5": { venue: "Estadio Akron, Guadalajara", utcDate: "2026-06-24T20:00:00Z" },
  "GA_M6": { venue: "Estadio Azteca, Mexico City", utcDate: "2026-06-24T20:00:00Z" },
  "GB_M1": { venue: "BMO Field, Toronto", utcDate: "2026-06-12T19:00:00Z" },
  "GB_M2": { venue: "BC Place, Vancouver", utcDate: "2026-06-12T22:00:00Z" },
  "GB_M3": { venue: "BMO Field, Toronto", utcDate: "2026-06-18T19:00:00Z" },
  "GB_M4": { venue: "BC Place, Vancouver", utcDate: "2026-06-18T22:00:00Z" },
  "GB_M5": { venue: "BC Place, Vancouver", utcDate: "2026-06-24T20:00:00Z" },
  "GB_M6": { venue: "BMO Field, Toronto", utcDate: "2026-06-24T20:00:00Z" },
  "GC_M1": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-13T17:00:00Z" },
  "GC_M2": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-13T20:00:00Z" },
  "GC_M3": { venue: "Lincoln Financial Field, Philadelphia", utcDate: "2026-06-19T18:00:00Z" },
  "GC_M4": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-19T21:00:00Z" },
  "GC_M5": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-24T18:00:00Z" },
  "GC_M6": { venue: "Lincoln Financial Field, Philadelphia", utcDate: "2026-06-24T18:00:00Z" },
  "GD_M1": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-12T21:00:00Z" },
  "GD_M2": { venue: "Lumen Field, Seattle", utcDate: "2026-06-13T00:00:00Z" },
  "GD_M3": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-19T19:00:00Z" },
  "GD_M4": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-19T22:00:00Z" },
  "GD_M5": { venue: "Lumen Field, Seattle", utcDate: "2026-06-26T21:00:00Z" },
  "GD_M6": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-26T21:00:00Z" },
  "GE_M1": { venue: "NRG Stadium, Houston", utcDate: "2026-06-14T17:00:00Z" },
  "GE_M2": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-14T20:00:00Z" },
  "GE_M3": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-06-20T18:00:00Z" },
  "GE_M4": { venue: "NRG Stadium, Houston", utcDate: "2026-06-20T21:00:00Z" },
  "GE_M5": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-25T18:00:00Z" },
  "GE_M6": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-06-25T18:00:00Z" },
  "GF_M1": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-14T19:00:00Z" },
  "GF_M2": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-14T22:00:00Z" },
  "GF_M3": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-20T19:00:00Z" },
  "GF_M4": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-20T22:00:00Z" },
  "GF_M5": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-25T20:00:00Z" },
  "GF_M6": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-25T20:00:00Z" },
  "GG_M1": { venue: "Lumen Field, Seattle", utcDate: "2026-06-15T18:00:00Z" },
  "GG_M2": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-15T21:00:00Z" },
  "GG_M3": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-21T18:00:00Z" },
  "GG_M4": { venue: "Lumen Field, Seattle", utcDate: "2026-06-21T21:00:00Z" },
  "GG_M5": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-26T18:00:00Z" },
  "GG_M6": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-26T18:00:00Z" },
  "GH_M1": { venue: "Arrowhead Stadium, Kansas City", utcDate: "2026-06-15T19:00:00Z" },
  "GH_M2": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-15T22:00:00Z" },
  "GH_M3": { venue: "NRG Stadium, Houston", utcDate: "2026-06-21T19:00:00Z" },
  "GH_M4": { venue: "Arrowhead Stadium, Kansas City", utcDate: "2026-06-21T22:00:00Z" },
  "GH_M5": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-27T20:00:00Z" },
  "GH_M6": { venue: "NRG Stadium, Houston", utcDate: "2026-06-27T20:00:00Z" },
  "GI_M1": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-06-16T17:00:00Z" },
  "GI_M2": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-16T20:00:00Z" },
  "GI_M3": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-22T18:00:00Z" },
  "GI_M4": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-06-22T21:00:00Z" },
  "GI_M5": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-27T18:00:00Z" },
  "GI_M6": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-27T18:00:00Z" },
  "GJ_M1": { venue: "Lincoln Financial Field, Philadelphia", utcDate: "2026-06-16T19:00:00Z" },
  "GJ_M2": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-16T22:00:00Z" },
  "GJ_M3": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-22T19:00:00Z" },
  "GJ_M4": { venue: "Lincoln Financial Field, Philadelphia", utcDate: "2026-06-22T22:00:00Z" },
  "GJ_M5": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-27T20:00:00Z" },
  "GJ_M6": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-06-27T20:00:00Z" },
  "GK_M1": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-17T17:00:00Z" },
  "GK_M2": { venue: "NRG Stadium, Houston", utcDate: "2026-06-17T20:00:00Z" },
  "GK_M3": { venue: "Arrowhead Stadium, Kansas City", utcDate: "2026-06-23T18:00:00Z" },
  "GK_M4": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-23T21:00:00Z" },
  "GK_M5": { venue: "NRG Stadium, Houston", utcDate: "2026-06-27T18:00:00Z" },
  "GK_M6": { venue: "Arrowhead Stadium, Kansas City", utcDate: "2026-06-27T18:00:00Z" },
  "GL_M1": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-17T19:00:00Z" },
  "GL_M2": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-17T22:00:00Z" },
  "GL_M3": { venue: "Lumen Field, Seattle", utcDate: "2026-06-23T19:00:00Z" },
  "GL_M4": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-23T22:00:00Z" },
  "GL_M5": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-06-27T20:00:00Z" },
  "GL_M6": { venue: "Lumen Field, Seattle", utcDate: "2026-06-27T20:00:00Z" },

  // --- PLAYOFFS (32 Matches) ---
  // Round of 32 (Mapped directly to our array positions 1-16)
  "P_1": { venue: "Gillette Stadium, Boston", utcDate: "2026-06-28T18:00:00Z" }, // M74
  "P_2": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-06-30T18:00:00Z" }, // M77
  "P_3": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-06-28T22:00:00Z" }, // M73
  "P_4": { venue: "Estadio BBVA, Monterrey", utcDate: "2026-06-29T20:00:00Z" }, // M75
  "P_5": { venue: "NRG Stadium, Houston", utcDate: "2026-07-02T19:00:00Z" }, // M83
  "P_6": { venue: "Estadio Azteca, Mexico City", utcDate: "2026-07-02T22:00:00Z" }, // M84
  "P_7": { venue: "AT&T Stadium, Dallas", utcDate: "2026-07-01T20:00:00Z" }, // M81
  "P_8": { venue: "BC Place, Vancouver", utcDate: "2026-07-01T23:00:00Z" }, // M82
  "P_9": { venue: "NRG Stadium, Houston", utcDate: "2026-06-29T23:00:00Z" }, // M76
  "P_10": { venue: "AT&T Stadium, Dallas", utcDate: "2026-06-30T22:00:00Z" }, // M78
  "P_11": { venue: "Estadio Azteca, Mexico City", utcDate: "2026-06-30T19:00:00Z" }, // M79
  "P_12": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-07-01T18:00:00Z" }, // M80
  "P_13": { venue: "Levi's Stadium, San Francisco Bay Area", utcDate: "2026-07-03T19:00:00Z" }, // M85
  "P_14": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-07-03T22:00:00Z" }, // M87
  "P_15": { venue: "Arrowhead Stadium, Kansas City", utcDate: "2026-07-02T18:00:00Z" }, // M86
  "P_16": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-07-03T18:00:00Z" }, // M88

  // Round of 16 (17-24)
  "P_17": { venue: "Lincoln Financial Field, Philadelphia", utcDate: "2026-07-04T18:00:00Z" },
  "P_18": { venue: "NRG Stadium, Houston", utcDate: "2026-07-04T22:00:00Z" },
  "P_19": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-07-05T18:00:00Z" },
  "P_20": { venue: "Estadio Azteca, Mexico City", utcDate: "2026-07-05T22:00:00Z" },
  "P_21": { venue: "AT&T Stadium, Dallas", utcDate: "2026-07-06T18:00:00Z" },
  "P_22": { venue: "Lumen Field, Seattle", utcDate: "2026-07-06T22:00:00Z" },
  "P_23": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-07-07T18:00:00Z" },
  "P_24": { venue: "BC Place, Vancouver", utcDate: "2026-07-07T22:00:00Z" },

  // Quarter-finals (25-28)
  "P_25": { venue: "Gillette Stadium, Boston", utcDate: "2026-07-09T18:00:00Z" },
  "P_26": { venue: "SoFi Stadium, Los Angeles", utcDate: "2026-07-10T22:00:00Z" },
  "P_27": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-07-11T18:00:00Z" },
  "P_28": { venue: "Arrowhead Stadium, Kansas City", utcDate: "2026-07-11T22:00:00Z" },

  // Semi-finals (29-30)
  "P_29": { venue: "AT&T Stadium, Dallas", utcDate: "2026-07-14T20:00:00Z" },
  "P_30": { venue: "Mercedes-Benz Stadium, Atlanta", utcDate: "2026-07-15T20:00:00Z" },

  // Third Place (31) & Final (32)
  "P_31": { venue: "Hard Rock Stadium, Miami", utcDate: "2026-07-18T20:00:00Z" },
  "P_32": { venue: "MetLife Stadium, New York/NJ", utcDate: "2026-07-19T20:00:00Z" },
};