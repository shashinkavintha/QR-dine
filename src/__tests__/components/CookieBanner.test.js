import { render, screen, fireEvent } from '@testing-library/react';
import CookieBanner from '@/components/CookieBanner';

// Mock the react-cookie-consent module to control its behavior during tests
jest.mock('react-cookie-consent', () => {
  return function MockCookieConsent({ children, onAccept, onDecline, buttonText, declineButtonText }) {
    return (
      <div data-testid="cookie-banner">
        <div>{children}</div>
        <button onClick={onAccept}>{buttonText}</button>
        <button onClick={onDecline}>{declineButtonText}</button>
      </div>
    );
  };
});

describe('CookieBanner Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.getItem = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the cookie banner text correctly', () => {
    render(<CookieBanner />);
    
    expect(screen.getByText(/We use cookies to improve your experience/i)).toBeInTheDocument();
    expect(screen.getByText('Accept All')).toBeInTheDocument();
    expect(screen.getByText('Decline')).toBeInTheDocument();
  });

  it('sets localStorage to true when Accept All is clicked', () => {
    render(<CookieBanner />);
    
    fireEvent.click(screen.getByText('Accept All'));
    
    expect(localStorage.setItem).toHaveBeenCalledWith('cookieConsent', 'true');
  });

  it('sets localStorage to false when Decline is clicked', () => {
    render(<CookieBanner />);
    
    fireEvent.click(screen.getByText('Decline'));
    
    expect(localStorage.setItem).toHaveBeenCalledWith('cookieConsent', 'false');
  });
});
