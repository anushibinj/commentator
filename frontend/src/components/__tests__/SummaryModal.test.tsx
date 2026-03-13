import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SummaryModal } from '../../components/SummaryModal';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('SummaryModal', () => {
  it('renders the summary text', () => {
    render(<SummaryModal summary="My work log summary." onClose={vi.fn()} />);
    expect(screen.getByText('My work log summary.')).toBeInTheDocument();
  });

   it('renders the title', () => {
     render(<SummaryModal summary="Test" onClose={vi.fn()} />);
     expect(screen.getByText('Work Log Summary')).toBeInTheDocument();
   });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<SummaryModal summary="Test" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Close button in footer is clicked', () => {
    const onClose = vi.fn();
    render(<SummaryModal summary="Test" onClose={onClose} />);
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<SummaryModal summary="Test" onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalled();
  });

  it('copies summary to clipboard when copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
    });
    render(<SummaryModal summary="Copy me" onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Copy to Clipboard'));
    expect(writeText).toHaveBeenCalledWith('Copy me');
  });
});
