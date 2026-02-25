
const fs = require('fs');
const path = require('path');

const csvPath = '/Users/pvolkermini/Library/Mobile Documents/com~apple~CloudDocs/APP DEV/FORESIGHT 2026/CENARIO EMPRESARIAL/construcao-dv.csv';
// Changed to .js for global variable loading (avoids CORS)
const outputPath = '/Users/pvolkermini/Library/Mobile Documents/com~apple~CloudDocs/APP DEV/FORESIGHT 2026/CENARIO EMPRESARIAL/dashboard/dashboard_data.js';

const content = fs.readFileSync(csvPath, { encoding: 'latin1' });
const lines = content.split('\n');

const stats = {
    total: 0,
    bairros: {},
    cnae: {},
    porte: {},
    tempoAbertura: {},
    capitalSocial: {
        total: 0,
        ranges: {
            'Até 10k': 0,
            '10k - 50k': 0,
            '50k - 100k': 0,
            '100k - 500k': 0,
            'Acima de 500k': 0
        }
    },
    faturamento: {},
    colaboradores: {},
    faixaEtaria: {}
};

const currentYear = new Date().getFullYear();

for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const cols = lines[i].split(';');
    if (cols.length < 40) continue;

    stats.total++;

    const bairro = cols[7]?.replace(/"/g, '').trim() || 'NÃO INFORMADO';
    stats.bairros[bairro] = (stats.bairros[bairro] || 0) + 1;

    const cnae = cols[17]?.replace(/"/g, '').trim() || 'OUTROS';
    stats.cnae[cnae] = (stats.cnae[cnae] || 0) + 1;

    const porte = cols[29]?.replace(/"/g, '').trim() || 'NÃO INFORMADO';
    stats.porte[porte] = (stats.porte[porte] || 0) + 1;

    const dataInicio = cols[24]?.replace(/"/g, '').trim();
    if (dataInicio && dataInicio.includes('/')) {
        const year = parseInt(dataInicio.split('/')[2]);
        const age = currentYear - year;
        let range = 'Desconhecido';
        if (age <= 1) range = 'Até 1 ano';
        else if (age <= 3) range = '1-3 anos';
        else if (age <= 5) range = '3-5 anos';
        else if (age <= 10) range = '5-10 anos';
        else range = 'Acima de 10 anos';
        stats.tempoAbertura[range] = (stats.tempoAbertura[range] || 0) + 1;
    }

    let capStr = cols[33]?.replace(/"/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    let cap = parseFloat(capStr);
    if (!isNaN(cap)) {
        stats.capitalSocial.total += cap;
        if (cap <= 10000) stats.capitalSocial.ranges['Até 10k']++;
        else if (cap <= 50000) stats.capitalSocial.ranges['10k - 50k']++;
        else if (cap <= 100000) stats.capitalSocial.ranges['50k - 100k']++;
        else if (cap <= 500000) stats.capitalSocial.ranges['100k - 500k']++;
        else stats.capitalSocial.ranges['Acima de 500k']++;
    }

    const fat = cols[40]?.replace(/"/g, '').trim() || 'NÃO INFORMADO';
    stats.faturamento[fat] = (stats.faturamento[fat] || 0) + 1;

    const colab = cols[41]?.replace(/"/g, '').trim() || 'NÃO INFORMADO';
    stats.colaboradores[colab] = (stats.colaboradores[colab] || 0) + 1;

    const faixaRaw = cols[36]?.replace(/"/g, '').trim();
    if (faixaRaw && faixaRaw !== 'NÃO INFORMADO') {
        const parts = faixaRaw.split('-').map(p => p.trim()).filter(p => p && p !== 'NAO SE APLICA');
        parts.forEach(p => {
            stats.faixaEtaria[p] = (stats.faixaEtaria[p] || 0) + 1;
        });
    }
}

const getTop = (obj, limit = 50) => {
    return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});
};

stats.bairros = getTop(stats.bairros, 50);
stats.cnae = getTop(stats.cnae, 50);

// Wrap in a global constant
const jsContent = `window.DASHBOARD_DATA = ${JSON.stringify(stats, null, 2)};`;
fs.writeFileSync(outputPath, jsContent);
console.log('Stats generated at ' + outputPath);
