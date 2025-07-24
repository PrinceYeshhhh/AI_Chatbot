# Agent Tools Framework

A comprehensive multi-agent system for AI-powered task execution with modular tools and intelligent orchestration.

## 🎯 Overview

The Agent Tools Framework provides a scalable architecture for managing multiple AI agents, each with specialized capabilities and access to domain-specific tools. The framework supports:

- **Multi-Agent Orchestration**: Intelligent routing of requests to appropriate agents
- **Modular Tool System**: Pluggable tools that can be easily added or modified
- **Agent Registry**: Centralized management of agent configurations and capabilities
- **Execution Pipeline**: Robust error handling and performance monitoring
- **API Integration**: RESTful endpoints for seamless integration

## 🏗️ Architecture

```
agent/
├── types.ts                 # Type definitions and interfaces
├── index.ts                 # Main framework entry point
├── registry/
│   └── agentRegistry.ts     # Agent management and registration
├── tools/
│   ├── index.ts            # Tool registry and management
│   ├── summarizeDoc.ts     # Document summarization tool
│   ├── extractTables.ts    # Table extraction tool
│   ├── analyzeData.ts      # Data analysis tool
│   └── ...                 # Additional tools
├── handlers/
│   └── agentHandler.ts     # Individual agent execution logic
├── orchestrator/
│   └── agentOrchestrator.ts # Multi-agent routing and coordination
├── pipeline/
│   └── multiAgentPipeline.ts # Execution pipeline for multiple agents
└── __tests__/
    └── agentFramework.test.ts # Comprehensive test suite
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { AgentToolsFramework } from './agent';

// Initialize the framework
const agentFramework = new AgentToolsFramework();

// Process a request (auto-selects appropriate agent)
const result = await agentFramework.processRequest(
  'Analyze this financial data and create a report',
  { userId: 'user-123', workspaceId: 'workspace-456' }
);

// Use a specific agent
const financialResult = await agentFramework.executeAgent(
  'financial-analyst',
  'Calculate ROI for this investment',
  { userId: 'user-123' }
);
```

### API Endpoints

```bash
# Execute agent tools
POST /api/agent-tools/execute
{
  "prompt": "Summarize this document",
  "userId": "user-123",
  "context": { "workspaceId": "workspace-456" }
}

# Get all available agents
GET /api/agent-tools/agents

# Get all available tools
GET /api/agent-tools/tools

# Execute specific agent
POST /api/agent-tools/agents/financial-analyst/execute
{
  "prompt": "Analyze this financial data",
  "userId": "user-123"
}

# Get framework statistics
GET /api/agent-tools/stats
```

## 🤖 Available Agents

### Financial Analyst
- **ID**: `financial-analyst`
- **Capabilities**: Financial analysis, reporting, forecasting
- **Tools**: `calculateFinancials`, `analyzeData`, `createReport`, `summarizeDoc`

### HR Manager
- **ID**: `hr-manager`
- **Capabilities**: HR analytics, employee management, recruitment
- **Tools**: `analyzeHRData`, `searchDocuments`, `generateEmail`, `createReport`

### Legal Advisor
- **ID**: `legal-advisor`
- **Capabilities**: Legal document review, compliance, contract analysis
- **Tools**: `extractLegalClauses`, `analyzeData`, `searchDocuments`, `createReport`

### Marketing Strategist
- **ID**: `marketing-strategist`
- **Capabilities**: Campaign analysis, brand strategy, market research
- **Tools**: `analyzeCampaigns`, `analyzeData`, `createReport`, `generateEmail`

### Product Manager
- **ID**: `product-manager`
- **Capabilities**: Product analysis, roadmap planning, user research
- **Tools**: `analyzeFeedback`, `analyzeData`, `createReport`, `searchDocuments`

### Data Scientist
- **ID**: `data-scientist`
- **Capabilities**: Advanced data analysis, ML modeling, statistical analysis
- **Tools**: `analyzeData`, `analyzeTrends`, `createReport`, `extractTables`

### General Assistant
- **ID**: `general-assistant`
- **Capabilities**: General support, document processing, communication
- **Tools**: `summarizeDoc`, `searchDocuments`, `translateText`, `generateEmail`

## 🛠️ Available Tools

