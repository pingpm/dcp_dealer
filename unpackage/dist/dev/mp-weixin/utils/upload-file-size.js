"use strict";
const DEALER_IMAGE_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
function formatUploadSize(bytes) {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0)
    return "0MB";
  const mb = size / 1024 / 1024;
  return Number.isInteger(mb) ? `${mb}MB` : `${mb.toFixed(1)}MB`;
}
function tempFilePath(file) {
  return (file == null ? void 0 : file.path) || (file == null ? void 0 : file.tempFilePath) || "";
}
function splitFilesBySize(tempFilePaths = [], tempFiles = [], maxBytes = DEALER_IMAGE_UPLOAD_MAX_BYTES) {
  const fileByPath = new Map(tempFiles.map((file) => [tempFilePath(file), file]));
  const uploadablePaths = [];
  const rejectedFiles = [];
  tempFilePaths.forEach((filePath) => {
    const file = fileByPath.get(filePath);
    const size = Number((file == null ? void 0 : file.size) || 0);
    if (size > maxBytes) {
      rejectedFiles.push({ filePath, size });
      return;
    }
    uploadablePaths.push(filePath);
  });
  return { uploadablePaths, rejectedFiles };
}
exports.DEALER_IMAGE_UPLOAD_MAX_BYTES = DEALER_IMAGE_UPLOAD_MAX_BYTES;
exports.formatUploadSize = formatUploadSize;
exports.splitFilesBySize = splitFilesBySize;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/upload-file-size.js.map
