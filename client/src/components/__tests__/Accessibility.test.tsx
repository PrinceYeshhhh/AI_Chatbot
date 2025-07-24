import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it } from 'vitest';
import { OnboardingWalkthrough } from '../../onboarding/OnboardingWalkthrough';
import Tooltip from '../Tooltip';
import DocsPanel from '../DocsPanel';
import SupportModal from '../SupportModal';

expect.extend(toHaveNoViolations);

describe('Accessibility (a11y) tests', () => {
  it('OnboardingWalkthrough is accessible', async () => {
    const { container } = render(<OnboardingWalkthrough />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Tooltip is accessible', async () => {
    const { container } = render(
      <Tooltip content="memory_panel_tooltip">
        <button>Hover me</button>
      </Tooltip>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('DocsPanel is accessible', async () => {
    const { container } = render(<DocsPanel isOpen={true} onClose={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SupportModal is accessible', async () => {
    const { container } = render(<SupportModal onClose={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
}); 