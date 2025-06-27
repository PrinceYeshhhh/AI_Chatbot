import React from 'react';
import { BarChart3, FileText, Mail, Calculator, Brain, Lightbulb } from 'lucide-react';

interface ChatTemplatesProps {
  onTemplateSelect: (template: string) => void;
}

export const ChatTemplates: React.FC<ChatTemplatesProps> = ({ onTemplateSelect }) => {
  const templates = [
    {
      icon: BarChart3,
      title: "📊 Analyze a CSV",
      description: "Upload and analyze data files",
      prompt: "I'd like to analyze a CSV file. Can you help me understand how to upload and analyze my data?"
    },
    {
      icon: FileText,
      title: "📄 Summarize Documents",
      description: "Extract key insights from PDFs",
      prompt: "How can I upload documents for you to summarize and extract key insights?"
    },
    {
      icon: Mail,
      title: "✍️ Draft an Email",
      description: "Create professional emails",
      prompt: "Help me draft a professional email for my business communication."
    },
    {
      icon: Calculator,
      title: "🧮 Data Analysis",
      description: "Perform calculations and analysis",
      prompt: "I need help with data analysis and calculations. What can you help me with?"
    },
    {
      icon: Brain,
      title: "🤖 AI Capabilities",
      description: "Learn what I can do",
      prompt: "What are your AI capabilities and how can you help me with my work?"
    },
    {
      icon: Lightbulb,
      title: "💡 Get Ideas",
      description: "Brainstorm and ideate",
      prompt: "I need help brainstorming ideas for my project. Can you help me think creatively?"
    }
  ];

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Quick Start Templates
        </h3>
        <p className="text-gray-600">
          Choose a template to get started, or type your own message below
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template, index) => {
          const IconComponent = template.icon;
          return (
            <button
              key={index}
              onClick={() => onTemplateSelect(template.prompt)}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 text-left group hover:scale-105 transform"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-colors duration-200">
                  <IconComponent className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-200">
                    {template.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};