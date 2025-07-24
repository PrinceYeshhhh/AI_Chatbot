import fetch from 'node-fetch';

export async function evaluateLLMResponse({ user_query, retrieved_context, llm_response }: {
  user_query: string;
  retrieved_context: string;
  llm_response: string;
}): Promise<{ rating_score: number; hallucination: boolean; summary_feedback: string }> {
  const systemPrompt = `You are an expert AI response evaluator. Given a user query, the retrieved context (from files or memory), and the AI's response, grade the response on:
- Query relevance
- Source grounding (does it use the provided context, or hallucinate?)
- Clarity and correctness

Return a JSON object with:
- rating_score: number (0-10, 10=perfect, 0=hallucinated/irrelevant)
- hallucination: boolean (true if answer is not grounded in context)
- summary_feedback: string (explain why the answer is good or bad)
`;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `User Query: ${user_query}
Retrieved Context: ${retrieved_context}
AI Response: ${llm_response}

Evaluate this response.` }
  ];
  
  try {
    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env['GROQ_API_KEY']}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages,
        temperature: 0,
        max_tokens: 256,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const evalResult = data.choices?.[0]?.message?.content;
    
    try {
      const json = JSON.parse(evalResult);
      return {
        rating_score: json.rating_score,
        hallucination: json.hallucination,
        summary_feedback: json.summary_feedback
      };
    } catch (e) {
      return {
        rating_score: 5,
        hallucination: false,
        summary_feedback: 'Could not parse evaluation result.'
      };
    }
  } catch (error) {
    console.error('Evaluation error:', error);
    return {
      rating_score: 5,
      hallucination: false,
      summary_feedback: 'Evaluation service unavailable.'
    };
  }
} 