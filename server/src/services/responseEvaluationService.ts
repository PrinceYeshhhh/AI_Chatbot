import { LLMService } from './llmService';
import { NeonDatabaseService } from './neonDatabaseService';
import { sanitizePromptInput } from './gptService';

const llmService = new LLMService();
const dbService = new NeonDatabaseService();

export interface EvaluationResult {
  score: number;
  flagged: boolean;
  reason: string;
  maxSimilarity: number;
}

export async function evaluateResponse(response: string, criteria: string): Promise<EvaluationResult> {
  try {
    const safeResponse = sanitizePromptInput(response);
    const safeCriteria = sanitizePromptInput(criteria);
    // Use the new LLM service for evaluation
    const evaluationPrompt = `Evaluate this response based on: ${safeCriteria}

Response: ${safeResponse}

Provide a score from 1-10, whether it should be flagged (true/false), and a brief reason.`;
    // Log prompt for audit/debug (PII redacted)
    console.info(`[LLM PROMPT] Evaluation: prompt=${evaluationPrompt.slice(0, 200)}...`);

    const result = await llmService.evaluateResponse(response, criteria);
    
    // Parse the evaluation result
    const content = result.content || '';
    const scoreMatch = content.match(/score[:\s]*(\d+)/i);
    const flaggedMatch = content.match(/flagged[:\s]*(true|false)/i);
    const reasonMatch = content.match(/reason[:\s]*(.+?)(?:\n|$)/i);
    
    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 5,
      flagged: flaggedMatch ? flaggedMatch[1].toLowerCase() === 'true' : false,
      reason: reasonMatch ? reasonMatch[1].trim() : 'No reason provided',
      maxSimilarity: 0.8 // Placeholder
    };
  } catch (error) {
    console.error('Response evaluation error:', error);
    return {
      score: 5,
      flagged: false,
      reason: 'Evaluation failed',
      maxSimilarity: 0
    };
  }
}

export async function updateUserFeedback(userId: string, messageId: string, feedback: any): Promise<void> {
  try {
    const query = `
      INSERT INTO user_feedback (user_id, message_id, feedback_data, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, message_id) 
      DO UPDATE SET feedback_data = $3, updated_at = CURRENT_TIMESTAMP;
    `;
    
    await dbService.query(query, [userId, messageId, JSON.stringify(feedback)]);
  } catch (error) {
    console.error('Failed to update user feedback:', error);
    throw error;
  }
} 