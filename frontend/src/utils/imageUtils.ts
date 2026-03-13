/**
 * Compresses an image File slightly and converts it to a base64 data URL string.
 * Resizes to max 1024px on the longest dimension and uses JPEG quality 0.75.
 */
export async function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const MAX_DIMENSION = 1024;
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas 2D context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      // Strip data URL prefix to get raw base64
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Truncates a string to a maximum number of characters, appending an ellipsis if truncated.
 * Used to prevent excessive token usage from large stack traces.
 */
export function truncateText(text: string, maxChars: number = 5000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n... [truncated]';
}

/**
 * Detects if a text string is likely code by checking for common code patterns.
 */
export function detectContentType(text: string): 'CODE' | 'TEXT' {
  const codePatterns = [
    /^\s*(import|export|const|let|var|function|class|interface|type)\s/m,
    /^\s*(public|private|protected|static|void|int|string|boolean)\s/m,
    /^\s*(def|class|if __name__|import|from)\s/m,
    /[{};]\s*$/m,
    /^\s*(\/\/|#|\/\*|\*\/)/m,
    /at\s+\w+(\.\w+)*\s*\(/m, // stack trace pattern
    /^\s+at\s/m,
  ];

  return codePatterns.some((p) => p.test(text)) ? 'CODE' : 'TEXT';
}
