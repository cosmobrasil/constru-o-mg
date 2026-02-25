exports.handler = async (event, context) => {
  const apiKey = process.env.OPENAI_API_KEY;

  console.log('--- Debug Analyze Function ---');
  console.log('API Key Length:', apiKey ? apiKey.length : 0);
  console.log('API Key Start:', apiKey ? apiKey.substring(0, 10) : 'N/A');

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OPENAI_API_KEY não configurada.' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const sector = data.sector || 'Geral';
    const items = data.items || [];

    // Construct the prompt
    let promptData = items.map(item => 
      `- ${item.factor}: Relevância ${item.avg_relevance}, Incerteza ${item.avg_uncertainty}`
    ).join('\n');

    const systemPrompt = `Você é um Consultor Sênior de Foresight Estratégico. 
    Sua missão é analisar dados de um Radar de Prospectiva para o setor de ${sector}.
    
    Os dados consistem em "Soluções Tecnológicas" avaliadas em duas dimensões (1 a 3):
    - Relevância (Impacto): Quanto maior, mais importante.
    - Incerteza (Grau de Desconhecimento/Risco): Quanto maior, mais incerto.

    Classificação:
    - Alta Relevância (>=2) e Baixa Incerteza (<2): Prioridade Imediata (Fazer já).
    - Alta Relevância (>=2) e Alta Incerteza (>=2): Apostas Estratégicas (Inovar/Monitorar).
    - Baixa Relevância e Alta Incerteza: Sinais Fracos.
    - Baixa Relevância e Baixa Incerteza: Irrelevante.

    Analise os dados fornecidos e gere um relatório conciso (max 3 parágrafos) destacando:
    1. Quais são as grandes apostas (Oportunidades de Inovação)?
    2. O que é "arroz com feijão" (Prioridade Imediata)?
    3. Uma recomendação estratégica final.
    
    Use tom profissional, direto e estratégico.`;

    const userMessage = `Aqui estão os dados coletados:\n${promptData}`;

    // Call OpenAI API using fetch (no external dependency needed for Node 18+)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const result = await response.json();

    if (result.error) {
        throw new Error(result.error.message);
    }

    const analysis = result.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ analysis })
    };

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
