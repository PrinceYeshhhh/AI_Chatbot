import { saveChatToHistory, getChatHistoryForUser } from './chatHistoryService';

// Store encrypted chat message (E2EE: only encrypted blobs)
export async function storeEncryptedMessage(userId: string, encryptedMessage: any, metadata: any) {
  // Store encrypted user message and metadata
  await saveChatToHistory({
    userId,
    encryptedQuery: encryptedMessage.encryptedQuery,
    encryptedResponse: encryptedMessage.encryptedResponse,
    matchedChunks: metadata.matchedChunks,
    model: metadata.model,
    memoryUsed: metadata.memoryUsed,
    timeTakenMs: metadata.timeTakenMs
  });
}

// Retrieve encrypted chat messages (E2EE: only encrypted blobs)
export async function getEncryptedMessages(userId: string) {
  return await getChatHistoryForUser(userId);
}
