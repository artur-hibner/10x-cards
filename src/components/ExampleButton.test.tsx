import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExampleButton } from './ExampleButton';

describe('ExampleButton', () => {
  it('renders with label', () => {
    render(<ExampleButton label="Kliknij mnie" />);
    expect(screen.getByText('Kliknij mnie')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<ExampleButton label="Kliknij mnie" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Kliknij mnie'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<ExampleButton label="Kliknij mnie" disabled={true} />);
    expect(screen.getByText('Kliknij mnie')).toBeDisabled();
  });
}); 