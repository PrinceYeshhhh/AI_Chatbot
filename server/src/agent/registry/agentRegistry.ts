// Multi-Agent Registry - Central agent management
import { Agent, AgentRegistry, AgentCapability } from '../types';
import { logger } from '../../utils/logger';

export class AgentRegistryManager {
  private agents: AgentRegistry = {};
  private agentCapabilities: Map<string, AgentCapability[]> = new Map();

  constructor() {
    this.initializeDefaultAgents();
  }

  /**
   * Register a new agent
   */
  registerAgent(agent: Agent): void {
    this.agents[agent.id] = agent;
    this.agentCapabilities.set(agent.id, agent.capabilities);
    logger.info(`[AGENT_REGISTRY] Registered agent: ${agent.name} (${agent.id})`);
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents[agentId];
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Object.values(this.agents).filter(agent => agent.isActive);
  }

  /**
   * Get agents by category/capability
   */
  getAgentsByCapability(capability: string): Agent[] {
    return this.getAllAgents().filter(agent => 
      agent.capabilities.some(cap => cap.name === capability && cap.isEnabled)
    );
  }

  /**
   * Get agents by role
   */
  getAgentsByRole(role: string): Agent[] {
    return this.getAllAgents().filter(agent => agent.role === role);
  }

  /**
   * Update agent configuration
   */
  updateAgent(agentId: string, updates: Partial<Agent>): boolean {
    const agent = this.agents[agentId];
    if (!agent) {
      return false;
    }

    this.agents[agentId] = { ...agent, ...updates, updatedAt: new Date() };
    logger.info(`[AGENT_REGISTRY] Updated agent: ${agentId}`);
    return true;
  }

  /**
   * Deactivate agent
   */
  deactivateAgent(agentId: string): boolean {
    return this.updateAgent(agentId, { isActive: false });
  }

  /**
   * Get agent capabilities
   */
  getAgentCapabilities(agentId: string): AgentCapability[] {
    return this.agentCapabilities.get(agentId) || [];
  }

  /**
   * Check if agent can use tool
   */
  canAgentUseTool(agentId: string, toolName: string): boolean {
    const agent = this.getAgent(agentId);
    if (!agent) return false;

    return agent.toolsAllowed.includes(toolName);
  }

