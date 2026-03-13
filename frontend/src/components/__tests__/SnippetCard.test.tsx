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
  let onUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onDelete = vi.fn();
    onUpdate = vi.fn();
  });

  it('renders a TEXT snippet', () => {
    render(<SnippetCard snippet={textSnippet} onDelete={onDelete} onUpdate={onUpdate} />);
    expect(screen.getByText('This is a text note')).toBeInTheDocument();
    expect(screen.getByText('TEXT')).toBeInTheDocument();
  });

  it('renders a CODE snippet in a code block', () => {
    render(<SnippetCard snippet={codeSnippet} onDelete={onDelete} onUpdate={onUpdate} />);
    expect(screen.getByText('const x = 42;')).toBeInTheDocument();
    expect(screen.getByText('CODE')).toBeInTheDocument();
  });

  it('renders an IMAGE snippet as an img tag', () => {
    render(<SnippetCard snippet={imageSnippet} onDelete={onDelete} onUpdate={onUpdate} />);
    const img = screen.getByRole('img', { name: 'Attached screenshot' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,base64encodeddata');
    expect(screen.getByText('IMAGE')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<SnippetCard snippet={textSnippet} onDelete={onDelete} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByLabelText('Delete snippet'));
    expect(onDelete).toHaveBeenCalledWith('text-1');
  });

  it('enters edit mode when Edit button is clicked', () => {
    render(<SnippetCard snippet={textSnippet} onDelete={onDelete} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByLabelText('Edit snippet'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onUpdate with new content when saved', () => {
    render(<SnippetCard snippet={textSnippet} onDelete={onDelete} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByLabelText('Edit snippet'));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Updated note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onUpdate).toHaveBeenCalledWith('text-1', 'Updated note');
  });

  it('cancels editing without calling onUpdate', () => {
    render(<SnippetCard snippet={textSnippet} onDelete={onDelete} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByLabelText('Edit snippet'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Changed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('This is a text note')).toBeInTheDocument();
  });

  it('saves on Ctrl+Enter in edit mode', () => {
    render(<SnippetCard snippet={textSnippet} onDelete={onDelete} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByLabelText('Edit snippet'));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Ctrl saved' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    expect(onUpdate).toHaveBeenCalledWith('text-1', 'Ctrl saved');
  });

  it('cancels on Escape in edit mode', () => {
    render(<SnippetCard snippet={textSnippet} onDelete={onDelete} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByLabelText('Edit snippet'));
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(screen.getByText('This is a text note')).toBeInTheDocument();
  });

  it('does not show Edit button for IMAGE snippets', () => {
    render(<SnippetCard snippet={imageSnippet} onDelete={onDelete} onUpdate={onUpdate} />);
    expect(screen.queryByLabelText('Edit snippet')).not.toBeInTheDocument();
  });
});
