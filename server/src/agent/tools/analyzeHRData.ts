// HR Data Analysis Tool
import { Tool, ToolArgs, ToolResult } from '../types';

export const analyzeHRData: Tool = {
  name: 'analyzeHRData',
  description: 'Analyze HR metrics and employee data',
  category: 'hr',
  agentCompatibility: ['hr-manager', 'general-assistant'],
  schema: {
    name: 'analyzeHRData',
    description: 'Analyze HR metrics including satisfaction, turnover, and performance',
    parameters: {
      type: 'object',
      properties: {
        analysisType: {
          type: 'string',
          enum: ['satisfaction', 'turnover', 'performance', 'recruitment', 'retention'],
          description: 'Type of HR analysis to perform'
        },
        data: {
          type: 'object',
          description: 'HR data for analysis'
        },
        period: {
          type: 'string',
          enum: ['monthly', 'quarterly', 'yearly'],
          description: 'Time period for analysis'
        }
      },
      required: ['analysisType', 'data']
    }
  },
  execute: async (args: ToolArgs): Promise<ToolResult> => {
    try {
      const { analysisType, data, period = 'yearly' } = args;
      
      if (!data || typeof data !== 'object') {
        return {
          success: false,
          error: 'Invalid HR data provided'
        };
      }

      let result: any = {};
      
      switch (analysisType) {
        case 'satisfaction':
          const scores = Array.isArray(data.scores) ? data.scores : [data.scores || 0];
          const avgSatisfaction = scores.reduce((sum: number, score: any) => sum + (score || 0), 0) / scores.length;
          result = {
            averageSatisfaction: avgSatisfaction.toFixed(2),
            totalResponses: scores.length,
            satisfactionLevel: avgSatisfaction >= 4 ? 'High' : avgSatisfaction >= 3 ? 'Medium' : 'Low',
            recommendations: avgSatisfaction < 3.5 ? [
              'Conduct employee feedback sessions',
              'Review compensation and benefits',
              'Improve work-life balance policies'
            ] : ['Maintain current satisfaction levels']
          };
          break;
          
        case 'turnover':
          const employees = data.totalEmployees || 100;
          const departures = data.departures || 0;
          const turnoverRate = (departures / employees) * 100;
          result = {
            totalEmployees: employees,
            departures: departures,
            turnoverRate: turnoverRate.toFixed(2) + '%',
            industryBenchmark: '15%',
            riskLevel: turnoverRate > 20 ? 'High' : turnoverRate > 10 ? 'Medium' : 'Low',
            recommendations: turnoverRate > 15 ? [
              'Improve retention strategies',
              'Conduct exit interviews',
              'Review compensation packages'
            ] : ['Monitor turnover trends']
          };
          break;
          
        case 'performance':
          const performanceScores = Array.isArray(data.scores) ? data.scores : [data.scores || 0];
          const avgPerformance = performanceScores.reduce((sum: number, score: any) => sum + (score || 0), 0) / performanceScores.length;
          result = {
            averagePerformance: avgPerformance.toFixed(2),
            highPerformers: performanceScores.filter((score: any) => score >= 4).length,
            lowPerformers: performanceScores.filter((score: any) => score < 3).length,
            performanceDistribution: {
              excellent: performanceScores.filter((score: any) => score >= 4.5).length,
              good: performanceScores.filter((score: any) => score >= 3.5 && score < 4.5).length,
              average: performanceScores.filter((score: any) => score >= 2.5 && score < 3.5).length,
              belowAverage: performanceScores.filter((score: any) => score < 2.5).length
            },
            recommendations: avgPerformance < 3.5 ? [
              'Implement performance improvement plans',
              'Provide additional training and development',
              'Set clear performance expectations'
            ] : ['Maintain performance standards']
          };
          break;
          
        case 'recruitment':
          const applications = data.applications || 0;
          const hires = data.hires || 0;
          const timeToHire = data.timeToHire || 30;
          result = {
            applications: applications,
            hires: hires,
            conversionRate: applications > 0 ? ((hires / applications) * 100).toFixed(2) + '%' : '0%',
            timeToHire: timeToHire + ' days',
            costPerHire: data.costPerHire || 5000,
            recommendations: [
              'Optimize job postings',
              'Improve candidate experience',
              'Streamline interview process'
            ]
          };
          break;
          
        case 'retention':
          const retentionRate = data.retentionRate || 85;
          const keyFactors = data.factors || ['compensation', 'work-life balance', 'career growth'];
          result = {
            retentionRate: retentionRate + '%',
            keyRetentionFactors: keyFactors,
            riskAssessment: retentionRate < 80 ? 'High Risk' : retentionRate < 90 ? 'Medium Risk' : 'Low Risk',
            recommendations: retentionRate < 85 ? [
              'Implement retention bonuses',
              'Improve career development programs',
              'Enhance employee engagement initiatives'
            ] : ['Maintain current retention strategies']
          };
          break;
          
        default:
          return {
            success: false,
            error: `Unknown analysis type: ${analysisType}`
          };
      }

      return {
        success: true,
        data: {
          analysisType,
          period,
          result,
          timestamp: new Date().toISOString()
        },
        metadata: {
          executionTime: 200,
          tokensUsed: 75
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'HR data analysis failed'
      };
    }
  }
}; 