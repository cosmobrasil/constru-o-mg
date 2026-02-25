document.addEventListener('DOMContentLoaded', () => {
    // Register the datalabels plugin globally
    Chart.register(ChartDataLabels);

    // Access data from global window object
    const data = window.DASHBOARD_DATA;

    if (!data) {
        console.error('Dados do dashboard não encontrados.');
        return;
    }

    // Update Stat Cards
    document.getElementById('stat-total-emp').textContent = data.total.toLocaleString('pt-BR');
    document.getElementById('stat-capital-total').textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(data.capitalSocial.total);
    document.getElementById('stat-bairros-count').textContent = Object.keys(data.bairros).length;

    // Find predominant porte
    const porteEntries = Object.entries(data.porte);
    if (porteEntries.length > 0) {
        const topPorte = porteEntries.sort((a, b) => b[1] - a[1])[0][0];
        document.getElementById('stat-perfil').textContent = topPorte;
    }

    // High-level defaults for Chart.js
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = '#334155';
    const accentColors = [
        '#38bdf8', '#818cf8', '#fb7185', '#34d399', '#fbbf24',
        '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c', '#9ca3af'
    ];

    // Standard Label Configuration: Black text on White background for high contrast
    const standardLabels = {
        color: '#000000',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 4,
        padding: 4,
        font: {
            weight: 'bold',
            size: 10
        },
        formatter: (value, ctx) => {
            const dataset = ctx.chart.data.datasets[0];
            const total = dataset.data.reduce((acc, val) => acc + val, 0);
            if (total === 0) return '';
            const percentage = ((value / total) * 100).toFixed(1);
            return percentage > 1.0 ? `${percentage}%` : '';
        }
    };

    // 1. CNAE Chart (Horizontal Bar) - REMOVED LABELS DUE TO CLUTTER
    new Chart(document.getElementById('chartCnae'), {
        type: 'bar',
        data: {
            labels: Object.keys(data.cnae),
            datasets: [{
                label: 'Quantidade',
                data: Object.values(data.cnae),
                backgroundColor: '#38bdf8',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false } // Disabled for visual clarity
            },
            scales: {
                x: { grid: { color: '#334155' } },
                y: { grid: { display: false } }
            }
        }
    });

    // 2. Porte Chart (Doughnut) - KEPT LABELS
    new Chart(document.getElementById('chartPorte'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(data.porte),
            datasets: [{
                data: Object.values(data.porte),
                backgroundColor: accentColors,
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                datalabels: standardLabels
            }
        }
    });

    // 3. Bairros Chart (Vertical Bar) - REMOVED LABELS DUE TO CLUTTER
    new Chart(document.getElementById('chartBairros'), {
        type: 'bar',
        data: {
            labels: Object.keys(data.bairros),
            datasets: [{
                label: 'Empresas',
                data: Object.values(data.bairros),
                backgroundColor: '#818cf8',
                borderRadius: 4
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: false } // Disabled for visual clarity
            },
            scales: {
                y: { grid: { color: '#334155' } },
                x: { grid: { display: false } }
            }
        }
    });

    // 4. Tempo Abertura (Pie) - KEPT LABELS
    const tempoOrder = ['Até 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', 'Acima de 10 anos'];
    const tempoData = tempoOrder.map(label => data.tempoAbertura[label] || 0);

    new Chart(document.getElementById('chartTempo'), {
        type: 'pie',
        data: {
            labels: tempoOrder,
            datasets: [{
                data: tempoData,
                backgroundColor: accentColors,
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                datalabels: standardLabels
            }
        }
    });

    // 5. Capital Social ranges (Bar) - KEPT LABELS (Few categories)
    new Chart(document.getElementById('chartCapital'), {
        type: 'bar',
        data: {
            labels: Object.keys(data.capitalSocial.ranges),
            datasets: [{
                data: Object.values(data.capitalSocial.ranges),
                backgroundColor: '#fb7185',
                borderRadius: 4
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    ...standardLabels,
                    anchor: 'end',
                    align: 'top',
                }
            },
            scales: { y: { display: false } }
        }
    });

    // 6. Faturamento (Doughnut) - KEPT LABELS (Few categories)
    new Chart(document.getElementById('chartFaturamento'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(data.faturamento),
            datasets: [{
                data: Object.values(data.faturamento),
                backgroundColor: accentColors,
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: standardLabels
            }
        }
    });

    // 7. Colaboradores (Polar Area) - KEPT LABELS
    new Chart(document.getElementById('chartColab'), {
        type: 'polarArea',
        data: {
            labels: Object.keys(data.colaboradores),
            datasets: [{
                data: Object.values(data.colaboradores),
                backgroundColor: accentColors.map(c => c + 'AA'),
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                datalabels: standardLabels
            },
            scales: {
                r: { grid: { color: '#334155' }, ticks: { display: false } }
            }
        }
    });

    // 8. Faixa Etária (Bar) - KEPT LABELS
    const faixasSorted = Object.entries(data.faixaEtaria).sort((a, b) => b[1] - a[1]);
    new Chart(document.getElementById('chartFaixaEtaria'), {
        type: 'bar',
        data: {
            labels: faixasSorted.map(i => i[0]),
            datasets: [{
                data: faixasSorted.map(i => i[1]),
                backgroundColor: '#34d399',
                borderRadius: 4
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    ...standardLabels,
                    anchor: 'end',
                    align: 'top',
                }
            },
            scales: { y: { display: false } }
        }
    });
});
