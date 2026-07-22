import { render, screen, waitFor } from '@testing-library/react';
import HeroSection from '@/components/HeroSection';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: () => ({ get: () => 0 }),
    motion: {
      h1: ({ children, className }) => <h1 className={className}>{children}</h1>,
      p: ({ children, className }) => <p className={className}>{children}</p>,
      div: ({ children, className }) => <div className={className}>{children}</div>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

describe('HeroSection Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          hero_mockup_image_phone_url: '/phone-mockup.png',
          hero_mockup_image_tablet_url: '/tablet-mockup.png',
          hero_mockup_image_laptop_url: '/laptop-mockup.png'
        }),
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the main heading and description', async () => {
    render(<HeroSection />);
    
    expect(screen.getByText(/Smart QR Menus for/i)).toBeInTheDocument();
    expect(screen.getByText(/Modern Restaurants/i)).toBeInTheDocument();
    expect(screen.getByText(/Digitize your menu in seconds with zero printing costs/i)).toBeInTheDocument();
  });

  it('renders the call-to-action buttons', async () => {
    render(<HeroSection />);
    
    expect(screen.getByRole('link', { name: /Get Started for Free/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /Book a Demo/i })).toHaveAttribute('href', '#contact');
  });

  it('fetches hero images on mount', async () => {
    render(<HeroSection />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/public/settings'));
    });
  });
});
