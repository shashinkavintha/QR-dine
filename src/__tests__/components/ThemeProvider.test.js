import { render } from '@testing-library/react';
import { ThemeProvider } from '@/components/ThemeProvider';

jest.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }) => (
    <div data-testid="next-themes-provider" {...props}>
      {children}
    </div>
  ),
}));

describe('ThemeProvider Component', () => {
  it('renders children within NextThemesProvider', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <div>Child content</div>
      </ThemeProvider>
    );

    const provider = getByTestId('next-themes-provider');
    expect(provider).toBeInTheDocument();
    expect(provider).toHaveAttribute('attribute', 'class');
    expect(provider).toHaveAttribute('defaultTheme', 'system');
    
    expect(getByText('Child content')).toBeInTheDocument();
  });
});
