import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/Navbar';

jest.mock('next/link', () => {
  return ({ children, href, ...props }) => (
    <a href={href} {...props} data-testid="mock-link">
      {children}
    </a>
  );
});

const mockScrollTo = jest.fn();

jest.mock('lenis/react', () => ({
  useLenis: () => ({
    scrollTo: mockScrollTo,
  }),
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the logo correctly', () => {
    render(<Navbar />);
    expect(screen.getByAltText('QR Dine Logo')).toBeInTheDocument();
  });

  it('renders desktop navigation links', () => {
    render(<Navbar />);
    
    expect(screen.getAllByText('Features').length).toBeGreaterThan(0);
    expect(screen.getAllByText('How it Works').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pricing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Contact').length).toBeGreaterThan(0);
  });

  it('renders authentication links', () => {
    render(<Navbar />);
    
    const loginLinks = screen.getAllByText('Login');
    expect(loginLinks.length).toBeGreaterThan(0);
    
    const registerLinks = screen.getAllByText('Start 14-Day Free Trial');
    expect(registerLinks.length).toBeGreaterThan(0);
  });

  it('calls lenis scrollTo when a navigation item is clicked', () => {
    render(<Navbar />);
    
    // Desktop menu feature button
    const featuresButton = screen.getAllByText('Features')[0];
    fireEvent.click(featuresButton);
    
    expect(mockScrollTo).toHaveBeenCalledWith('#features');
  });

  it('toggles mobile menu when hamburger icon is clicked', () => {
    render(<Navbar />);
    
    // Find hamburger button by finding the parent button of the Menu/X icon
    const buttons = screen.getAllByRole('button');
    // The mobile menu toggle button is the one without text (has an icon inside)
    const toggleButton = buttons.find(b => b.classList.contains('md:hidden'));
    
    expect(toggleButton).toBeInTheDocument();
    
    // Click to open menu
    fireEvent.click(toggleButton);
    
    // Assuming mobile menu items appear in the DOM
    const mobileMenu = screen.getByRole('navigation');
    expect(mobileMenu).toBeInTheDocument();
    
    // We should see mobile specific navigation links (they might share the same text as desktop, but let's check they are rendered)
    expect(screen.getAllByText('Login').length).toBe(2); // One desktop, one mobile
    
    // Click again to close menu
    fireEvent.click(toggleButton);
    
    // After closing, we should have fewer links if it unmounts
    expect(screen.getAllByText('Login').length).toBe(1); // Only desktop
  });
});
