import * as React from 'react';

interface SwitchProps extends React.HTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  'aria-label'?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(({ checked, onCheckedChange, 'aria-label': ariaLabel, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={0}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${className || ''}`}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6 bg-blue-500' : 'translate-x-1 bg-gray-300'}`}
      />
      <span className="sr-only">{ariaLabel}</span>
    </button>
  );
});
Switch.displayName = 'Switch'; 