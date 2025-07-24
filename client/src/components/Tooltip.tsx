import React, { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TooltipProps {
  content: ReactNode | string; // can be translation key or ReactNode
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  learnMoreLink?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', learnMoreLink }) => {
  const [show, setShow] = useState(false);
  const { t } = useTranslation();
  let tooltipContent: ReactNode;

  if (typeof content === 'string') {
    // If translation key, allow HTML (for links)
    tooltipContent = <span dangerouslySetInnerHTML={{ __html: t(content) }} />;
  } else {
    tooltipContent = content;
  }

  return (
    <span
      className="relative group"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
      aria-describedby="tooltip"
    >
      {children}
      <span
        className={`absolute z-50 ${show ? 'block animate-fade-in' : 'hidden'} bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap
          ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
          ${position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
          ${position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
          ${position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}`}
        role="tooltip"
        id="tooltip"
      >
        <span className="relative">
          {tooltipContent}
          {learnMoreLink && (
            <>
              {' '}
              <a href={learnMoreLink} target="_blank" rel="noopener noreferrer" className="underline text-blue-200 ml-1">
                {t('Learn more')}
              </a>
            </>
          )}
          <span className={`absolute w-2 h-2 bg-gray-900 rotate-45
            ${position === 'top' ? 'left-1/2 -translate-x-1/2 top-full' : ''}
            ${position === 'bottom' ? 'left-1/2 -translate-x-1/2 -top-1' : ''}
            ${position === 'left' ? 'top-1/2 -translate-y-1/2 left-full' : ''}
            ${position === 'right' ? 'top-1/2 -translate-y-1/2 -left-1' : ''}`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
          />
        </span>
      </span>
    </span>
  );
};

export default Tooltip; 