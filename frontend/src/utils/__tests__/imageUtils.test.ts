import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { compressImageToBase64, truncateText, detectContentType } from '../../utils/imageUtils';

describe('truncateText', () => {
  it('returns the text unchanged when under the limit', () => {
    const text = 'Hello world';
    expect(truncateText(text, 100)).toBe(text);
  });

  it('truncates and appends ellipsis when over the limit', () => {
    const text = 'a'.repeat(6000);
    const result = truncateText(text, 5000);
    expect(result.length).toBeLessThan(text.length);
    expect(result).toContain('[truncated]');
    expect(result.startsWith('a'.repeat(5000))).toBe(true);
  });

  it('uses default limit of 5000 chars', () => {
    const text = 'x'.repeat(5001);
    const result = truncateText(text);
    expect(result).toContain('[truncated]');
  });

  it('returns text of exactly maxChars unchanged', () => {
    const text = 'a'.repeat(5000);
    expect(truncateText(text, 5000)).toBe(text);
  });
});

describe('detectContentType', () => {
  it('detects JavaScript import statements as CODE', () => {
    expect(detectContentType('import React from "react";')).toBe('CODE');
  });

  it('detects const declarations as CODE', () => {
    expect(detectContentType('const x = 5;')).toBe('CODE');
  });

  it('detects stack traces as CODE', () => {
    expect(detectContentType('Error at MyComponent.render (app.js:42:10)')).toBe('CODE');
  });

  it('detects plain text as TEXT', () => {
    expect(detectContentType('Worked on the authentication module today.')).toBe('TEXT');
  });

  it('detects Python def as CODE', () => {
    expect(detectContentType('def my_function():')).toBe('CODE');
  });

  it('detects line comments as CODE', () => {
    expect(detectContentType('// This is a comment')).toBe('CODE');
  });
});

describe('compressImageToBase64', () => {
  let OriginalImage: typeof Image;

  beforeEach(() => {
    OriginalImage = globalThis.Image;
  });

  afterEach(() => {
    globalThis.Image = OriginalImage;
  });

  it('rejects when image fails to load', async () => {
    // Mock Image to immediately fire onerror
    class MockImageError {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      set src(_: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    globalThis.Image = MockImageError as unknown as typeof Image;

    const file = new File(['not an image'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressImageToBase64(file)).rejects.toThrow('Failed to load image');
  });

  it('resolves with base64 for a valid image', async () => {
    // Mock Image with a canvas that returns base64
    class MockImageSuccess {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 100;
      height = 100;
      set src(_: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    globalThis.Image = MockImageSuccess as unknown as typeof Image;

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: vi.fn(),
      }),
      toDataURL: () => 'data:image/jpeg;base64,abc123',
    };
    vi.spyOn(document, 'createElement').mockReturnValue(
      mockCanvas as unknown as HTMLCanvasElement,
    );

    const file = new File(['img'], 'test.jpg', { type: 'image/jpeg' });
    const result = await compressImageToBase64(file);
    expect(result).toBe('abc123');
  });

  it('rejects when canvas context is null', async () => {
    class MockImageSuccess {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 100;
      height = 100;
      set src(_: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    globalThis.Image = MockImageSuccess as unknown as typeof Image;

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: () => null,
      toDataURL: () => '',
    };
    vi.spyOn(document, 'createElement').mockReturnValue(
      mockCanvas as unknown as HTMLCanvasElement,
    );

    const file = new File(['img'], 'test.jpg', { type: 'image/jpeg' });
    await expect(compressImageToBase64(file)).rejects.toThrow('Could not get canvas 2D context');
  });
});
