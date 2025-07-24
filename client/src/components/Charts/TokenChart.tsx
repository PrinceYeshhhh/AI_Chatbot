import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TokenChartProps {
  data: Array<{
    date: string;
    tokens_used: number;
    cost_estimate: number;
  }>;
  title?: string;
}

const TokenChart: React.FC<TokenChartProps> = ({ data, title = 'Token Usage Over Time' }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTokens = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatCost = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="w-full h-80">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={formatTokens}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tickFormatter={formatCost}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: any, name: string) => {
              if (name === 'tokens_used') {
                return [formatTokens(value), 'Tokens Used'];
              }
              if (name === 'cost_estimate') {
                return [formatCost(value), 'Cost'];
              }
              return [value, name];
            }}
            labelFormatter={(label) => formatDate(label)}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="tokens_used"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
            yAxisId="left"
            name="Tokens Used"
          />
          <Area
            type="monotone"
            dataKey="cost_estimate"
            stroke="#82ca9d"
            fill="#82ca9d"
            fillOpacity={0.6}
            yAxisId="right"
            name="Cost"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TokenChart; 