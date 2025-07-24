import React from 'react';

interface InfoCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  color?: 'primary' | 'secondary';
  action?: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, description, icon, children, color = 'primary', action }) => (
  <div className={`rounded-lg shadow p-4 border mb-4 bg-white animate-fade-in transition-all duration-200
    hover:shadow-lg focus-within:ring-2 focus-within:ring-${color}-300 border-${color}-200 group relative`}
    tabIndex={0}
  >
    <div className="flex items-center gap-3 mb-2">
      {icon && <span className={`text-2xl ${color === 'primary' ? 'text-primary-500' : 'text-secondary-500'}`}>{icon}</span>}
      <span className="font-bold text-lg flex-1">{title}</span>
      {action && <span className="ml-auto">{action}</span>}
    </div>
    {description && <div className="text-gray-600 mb-2 text-sm">{description}</div>}
    {children}
  </div>
);

export default InfoCard; 