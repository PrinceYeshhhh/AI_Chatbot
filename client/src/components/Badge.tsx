import React from 'react';

interface BadgeProps {
  color?: 'primary' | 'secondary';
  children: React.ReactNode;
  tooltip?: string;
  icon?: React.ReactNode;
  pulse?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ color = 'primary', children, tooltip, icon, pulse }) => (
  <span
    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm animate-fade-in transition-all duration-200
      ${color === 'primary' ? 'bg-primary-100 text-primary-800 border border-primary-300' : 'bg-secondary-100 text-secondary-800 border border-secondary-300'}
      hover:brightness-95 focus:ring-2 focus:ring-offset-2 focus:ring-primary-300 cursor-pointer relative
      ${pulse ? 'animate-pulse-slow' : ''}`}
    tabIndex={0}
    title={tooltip}
    role={tooltip ? 'button' : undefined}
    aria-label={tooltip || undefined}
  >
    {icon && <span className={`text-base ${color === 'primary' ? 'text-primary-500' : 'text-secondary-500'}`}>{icon}</span>}
    {children}
    {tooltip && (
      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg">
        {tooltip}
      </span>
    )}
  </span>
);

export default Badge; 