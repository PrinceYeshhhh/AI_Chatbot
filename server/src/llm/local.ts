// Local LLM integration (Ollama, Llama.cpp, etc.)
// Loads endpoint from process.env.LOCAL_LLM_URL

export async function callLocalLLM(model: string, messages: any[], options: any = {}) {
  const url = process.env['LOCAL_LLM_URL'];
  if (!url) throw new Error('LOCAL_LLM_URL not set');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, ...options })
  });
  if (!response.ok) throw new Error('Local LLM call failed');
  const data = await response.json();
  return data;
} 