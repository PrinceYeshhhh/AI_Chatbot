import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import fs from 'fs/promises';

// Chat History Functions
export async function getChatHistory(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender,
        timestamp,
        conversation_id,
        conversations(title, created_at)
      `)
      .eq('conversations.user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }

    return data || [];
  } catch (error: any) {
    logger.error('Error in getChatHistory:', error);
    throw error;
  }
}

export async function incrementChatCount(userId: string): Promise<void> {
  try {
    // Log analytics event for chat usage
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        event_type: 'chat_message',
        event_data: { timestamp: new Date().toISOString() }
      });

    if (error) {
      logger.error('Error incrementing chat count:', error);
    }
  } catch (error: any) {
    logger.error('Error in incrementChatCount:', error);
  }
}

// File Management Functions
export async function saveFileMetadata(fileData: {
  userId: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadPath: string;
  processingStatus: string;
}): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('file_uploads')
      .insert({
        user_id: fileData.userId,
        filename: fileData.filename,
        original_name: fileData.originalName,
        file_type: fileData.fileType,
        file_size: fileData.fileSize,
        upload_path: fileData.uploadPath,
        processing_status: fileData.processingStatus,
        metadata: {
          uploaded_at: new Date().toISOString()
        }
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Error saving file metadata:', error);
      throw new Error('Failed to save file metadata');
    }

    return data.id;
  } catch (error: any) {
    logger.error('Error in saveFileMetadata:', error);
    throw error;
  }
}

export async function updateFileStatus(fileId: string, status: string, errorMessage?: string): Promise<void> {
  try {
    const updateData: any = {
      processing_status: status,
      processed_at: new Date().toISOString()
    };

    if (errorMessage) {
      updateData.metadata = { error: errorMessage };
    }

    const { error } = await supabase
      .from('file_uploads')
      .update(updateData)
      .eq('id', fileId);

    if (error) {
      logger.error('Error updating file status:', error);
      throw new Error('Failed to update file status');
    }
  } catch (error: any) {
    logger.error('Error in updateFileStatus:', error);
    throw error;
  }
}

export async function getFileStatus(fileId: string, userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Error getting file status:', error);
      throw new Error('Failed to get file status');
    }

    return data;
  } catch (error: any) {
    logger.error('Error in getFileStatus:', error);
    throw error;
  }
}

export async function getUserFiles(userId: string, page: number = 1, limit: number = 10): Promise<any> {
  try {
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('file_uploads')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error getting user files:', error);
      throw new Error('Failed to get user files');
    }

    return {
      files: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error: any) {
    logger.error('Error in getUserFiles:', error);
    throw error;
  }
}

export async function deleteFile(fileId: string, userId: string): Promise<void> {
  try {
    // Get file metadata to find the path
    const { data, error: fetchError } = await supabase
      .from('files')
      .select('upload_path')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      logger.error('Error fetching file metadata:', fetchError);
      throw new Error('Failed to fetch file metadata');
    }

    // Delete from database
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error deleting file from database:', error);
      throw new Error('Failed to delete file');
    }

    // Delete physical file from filesystem
    if (data && data.upload_path) {
      try {
        await fs.unlink(data.upload_path);
        logger.info(`Physical file deleted: ${data.upload_path}`);
      } catch (fsError: any) {
        if (fsError.code !== 'ENOENT') {
          logger.error('Error deleting physical file:', fsError);
          throw new Error('Failed to delete physical file');
        } else {
          logger.warn('Physical file not found, skipping deletion:', data.upload_path);
        }
      }
    }

    logger.info(`File ${fileId} deleted successfully`);
  } catch (error: any) {
    logger.error('Error in deleteFile:', error);
    throw error;
  }
}

// Training Data Functions
export async function saveTrainingData(trainingData: {
  userId: string;
  input?: string;
  expectedOutput?: string;
  intent?: string;
  fileId?: string;
  content?: string;
  chunks?: number;
  metadata?: any;
  source?: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('training_data')
      .insert({
        user_id: trainingData.userId,
        input: trainingData.input || trainingData.content || '',
        expected_output: trainingData.expectedOutput || '',
        intent: trainingData.intent || 'document_upload',
        source: trainingData.source || 'manual',
        metadata: {
          ...trainingData.metadata,
          chunks: trainingData.chunks,
          file_id: trainingData.fileId
        }
      });

    if (error) {
      logger.error('Error saving training data:', error);
      throw new Error('Failed to save training data');
    }
  } catch (error: any) {
    logger.error('Error in saveTrainingData:', error);
    throw error;
  }
}

export async function getTrainingData(userId: string, limit: number = 100): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('training_data')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('date_added', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error getting training data:', error);
      throw new Error('Failed to get training data');
    }

    return data || [];
  } catch (error: any) {
    logger.error('Error in getTrainingData:', error);
    throw error;
  }
}

export async function deleteTrainingData(id: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('training_data')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error deleting training data:', error);
      throw new Error('Failed to delete training data');
    }
  } catch (error: any) {
    logger.error('Error in deleteTrainingData:', error);
    throw error;
  }
}

export async function getTrainingStats(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('training_data')
      .select('intent, source, date_added')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      logger.error('Error getting training stats:', error);
      throw new Error('Failed to get training stats');
    }

    const stats = {
      total: data?.length || 0,
      byIntent: {} as any,
      bySource: {} as any,
      recent: data?.filter((item: any) => {
        const date = new Date(item.date_added);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date > weekAgo;
      }).length || 0
    };

    // Group by intent and source
    data?.forEach((item: any) => {
      stats.byIntent[item.intent] = (stats.byIntent[item.intent] || 0) + 1;
      stats.bySource[item.source] = (stats.bySource[item.source] || 0) + 1;
    });

    return stats;
  } catch (error: any) {
    logger.error('Error in getTrainingStats:', error);
    throw error;
  }
}

export async function clearTrainingData(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('training_data')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) {
      logger.error('Error clearing training data:', error);
      throw new Error('Failed to clear training data');
    }
  } catch (error: any) {
    logger.error('Error in clearTrainingData:', error);
    throw error;
  }
}

// Chat Statistics Functions
export async function getChatStats(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('timestamp, sender')
      .eq('conversations.user_id', userId);

    if (error) {
      logger.error('Error getting chat stats:', error);
      throw new Error('Failed to get chat stats');
    }

    const stats = {
      totalMessages: data?.length || 0,
      userMessages: data?.filter((m: any) => m.sender === 'user').length || 0,
      botMessages: data?.filter((m: any) => m.sender === 'bot').length || 0,
      recentActivity: data?.filter((item: any) => {
        const date = new Date(item.timestamp);
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return date > dayAgo;
      }).length || 0
    };

    return stats;
  } catch (error: any) {
    logger.error('Error in getChatStats:', error);
    throw error;
  }
}

export async function clearChatHistory(userId: string): Promise<void> {
  try {
    // Get all conversations for the user
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId);

    if (convError) {
      logger.error('Error getting conversations:', convError);
      throw new Error('Failed to get conversations');
    }

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map((c: any) => c.id);
      
      // Delete all messages in these conversations
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .in('conversation_id', conversationIds);

      if (msgError) {
        logger.error('Error deleting messages:', msgError);
        throw new Error('Failed to delete messages');
      }

      // Delete the conversations
      const { error: convDeleteError } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', userId);

      if (convDeleteError) {
        logger.error('Error deleting conversations:', convDeleteError);
        throw new Error('Failed to delete conversations');
      }
    }
  } catch (error: any) {
    logger.error('Error in clearChatHistory:', error);
    throw error;
  }
}

// Fine-tuning Functions
export async function getFineTuningJobs(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('model_configs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error getting fine-tuning jobs:', error);
      throw new Error('Failed to get fine-tuning jobs');
    }

    return data || [];
  } catch (error: any) {
    logger.error('Error in getFineTuningJobs:', error);
    throw error;
  }
}

export async function getFineTuningJobStatus(jobId: string, userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('model_configs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Error getting fine-tuning job status:', error);
      throw new Error('Failed to get fine-tuning job status');
    }

    return data;
  } catch (error: any) {
    logger.error('Error in getFineTuningJobStatus:', error);
    throw error;
  }
}

// Analytics Functions
export async function logAnalyticsEvent(eventData: {
  userId?: string;
  eventType: string;
  eventData?: any;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: eventData.userId,
        event_type: eventData.eventType,
        event_data: eventData.eventData,
        session_id: eventData.sessionId,
        ip_address: eventData.ipAddress,
        user_agent: eventData.userAgent
      });

    if (error) {
      logger.error('Error logging analytics event:', error);
    }
  } catch (error: any) {
    logger.error('Error in logAnalyticsEvent:', error);
  }
}

// Processing Stats Functions
export async function getProcessingStatsFromDB(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('file_uploads')
      .select('processing_status, created_at')
      .eq('user_id', userId);

    if (error) {
      logger.error('Error getting processing stats:', error);
      throw new Error('Failed to get processing stats');
    }

    const stats = {
      total: data?.length || 0,
      completed: data?.filter((f: any) => f.processing_status === 'completed').length || 0,
      processing: data?.filter((f: any) => f.processing_status === 'processing').length || 0,
      failed: data?.filter((f: any) => f.processing_status === 'failed').length || 0
    };

    return stats;
  } catch (error: any) {
    logger.error('Error in getProcessingStatsFromDB:', error);
    throw error;
  }
} 