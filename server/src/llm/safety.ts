// Safety middleware for LLM outputs
// Scans for bias, toxicity, and misinformation

export async function checkSafety(text: string): Promise<{ safe: boolean, issues: string[] }> {
  // TODO: Use OpenAI Moderation API or open-source alternatives
  // Return safe=false if issues detected
  return { safe: true, issues: [] };
} 