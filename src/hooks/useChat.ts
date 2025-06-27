import { useState, useCallback, useEffect } from 'react';
import { Message, Conversation } from '../types';
import { chatService } from '../services/chatService';

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Load conversations from localStorage
    const saved = localStorage.getItem('chatbot-conversations');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      })));
    }
  }, []);

  const saveConversations = useCallback((convs: Conversation[]) => {
    localStorage.setItem('chatbot-conversations', JSON.stringify(convs));
  }, []);

  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setConversations(prev => {
      const updated = [newConv, ...prev];
      saveConversations(updated);
      return updated;
    });
    setCurrentConversation(newConv);
  }, [saveConversations]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation) {
      createNewConversation();
      // Wait for the conversation to be created before proceeding
      setTimeout(() => sendMessage(content), 100);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString() + '_user_' + Math.random().toString(36).substr(2, 9),
      content,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    // Update current conversation immediately with user message
    const conversationWithUserMessage = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date(),
      title: currentConversation.messages.length === 0 ? content.slice(0, 30) + '...' : currentConversation.title
    };

    // Update state immediately
    setCurrentConversation(conversationWithUserMessage);
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv.id === currentConversation.id ? conversationWithUserMessage : conv
      );
      saveConversations(updated);
      return updated;
    });

    setIsTyping(true);

    try {
      // Get bot response with the updated conversation context
      const botResponse = await chatService.sendMessage(content, conversationWithUserMessage.messages);
      
      // Create final conversation with both messages
      const finalConversation = {
        ...conversationWithUserMessage,
        messages: [...conversationWithUserMessage.messages, botResponse],
        updatedAt: new Date()
      };

      // Update state with final conversation
      setCurrentConversation(finalConversation);
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === currentConversation.id ? finalConversation : conv
        );
        saveConversations(updated);
        return updated;
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Handle error by updating message status
      const errorConversation = {
        ...conversationWithUserMessage,
        messages: conversationWithUserMessage.messages.map(msg => 
          msg.id === userMessage.id ? { ...msg, status: 'failed' as const } : msg
        )
      };
      
      setCurrentConversation(errorConversation);
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === currentConversation.id ? errorConversation : conv
        );
        saveConversations(updated);
        return updated;
      });
    } finally {
      setIsTyping(false);
    }
  }, [currentConversation, createNewConversation, saveConversations]);

  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const updated = prev.filter(conv => conv.id !== conversationId);
      saveConversations(updated);
      return updated;
    });
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
    }
  }, [currentConversation, saveConversations]);

  return {
    conversations,
    currentConversation,
    isTyping,
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation
  };
};