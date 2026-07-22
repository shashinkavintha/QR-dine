import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock child components to isolate Home page testing
jest.mock('@/components/Navbar', () => () => <div data-testid="mock-navbar" />);
jest.mock('@/components/HeroSection', () => () => <div data-testid="mock-hero" />);
jest.mock('@/components/TrustSignals', () => () => <div data-testid="mock-trust-signals" />);
jest.mock('@/components/ProductShowcase', () => () => <div data-testid="mock-product-showcase" />);
jest.mock('@/components/HowItWorks', () => () => <div data-testid="mock-how-it-works" />);
jest.mock('@/components/Pricing', () => () => <div data-testid="mock-pricing" />);
jest.mock('@/components/Testimonials', () => () => <div data-testid="mock-testimonials" />);
jest.mock('@/components/BottomCTA', () => () => <div data-testid="mock-bottom-cta" />);
jest.mock('@/components/FadeIn', () => ({ children }) => <div data-testid="mock-fade-in">{children}</div>);

describe('Home Page', () => {
  it('renders all main sections', () => {
    render(<Home />);
    
    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-hero')).toBeInTheDocument();
    expect(screen.getByTestId('mock-trust-signals')).toBeInTheDocument();
    expect(screen.getByTestId('mock-product-showcase')).toBeInTheDocument();
    expect(screen.getByTestId('mock-how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('mock-pricing')).toBeInTheDocument();
    expect(screen.getByTestId('mock-testimonials')).toBeInTheDocument();
    expect(screen.getByTestId('mock-bottom-cta')).toBeInTheDocument();
  });

  it('renders the footer with contact information and links', () => {
    render(<Home />);
    
    expect(screen.getByText('Empowering restaurants and hotels with modern, contactless digital dining experiences.')).toBeInTheDocument();
    expect(screen.getByText('support@qrsaas.com')).toBeInTheDocument();
    expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
    
    expect(screen.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: /Terms of Service/i })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: /Refund Policy/i })).toHaveAttribute('href', '/refund');
  });
});
