import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SnippetCard } from '../../components/SnippetCard';
import type { Snippet } from '../../types';

const textSnippet: Snippet = {
  id: 'text-1',
  timestamp: Date.now(),
  type: 'TEXT',
  content: 'This is a text note',
};

const codeSnippet: Snippet = {
  id: 'code-1',
  timestamp: Date.now(),
  type: 'CODE',
  content: 'const x = 42;',
};

const imageSnippet: Snippet = {
  id: 'img-1',
  timestamp: Date.now(),
  type: 'IMAGE',
  content: 'base64encodeddata',
};

describe('SnippetCard', () => {
  let onDelete: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    onDelete = vi.fn();
  });

  it('renders a TEXT snippet', () => {
    render(<SnippetCard snippet={textSnippet} onDelete={onDelete} />);
    expect(screen.getByText('This is a text note')).toBeInTheDocument();
    expect(screen.getByText('TEXT')).toBeInTheDocument();
  });

  it('renders a CODE snippet in a code block', () => {
    render(<SnippetCard snippet={codeSnippet} onDelete={onDelete} />);
    expect(screen.getByText('const x = 42;')).toBeInTheDocument();
    expect(screen.getByText('CODE')).toBeInTheDocument();
  });

  it('renders an IMAGE snippet as an img tag', () => {
    render(<SnippetCard snippet={imageSnippet} onDelete={onDelete} />);
    const img = screen.getByRole('img', { name: 'Pasted screenshot' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,base64encodeddata');
    expect(screen.getByText('IMAGE')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<SnippetCard snippet={textSnippet} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('Delete snippet'));
    expect(onDelete).toHaveBeenCalledWith('text-1');
  });
});
