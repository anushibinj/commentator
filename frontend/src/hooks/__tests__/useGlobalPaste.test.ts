import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlobalPaste } from '../../hooks/useGlobalPaste';
import { useAppStore } from '../../store/useAppStore';
import * as imageUtils from '../../utils/imageUtils';

beforeEach(() => {
  act(() => {
    useAppStore.setState({ sessions: {}, currentSessionId: null });
  });
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createPasteEvent(options: {
  text?: string;
  imageFile?: File;
}): ClipboardEvent {
  const items: DataTransferItem[] = [];

  if (options.text !== undefined) {
    items.push({
      type: 'text/plain',
      getAsString: (callback: (data: string) => void) => callback(options.text!),
      getAsFile: () => null,
    } as unknown as DataTransferItem);
  }

  if (options.imageFile) {
    items.push({
      type: 'image/png',
      getAsFile: () => options.imageFile!,
      getAsString: vi.fn(),
    } as unknown as DataTransferItem);
  }

  const dataTransfer = {
    items: items,
  } as unknown as DataTransfer;

  return Object.assign(new Event('paste'), {
    clipboardData: dataTransfer,
    preventDefault: vi.fn(),
  }) as unknown as ClipboardEvent;
}

describe('useGlobalPaste', () => {
  it('does not attach listener when sessionId is null', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    renderHook(() => useGlobalPaste(null));
    expect(addSpy).not.toHaveBeenCalledWith('paste', expect.any(Function));
  });

  it('attaches and detaches paste listener when sessionId is provided', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Test');
    });
    const sessionId = useAppStore.getState().currentSessionId!;

    const { unmount } = renderHook(() => useGlobalPaste(sessionId));
    expect(addSpy).toHaveBeenCalledWith('paste', expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('paste', expect.any(Function));
  });

  it('adds a TEXT snippet when plain text is pasted', async () => {
    vi.spyOn(imageUtils, 'detectContentType').mockReturnValue('TEXT');
    vi.spyOn(imageUtils, 'truncateText').mockImplementation((t) => t);

    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Test');
    });
    const sessionId = useAppStore.getState().currentSessionId!;
    renderHook(() => useGlobalPaste(sessionId));

    const event = createPasteEvent({ text: 'Hello paste' });
    await act(async () => {
      document.dispatchEvent(event);
      // Wait for async getAsString callback
      await new Promise((r) => setTimeout(r, 10));
    });

    const snippets = useAppStore.getState().sessions[sessionId].snippets;
    expect(snippets).toHaveLength(1);
    expect(snippets[0].content).toBe('Hello paste');
    expect(snippets[0].type).toBe('TEXT');
  });

  it('adds a CODE snippet when code text is pasted', async () => {
    vi.spyOn(imageUtils, 'detectContentType').mockReturnValue('CODE');
    vi.spyOn(imageUtils, 'truncateText').mockImplementation((t) => t);

    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Test');
    });
    const sessionId = useAppStore.getState().currentSessionId!;
    renderHook(() => useGlobalPaste(sessionId));

    const event = createPasteEvent({ text: 'const x = 1;' });
    await act(async () => {
      document.dispatchEvent(event);
      await new Promise((r) => setTimeout(r, 10));
    });

    const snippets = useAppStore.getState().sessions[sessionId].snippets;
    expect(snippets[0].type).toBe('CODE');
  });

  it('adds an IMAGE snippet when an image is pasted', async () => {
    vi.spyOn(imageUtils, 'compressImageToBase64').mockResolvedValue('base64img');

    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Test');
    });
    const sessionId = useAppStore.getState().currentSessionId!;
    renderHook(() => useGlobalPaste(sessionId));

    const file = new File(['img'], 'screenshot.png', { type: 'image/png' });
    const event = createPasteEvent({ imageFile: file });
    await act(async () => {
      document.dispatchEvent(event);
      await new Promise((r) => setTimeout(r, 50));
    });

    const snippets = useAppStore.getState().sessions[sessionId].snippets;
    expect(snippets).toHaveLength(1);
    expect(snippets[0].type).toBe('IMAGE');
    expect(snippets[0].content).toBe('base64img');
  });

  it('handles image compression failure gracefully', async () => {
    vi.spyOn(imageUtils, 'compressImageToBase64').mockRejectedValue(
      new Error('Compression failed'),
    );

    act(() => {
      useAppStore.getState().createSession('PROJ-1', 'Test');
    });
    const sessionId = useAppStore.getState().currentSessionId!;
    renderHook(() => useGlobalPaste(sessionId));

    const file = new File(['img'], 'bad.png', { type: 'image/png' });
    const event = createPasteEvent({ imageFile: file });
    await act(async () => {
      document.dispatchEvent(event);
      await new Promise((r) => setTimeout(r, 50));
    });

    const snippets = useAppStore.getState().sessions[sessionId].snippets;
    expect(snippets).toHaveLength(0);
  });
});
