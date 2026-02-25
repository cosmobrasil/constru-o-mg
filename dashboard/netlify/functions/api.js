const { Client } = require('pg');

exports.handler = async (event, context) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Query to aggregate data
    const query = `
      SELECT 
        r.sector,
        resp.question_id,
        resp.megatrend,
        resp.factor,
        COUNT(resp.id) as total_votes,
        AVG(resp.relevance)::NUMERIC(10,2) as avg_relevance,
        AVG(resp.uncertainty)::NUMERIC(10,2) as avg_uncertainty
      FROM responses resp
      JOIN respondents r ON resp.respondent_id = r.id
      GROUP BY r.sector, resp.question_id, resp.megatrend, resp.factor
      ORDER BY r.sector, resp.question_id;
    `;

    const result = await client.query(query);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // Allow CORS for development
      },
      body: JSON.stringify(result.rows)
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.end();
  }
};
