import { describe, expect, it } from 'vitest';
import {
  DEALER_IMAGE_UPLOAD_MAX_BYTES,
  formatUploadSize,
  splitFilesBySize,
} from './upload-file-size.js';

describe('dealer image upload size rules', () => {
  it('keeps files at the 20MB limit uploadable', () => {
    const result = splitFilesBySize(
      ['tmp://license.jpg'],
      [{ path: 'tmp://license.jpg', size: DEALER_IMAGE_UPLOAD_MAX_BYTES }],
    );

    expect(result.uploadablePaths).toEqual(['tmp://license.jpg']);
    expect(result.rejectedFiles).toEqual([]);
  });

  it('rejects files over the 20MB limit', () => {
    const result = splitFilesBySize(
      ['tmp://large-license.jpg'],
      [{ path: 'tmp://large-license.jpg', size: DEALER_IMAGE_UPLOAD_MAX_BYTES + 1 }],
    );

    expect(result.uploadablePaths).toEqual([]);
    expect(result.rejectedFiles).toEqual([
      { filePath: 'tmp://large-license.jpg', size: DEALER_IMAGE_UPLOAD_MAX_BYTES + 1 },
    ]);
  });

  it('formats byte values into MB labels for the toast message', () => {
    expect(formatUploadSize(DEALER_IMAGE_UPLOAD_MAX_BYTES)).toBe('20MB');
    expect(formatUploadSize(DEALER_IMAGE_UPLOAD_MAX_BYTES + 512 * 1024)).toBe('20.5MB');
  });
});
