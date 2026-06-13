const fs = require('fs');
const metaPath = 'Client/src/data/matchMetadata.ts';
let metaLines = fs.readFileSync(metaPath, 'utf8').split('\n');

const initialDataSrc = fs.readFileSync('Client/src/lib/initialData.ts', 'utf8');
const match = initialDataSrc.match(/const groupMatchupPatterns[\s\S]*?};/);
const evalStr = match[0].replace('const groupMatchupPatterns: Record<string, number[][]> =', 'module.exports =');
fs.writeFileSync('tempPatterns.js', evalStr);
const patterns = require('./tempPatterns.js');

const groupsData = {
    A: ['MEX', 'RSA', 'KOR', 'CZE'], B: ['CAN', 'SUI', 'QAT', 'BIH'],
    C: ['BRA', 'MAR', 'SCO', 'HAI'], D: ['USA', 'AUS', 'PAR', 'TUR'],
    E: ['GER', 'CIV', 'ECU', 'CUW'], F: ['NED', 'JPN', 'SWE', 'TUN'],
    G: ['BEL', 'IRN', 'EGY', 'NZL'], H: ['ESP', 'URU', 'KSA', 'CPV'],
    I: ['FRA', 'SEN', 'NOR', 'IRQ'], J: ['ARG', 'AUT', 'ALG', 'JOR'],
    K: ['POR', 'COL', 'UZB', 'COD'], L: ['ENG', 'CRO', 'PAN', 'GHA']
};

const oldMappings = {};

for (const line of metaLines) {
    const l = line.trim();
    const m = l.match(/"G([A-L])_M\d": \{ venue: "(.*?)", utcDate: "(.*?)" \}, \/\/ (.*?) vs (.*?)$/);
    if (m) {
        let [_, g, venue, date, t1, t2] = m;
        t1 = t1.trim();
        t2 = t2.trim();
        oldMappings[`${t1}_${t2}`] = { venue, date, t1, t2 };
        oldMappings[`${t2}_${t1}`] = { venue, date, t1, t2 };
    }
}

let newMeta = `export interface MatchMeta {\n  venue: string;\n  utcDate: string; // ISO 8601 UTC format\n}\n\nexport const matchMetadata: Record<string, MatchMeta> = {\n  // --- GROUP STAGE (72 Matches) ---\n`;

for (const g of Object.keys(groupsData)) {
    newMeta += `\n  // Group ${g}\n`;
    const p = patterns[g];
    const teams = groupsData[g];
    for (let i=0; i<6; i++) {
        const t1 = teams[p[i][0]];
        const t2 = teams[p[i][1]];
        const old = oldMappings[`${t1}_${t2}`];
        if (!old) {
            console.log(`MISSING: ${t1} vs ${t2} in Group ${g}`);
            process.exit(1);
        }
        newMeta += `  "G${g}_M${i+1}": { venue: "${old.venue}", utcDate: "${old.date}" }, // ${t1} vs ${t2}\n`;
    }
}

let inPlayoffs = false;
for (const line of metaLines) {
    if (line.includes('PLAYOFFS')) inPlayoffs = true;
    if (inPlayoffs) newMeta += line + '\n';
}

fs.writeFileSync('Client/src/data/matchMetadata.ts', newMeta);
console.log('Fixed matchMetadata.ts');
