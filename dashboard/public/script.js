document.addEventListener('DOMContentLoaded', async () => {
    const ctx = document.getElementById('foresightChart').getContext('2d');
    let chartInstance = null;
    let allData = [];

    // Elements
    const sectorFilter = document.getElementById('sectorFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    const tableBody = document.querySelector('#dataTable tbody');
    const generateAnalysisBtn = document.getElementById('generateAnalysisBtn');
    const aiAnalysisContent = document.getElementById('aiAnalysisContent');

    // Fetch Data
    async function fetchData() {
        try {
            const response = await fetch('/.netlify/functions/api');
            if (!response.ok) throw new Error('Erro na API');
            allData = await response.json();
            
            populateSectorFilter(allData);
            updateDashboard();
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            alert('Falha ao carregar dados do servidor.');
        }
    }

    function populateSectorFilter(data) {
        const sectors = [...new Set(data.map(item => item.sector))];
        sectorFilter.innerHTML = '<option value="all">Todos os Setores</option>';
        sectors.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector;
            option.textContent = sector.charAt(0).toUpperCase() + sector.slice(1);
            sectorFilter.appendChild(option);
        });
    }

    function updateDashboard() {
        const selectedSector = sectorFilter.value;
        const filteredData = selectedSector === 'all' 
            ? allData 
            : allData.filter(item => item.sector === selectedSector);

        renderChart(filteredData);
        renderTable(filteredData);
        
        // Reset AI analysis when view changes
        aiAnalysisContent.textContent = 'Clique no botão acima para gerar uma análise interpretativa dos dados visíveis no gráfico.';
    }

    function renderChart(data) {
        if (chartInstance) {
            chartInstance.destroy();
        }

        // Map data to chart points
        const points = data.map(item => ({
            x: parseFloat(item.avg_uncertainty),
            y: parseFloat(item.avg_relevance),
            feature: item.factor, // Custom property for tooltip
            sector: item.sector
        }));

        // Quadrant colors logic
        const backgroundColors = points.map(p => {
            if (p.x < 2 && p.y >= 2) return '#4CAF50'; // Q1: Prioridade (Baixa Inc, Alta Rel)
            if (p.x >= 2 && p.y >= 2) return '#FFC107'; // Q2: Aposta (Alta Inc, Alta Rel)
            if (p.x >= 2 && p.y < 2) return '#FF5722'; // Q3: Sinal Fraco (Alta Inc, Baixa Rel)
            return '#9E9E9E'; // Q4: Irrelevante (Baixa Inc, Baixa Rel)
        });

        chartInstance = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Soluções Tecnológicas',
                    data: points,
                    backgroundColor: backgroundColors,
                    pointRadius: 8,
                    pointHoverRadius: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: 'Incerteza (Média)', font: { size: 14, weight: 'bold' } },
                        min: 1,
                        max: 3,
                        grid: {
                            color: (context) => context.tick.value === 2 ? '#000' : '#ddd', // Highlight center line
                            lineWidth: (context) => context.tick.value === 2 ? 2 : 1
                        }
                    },
                    y: {
                        title: { display: true, text: 'Relevância (Média)', font: { size: 14, weight: 'bold' } },
                        min: 1,
                        max: 3,
                        grid: {
                            color: (context) => context.tick.value === 2 ? '#000' : '#ddd',
                            lineWidth: (context) => context.tick.value === 2 ? 2 : 1
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return `${point.feature.substring(0, 50)}... (${point.sector})`;
                            },
                            afterLabel: function(context) {
                                const point = context.raw;
                                return `Inc: ${point.x}, Rel: ${point.y}`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: 2,
                                yMax: 2,
                                borderColor: 'black',
                                borderWidth: 2,
                                label: { content: 'Média', enabled: true }
                            },
                            line2: {
                                type: 'line',
                                xMin: 2,
                                xMax: 2,
                                borderColor: 'black',
                                borderWidth: 2
                            }
                        }
                    }
                }
            }
        });
    }

    function renderTable(data) {
        tableBody.innerHTML = '';
        data.forEach(item => {
            const row = document.createElement('tr');
            
            const relevance = parseFloat(item.avg_relevance);
            const uncertainty = parseFloat(item.avg_uncertainty);
            
            // Calculate "Strategic Index" (Simple ratio as requested initially, or Quadrant Logic)
            // Let's use Quadrant Logic for display text
            let priorityText = '';
            let priorityClass = '';
            
            if (uncertainty < 2 && relevance >= 2) { priorityText = 'Prioridade Imediata'; priorityClass = 'priority-high'; }
            else if (uncertainty >= 2 && relevance >= 2) { priorityText = 'Aposta Estratégica'; priorityClass = 'priority-medium'; }
            else if (uncertainty >= 2 && relevance < 2) { priorityText = 'Sinal Fraco'; priorityClass = 'priority-low'; }
            else { priorityText = 'Irrelevante'; priorityClass = 'priority-low'; }

            row.innerHTML = `
                <td>${item.sector}</td>
                <td>${item.question_id}</td>
                <td>${item.factor}</td>
                <td>${relevance.toFixed(2)}</td>
                <td>${uncertainty.toFixed(2)}</td>
                <td>${item.total_votes}</td>
                <td class="${priorityClass}">${priorityText}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // AI Analysis Button Handler
    generateAnalysisBtn.addEventListener('click', async () => {
        const selectedSector = sectorFilter.value;
        const filteredData = selectedSector === 'all' 
            ? allData 
            : allData.filter(item => item.sector === selectedSector);

        if (filteredData.length === 0) {
            alert('Não há dados para analisar.');
            return;
        }

        aiAnalysisContent.innerHTML = '<em>Gerando análise com Inteligência Artificial... Aguarde...</em>';
        generateAnalysisBtn.disabled = true;

        try {
            const response = await fetch('/.netlify/functions/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sector: selectedSector === 'all' ? 'Todos os Setores' : selectedSector,
                    items: filteredData
                })
            });

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            // Convert newlines to <br> for HTML display
            aiAnalysisContent.innerHTML = result.analysis.replace(/\n/g, '<br>');

        } catch (error) {
            console.error('Erro na análise:', error);
            aiAnalysisContent.textContent = 'Erro ao gerar análise: ' + error.message;
        } finally {
            generateAnalysisBtn.disabled = false;
        }
    });

    // Event Listeners
    sectorFilter.addEventListener('change', updateDashboard);
    refreshBtn.addEventListener('click', fetchData);

    // Initial Load
    fetchData();
});