  /**
   * Initialize default agents
   */
  private initializeDefaultAgents(): void {
    const defaultAgents: Agent[] = [
      {
        id: 'financial-analyst',
        name: 'Financial Analyst',
        description: 'Expert in financial analysis, reporting, and insights',
        role: 'financial_analyst',
        systemPrompt: 'You are a senior Financial Analyst. Analyze financial data, create reports, and provide investment insights.',
        toolsAllowed: ['calculateFinancials', 'analyzeData', 'createReport', 'summarizeDoc'],
        memoryScope: 'user_id+workspace_id+role',
        capabilities: [
          { name: 'financial_analysis', description: 'Financial data analysis', category: 'financial', isEnabled: true },
          { name: 'reporting', description: 'Financial reporting', category: 'document', isEnabled: true },
          { name: 'forecasting', description: 'Financial forecasting', category: 'analysis', isEnabled: true }
        ],
        config: {
          maxToolsPerRequest: 3,
          timeoutMs: 30000,
          enableLogging: true,
          enableMetrics: true,
          memoryRetentionDays: 30,
          allowedFileTypes: ['pdf', 'xlsx', 'csv', 'docx'],
          maxFileSize: 50 * 1024 * 1024 // 50MB
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'hr-manager',
        name: 'HR Manager',
        description: 'Expert in HR analytics, employee management, and recruitment',
        role: 'hr_manager',
        systemPrompt: 'You are a senior HR Manager. Analyze employee data, manage recruitment, and provide HR insights.',
        toolsAllowed: ['analyzeHRData', 'searchDocuments', 'generateEmail', 'createReport'],
        memoryScope: 'user_id+workspace_id+role',
        capabilities: [
          { name: 'hr_analytics', description: 'HR data analysis', category: 'hr', isEnabled: true },
          { name: 'recruitment', description: 'Recruitment management', category: 'automation', isEnabled: true },
          { name: 'employee_management', description: 'Employee data management', category: 'hr', isEnabled: true }
        ],
        config: {
          maxToolsPerRequest: 2,
          timeoutMs: 25000,
          enableLogging: true,
          enableMetrics: true,
          memoryRetentionDays: 90,
          allowedFileTypes: ['pdf', 'xlsx', 'csv', 'docx'],
          maxFileSize: 25 * 1024 * 1024 // 25MB
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'legal-advisor',
        name: 'Legal Advisor',
        description: 'Expert in legal document review, compliance, and contract analysis',
        role: 'legal_advisor',
        systemPrompt: 'You are a senior Legal Advisor. Review legal documents, analyze contracts, and provide compliance guidance.',
        toolsAllowed: ['extractLegalClauses', 'analyzeData', 'searchDocuments', 'createReport'],
        memoryScope: 'user_id+workspace_id+role',
        capabilities: [
          { name: 'contract_review', description: 'Contract analysis', category: 'legal', isEnabled: true },
          { name: 'compliance', description: 'Compliance checking', category: 'legal', isEnabled: true },
          { name: 'legal_research', description: 'Legal research', category: 'analysis', isEnabled: true }
        ],
        config: {
          maxToolsPerRequest: 2,
          timeoutMs: 35000,
          enableLogging: true,
          enableMetrics: true,
          memoryRetentionDays: 365,
          allowedFileTypes: ['pdf', 'docx', 'txt'],
          maxFileSize: 100 * 1024 * 1024 // 100MB
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'marketing-strategist',
        name: 'Marketing Strategist',
        description: 'Expert in marketing campaigns, analytics, and brand strategy',
        role: 'marketing_strategist',
        systemPrompt: 'You are a senior Marketing Strategist. Analyze campaign data, create marketing strategies, and provide brand insights.',
        toolsAllowed: ['analyzeCampaigns', 'analyzeData', 'createReport', 'generateEmail'],
        memoryScope: 'user_id+workspace_id+role',
        capabilities: [
          { name: 'campaign_analysis', description: 'Campaign performance analysis', category: 'marketing', isEnabled: true },
          { name: 'brand_strategy', description: 'Brand strategy development', category: 'marketing', isEnabled: true },
          { name: 'market_research', description: 'Market research', category: 'analysis', isEnabled: true }
        ],
        config: {
          maxToolsPerRequest: 3,
          timeoutMs: 30000,
          enableLogging: true,
          enableMetrics: true,
          memoryRetentionDays: 60,
          allowedFileTypes: ['pdf', 'xlsx', 'csv', 'docx', 'jpg', 'png'],
          maxFileSize: 50 * 1024 * 1024 // 50MB
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'product-manager',
        name: 'Product Manager',
        description: 'Expert in product development, user feedback, and roadmap planning',
        role: 'product_manager',
        systemPrompt: 'You are a senior Product Manager. Analyze product data, manage roadmaps, and provide product insights.',
        toolsAllowed: ['analyzeFeedback', 'analyzeData', 'createReport', 'searchDocuments'],
        memoryScope: 'user_id+workspace_id+role',
        capabilities: [
          { name: 'product_analysis', description: 'Product performance analysis', category: 'product', isEnabled: true },
          { name: 'roadmap_planning', description: 'Product roadmap planning', category: 'automation', isEnabled: true },
          { name: 'user_research', description: 'User research and feedback', category: 'analysis', isEnabled: true }
        ],
        config: {
          maxToolsPerRequest: 3,
          timeoutMs: 30000,
          enableLogging: true,
          enableMetrics: true,
          memoryRetentionDays: 90,
          allowedFileTypes: ['pdf', 'xlsx', 'csv', 'docx', 'json'],
          maxFileSize: 50 * 1024 * 1024 // 50MB
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'data-scientist',
        name: 'Data Scientist',
        description: 'Expert in data analysis, machine learning, and statistical modeling',
        role: 'data_scientist',
        systemPrompt: 'You are a senior Data Scientist. Analyze complex data, build models, and provide data-driven insights.',
        toolsAllowed: ['analyzeData', 'analyzeTrends', 'createReport', 'extractTables'],
        memoryScope: 'user_id+workspace_id+role',
        capabilities: [
          { name: 'data_analysis', description: 'Advanced data analysis', category: 'analysis', isEnabled: true },
          { name: 'ml_modeling', description: 'Machine learning modeling', category: 'analysis', isEnabled: true },
          { name: 'statistical_analysis', description: 'Statistical analysis', category: 'analysis', isEnabled: true }
        ],
        config: {
          maxToolsPerRequest: 4,
          timeoutMs: 45000,
          enableLogging: true,
          enableMetrics: true,
          memoryRetentionDays: 180,
          allowedFileTypes: ['csv', 'xlsx', 'json', 'parquet', 'txt'],
          maxFileSize: 200 * 1024 * 1024 // 200MB
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'general-assistant',
        name: 'General Assistant',
        description: 'General-purpose AI assistant for various tasks',
        role: 'general_assistant',
        systemPrompt: 'You are a helpful AI assistant. Help users with various tasks and provide general support.',
        toolsAllowed: ['summarizeDoc', 'searchDocuments', 'translateText', 'generateEmail'],
        memoryScope: 'user_id+workspace_id',
        capabilities: [
          { name: 'general_support', description: 'General assistance', category: 'utility', isEnabled: true },
          { name: 'document_processing', description: 'Document processing', category: 'document', isEnabled: true },
          { name: 'communication', description: 'Communication assistance', category: 'communication', isEnabled: true }
        ],
        config: {
          maxToolsPerRequest: 2,
          timeoutMs: 20000,
          enableLogging: true,
          enableMetrics: true,
          memoryRetentionDays: 30,
          allowedFileTypes: ['pdf', 'docx', 'txt', 'csv'],
          maxFileSize: 25 * 1024 * 1024 // 25MB
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultAgents.forEach(agent => this.registerAgent(agent));
    logger.info(`[AGENT_REGISTRY] Initialized ${defaultAgents.length} default agents`);
  }
} 