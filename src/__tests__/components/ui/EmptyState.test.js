import { render, screen } from '@testing-library/react';
import EmptyState from '@/components/ui/EmptyState';

// Mock icon component
const MockIcon = () => <svg data-testid="mock-icon" />;

describe('EmptyState Component', () => {
  const defaultProps = {
    icon: MockIcon,
    title: 'No Items Found',
    description: 'Get started by creating a new item.',
  };

  it('renders the title and description correctly', () => {
    render(<EmptyState {...defaultProps} />);
    
    expect(screen.getByText('No Items Found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating a new item.')).toBeInTheDocument();
  });

  it('renders the icon component', () => {
    render(<EmptyState {...defaultProps} />);
    
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders the action element if provided', () => {
    const actionElement = <button>Create Item</button>;
    
    render(<EmptyState {...defaultProps} action={actionElement} />);
    
    expect(screen.getByText('Create Item')).toBeInTheDocument();
  });

  it('does not render an action area if no action is provided', () => {
    render(<EmptyState {...defaultProps} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
