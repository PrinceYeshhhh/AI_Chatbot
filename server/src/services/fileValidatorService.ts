import { NeonDatabaseService } from './neonDatabaseService';
import { QdrantService } from './qdrantService';
import { generateRAGResponse } from './ragService';

export interface ValidationReport {
  fileId: string;
  fileName: string;
  fileType: string;
  parsed: boolean;
  chunked: boolean;
  embedded: boolean;
  stored: boolean;
  metadata: boolean;
  rag: boolean;
  details: string[];
}

/**
 * Validate all SmartBrain files for a user, checking parsing, chunking, embedding, storage, metadata, and RAG retrieval.
 */
export async function validateSmartBrainFiles(userId: string): Promise<ValidationReport[]> {
  const db = new NeonDatabaseService();
  const qdrant = new QdrantService();
  const { files } = await db.getUserFiles(userId);
  const reports: ValidationReport[] = [];

  for (const file of files) {
    const report: ValidationReport = {
      fileId: file.id,
      fileName: file.file_name,
      fileType: file.mime_type,
      parsed: false,
      chunked: false,
      embedded: false,
      stored: false,
      metadata: false,
      rag: false,
      details: []
    };

    // 1. Check parsing (e.g., file status, DB logs, or try re-parsing)
    report.parsed = file.status === 'processed';
    if (!report.parsed) report.details.push('File not parsed');

    // 2. Check chunking (e.g., chunk count in DB or Qdrant)
    let embeddings: any[] = [];
    try {
      embeddings = await qdrant.searchEmbeddings(userId, file.id);
      report.chunked = embeddings.length > 0;
      if (!report.chunked) report.details.push('No chunks/embeddings found');
    } catch (e) {
      report.details.push('Error retrieving embeddings: ' + (e instanceof Error ? e.message : e));
    }

    // 3. Check embedding (e.g., all chunks have embedding vectors)
    report.embedded = embeddings.every(e => Array.isArray(e.vector || e.embeddingVector) && (e.vector || e.embeddingVector).length > 0);
    if (!report.embedded) report.details.push('Some chunks missing embeddings');

    // 4. Check storage (e.g., all embeddings present in Qdrant)
    report.stored = report.embedded;
    if (!report.stored) report.details.push('Embeddings not stored in vector DB');

    // 5. Check metadata (e.g., all required fields present)
    report.metadata = embeddings.every(e => {
      const p = e.payload || e;
      return (
        p.fileId === file.id &&
        p.userId === userId &&
        typeof p.chunkIndex === 'number' &&
        p.modality &&
        p.timestamp
      );
    });
    if (!report.metadata) report.details.push('Metadata missing or incomplete');

    // 6. RAG test: run a test prompt and check if the file contributes
    try {
      const prompt = 'Summarize this file';
      const ragResponse = await generateRAGResponse(prompt, userId, 5);
      // Optionally, check if the fileName or fileId appears in the matched chunks or context
      report.rag = Boolean(ragResponse && (ragResponse.includes(file.file_name) || ragResponse.includes(file.id)));
      if (!report.rag) report.details.push('RAG did not retrieve content from this file');
    } catch (e) {
      report.rag = false;
      report.details.push('RAG query failed: ' + (e instanceof Error ? e.message : e));
    }

    // TODO: Add more granular checks for DOCX, SVG, and edge cases as needed
    reports.push(report);
  }

  return reports;
} 