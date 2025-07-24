import * as React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  className?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ value, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`relative w-full h-2 bg-gray-200 rounded-full overflow-hidden ${className || ''}`}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      role="progressbar"
      {...props}
    >
      <div
        className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
});
Progress.displayName = 'Progress'; 