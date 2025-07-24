interface VideoQAEvent {
  userId: string;
  sessionId: string;
  videoName: string;
  chunkId: string;
  timestamp: string;
  query: string;
}

const videoQAEvents: VideoQAEvent[] = [];

export function logVideoQAEvent(event: VideoQAEvent) {
  videoQAEvents.push(event);
}

export function getAnalytics({ userId, sessionId }: { userId?: string; sessionId?: string }) {
  return videoQAEvents.filter(e =>
    (!userId || e.userId === userId) &&
    (!sessionId || e.sessionId === sessionId)
  );
} 