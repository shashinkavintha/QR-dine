import { render, screen } from '@testing-library/react';
import BottomCTA from '@/components/BottomCTA';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: () => ({ get: () => 0 }),
    motion: {
      div: ({ children, style, className }) => (
        <div data-testid="motion-div" className={className}>
          {children}
        </div>
      ),
    },
  };
});

describe('BottomCTA Component', () => {
  it('renders the heading and description', () => {
    render(<BottomCTA />);
    
    expect(screen.getByText(/Ready to digitize your restaurant\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign up for free today./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Join the modern restaurants that are boosting sales and saving time/i)
    ).toBeInTheDocument();
  });

  it('renders the call-to-action button with correct link', () => {
    render(<BottomCTA />);
    
    const ctaButton = screen.getByRole('link', { name: /Sign up for free today/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/register');
  });

  it('renders decorative motion elements', () => {
    render(<BottomCTA />);
    
    const motionDivs = screen.getAllByTestId('motion-div');
    expect(motionDivs).toHaveLength(2); // Left and right decorative elements
  });
});
