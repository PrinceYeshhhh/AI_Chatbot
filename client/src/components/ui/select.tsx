import React, { useState, useRef, useEffect } from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <SelectTrigger onClick={() => setIsOpen(!isOpen)}>
        <SelectValue value={value} />
      </SelectTrigger>
      {isOpen && (
        <SelectContent>
          {children}
        </SelectContent>
      )}
    </div>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

interface SelectValueProps {
  value?: string;
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ value, placeholder = 'Select option...' }) => {
  return <span className="block truncate">{value || placeholder}</span>;
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`absolute top-full z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg ${className}`}>
      <div className="p-1">
        {children}
      </div>
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 ${className}`}
    >
      {children}
    </button>
  );
}; 