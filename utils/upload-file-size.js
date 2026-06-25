export const DEALER_IMAGE_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

export function formatUploadSize(bytes) {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) return '0MB';
  const mb = size / 1024 / 1024;
  return Number.isInteger(mb) ? `${mb}MB` : `${mb.toFixed(1)}MB`;
}

export function tempFilePath(file) {
  return file?.path || file?.tempFilePath || '';
}

export function splitFilesBySize(tempFilePaths = [], tempFiles = [], maxBytes = DEALER_IMAGE_UPLOAD_MAX_BYTES) {
  const fileByPath = new Map(tempFiles.map((file) => [tempFilePath(file), file]));
  const uploadablePaths = [];
  const rejectedFiles = [];

  tempFilePaths.forEach((filePath) => {
    const file = fileByPath.get(filePath);
    const size = Number(file?.size || 0);
    if (size > maxBytes) {
      rejectedFiles.push({ filePath, size });
      return;
    }
    uploadablePaths.push(filePath);
  });

  return { uploadablePaths, rejectedFiles };
}