### Document Processing
- `summarizeDoc` - Summarizes uploaded documents
- `extractTables` - Extracts tables from spreadsheets or PDFs
- `searchDocuments` - Searches through uploaded documents
- `createReport` - Generates comprehensive reports
- `extractLegalClauses` - Extracts legal clauses from contracts

### Communication
- `generateEmail` - Generates professional emails
- `translateText` - Translates text between languages
- `scheduleMeeting` - Schedules meetings and sends invitations

### Analysis
- `analyzeData` - Analyzes data sets and provides insights
- `analyzeTrends` - Analyzes data trends and patterns over time
- `analyzeHRData` - Analyzes HR data and metrics
- `analyzeCampaigns` - Analyzes marketing campaign performance
- `analyzeFeedback` - Analyzes user feedback and sentiment

### Financial
- `calculateFinancials` - Performs financial calculations and analysis

## 🔧 Adding New Agents

### 1. Create Agent Configuration

```typescript
// In agentRegistry.ts
const newAgent: Agent = {
  id: 'custom-agent',
  name: 'Custom Agent',
  description: 'Specialized agent for custom tasks',
  role: 'custom_role',
  systemPrompt: 'You are a specialized Custom Agent...',
  toolsAllowed: ['customTool1', 'customTool2'],
  memoryScope: 'user_id+workspace_id+role',
  capabilities: [
    {
      name: 'custom_capability',
      description: 'Custom capability description',
      category: 'custom',
      isEnabled: true
    }
  ],
  config: {
    maxToolsPerRequest: 3,
    timeoutMs: 30000,
    enableLogging: true,
    enableMetrics: true,
    memoryRetentionDays: 30,
    allowedFileTypes: ['pdf', 'docx'],
    maxFileSize: 50 * 1024 * 1024
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### 2. Register the Agent

```typescript
agentRegistry.registerAgent(newAgent);
```

## 🛠️ Adding New Tools

### 1. Create Tool Implementation

```typescript
// tools/customTool.ts
import { Tool, ToolArgs, ToolResult } from '../types';

export const customTool: Tool = {
  name: 'customTool',
  description: 'Description of what this tool does',
  category: 'custom',
  schema: {
    name: 'customTool',
    description: 'Description of what this tool does',
    parameters: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Input parameter description'
        },
        userId: {
          type: 'string',
          description: 'ID of the user'
        }
      },
      required: ['input', 'userId']
    }
  },
  execute: async (args: ToolArgs): Promise<ToolResult> => {
    // TODO: Implement tool logic
    console.log(`[TOOL] customTool called with args:`, args);
    
    return {
      success: true,
      data: {
        result: "Tool not implemented yet"
      },
      metadata: {
        executionTime: 0,
        tokensUsed: 0,
        cost: 0
      }
    };
  }
};
```

### 2. Register the Tool

```typescript
// In tools/index.ts
import { customTool } from './customTool';

export const toolRegistry: ToolRegistry = {
  // ... existing tools
  customTool,
};
```

## 🧪 Testing

### Run Tests

```bash
npm test -- --testPathPattern=agent
```

### Test Structure

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Error Handling**: Edge cases and error scenarios
- **Performance Tests**: Load and stress testing

## 📊 Monitoring & Observability

### Metrics

- Tool execution times
- Agent usage statistics
- Error rates and types
- Resource utilization

### Logging

- Tool execution logs
- Agent selection logs
- Error tracking
- Performance metrics

### Health Checks

- Agent availability
- Tool functionality
- System performance
- Resource status

## 🔒 Security

### Authentication
- User-based access control
- Agent-specific permissions
- Tool access validation

### Data Protection
- Input validation
- Output sanitization
- Secure tool execution
- Audit logging

## 🚀 Performance Optimization

### Caching
- Agent configurations
- Tool schemas
- Frequently used data

### Concurrency
- Parallel tool execution
- Agent orchestration
- Resource management

### Scalability
- Horizontal scaling
- Load balancing
- Resource allocation

## 📚 API Documentation

### OpenAPI/Swagger
- Complete API documentation
- Interactive testing interface
- Request/response examples

### SDK Support
- TypeScript definitions
- Client libraries
- Integration examples

## 🔄 Versioning

### Semantic Versioning
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### Migration Guide
- Version upgrade instructions
- Breaking change documentation
- Compatibility notes

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Run tests

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Comprehensive testing

### Pull Request Process
1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit PR

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 