<template>
  <view class="image-uploader" :class="{ separator }">
    <view class="upload-header-row">
      <view class="upload-title-wrap">
        <text class="upload-label">
          <text v-if="required" class="required-star">*</text>{{ title }}
        </text>
        <text v-if="tip" class="upload-tip">{{ tip }}</text>
      </view>
      <text class="status-tag" :class="statusClass">{{ computedStatusText }}</text>
    </view>

    <view class="upload-grid">
      <view v-for="(file, index) in files" :key="file.fileId || file.fileUrl" class="upload-preview">
        <image
          :src="file.fileUrl"
          mode="aspectFill"
          class="upload-img"
          @click="previewImage(file.fileUrl)"
        />
        <view v-if="!disabled" class="upload-delete-btn" @click="deleteFile(index)">×</view>
      </view>

      <view
        v-if="canUpload"
        class="upload-card"
        :class="{ disabled: uploading }"
        @click="chooseImage"
      >
        <dealer-icon
          class="upload-card-icon"
          :name="uploading ? 'hourglass' : 'plus'"
          size="md"
          color="#f97316"
        />
        <text class="upload-card-text">{{ uploadButtonText }}</text>
      </view>

      <view v-if="exampleSrc" class="example-card" @click="previewExample">
        <image :src="exampleSrc" mode="aspectFill" class="example-img" />
        <view class="example-mask">
          <text class="example-text">{{ exampleText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { uploadFile } from '../../utils/api.js';

export default {
  name: 'DealerImageUploader',
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    title: {
      type: String,
      default: '',
    },
    tip: {
      type: String,
      default: '',
    },
    usageScene: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: 'IMAGE',
    },
    maxCount: {
      type: Number,
      default: 9,
    },
    addText: {
      type: String,
      default: '添加图片',
    },
    required: {
      type: Boolean,
      default: false,
    },
    separator: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    exampleSrc: {
      type: String,
      default: '',
    },
    exampleText: {
      type: String,
      default: '查看示例',
    },
    statusFormat: {
      type: String,
      default: 'count',
    },
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      uploading: false,
    };
  },
  computed: {
    files() {
      return Array.isArray(this.modelValue) ? this.modelValue : [];
    },
    canUpload() {
      return !this.disabled && this.files.length < this.maxCount;
    },
    remainingCount() {
      return Math.max(this.maxCount - this.files.length, 0);
    },
    statusClass() {
      return this.files.length ? 'status-success' : 'status-warning';
    },
    computedStatusText() {
      if (this.statusFormat === 'single') {
        return this.files.length ? '已上传' : '未上传';
      }
      return `${this.files.length} 张已传`;
    },
    uploadButtonText() {
      return this.uploading ? '上传中...' : this.addText;
    },
  },
  methods: {
    emitFiles(files) {
      const next = files.slice(0, this.maxCount);
      this.$emit('update:modelValue', next);
      this.$emit('change', next);
    },
    chooseImage() {
      if (this.uploading || !this.canUpload) return;
      uni.chooseImage({
        count: this.remainingCount,
        success: async (res) => {
          const tempFilePaths = res.tempFilePaths || [];
          if (!tempFilePaths.length) return;
          this.uploading = true;
          try {
            let nextFiles = this.maxCount === 1 ? [] : [...this.files];
            for (const filePath of tempFilePaths) {
              if (nextFiles.length >= this.maxCount) break;
              const file = await uploadFile(filePath, this.fileType, this.usageScene);
              const fileObj = { fileId: file.fileId, fileUrl: file.fileUrl };
              if (this.maxCount === 1) {
                nextFiles = [fileObj];
              } else {
                nextFiles.push(fileObj);
              }
            }
            this.emitFiles(nextFiles);
          } catch (error) {
            // uploadFile already shows the failure message.
          } finally {
            this.uploading = false;
          }
        },
      });
    },
    previewImage(url) {
      uni.previewImage({ urls: [url] });
    },
    previewExample() {
      if (!this.exampleSrc) return;
      uni.previewImage({ urls: [this.exampleSrc] });
    },
    deleteFile(index) {
      const nextFiles = [...this.files];
      nextFiles.splice(index, 1);
      this.emitFiles(nextFiles);
    },
  },
};
</script>

<style>
.image-uploader {
  margin-bottom: 36rpx;
}

.image-uploader.separator {
  padding-top: 36rpx;
  border-top: 1rpx solid #f1f5f9;
  margin-bottom: 0;
}

.upload-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.upload-title-wrap {
  flex: 1;
  min-width: 0;
}

.upload-label {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #111827;
}

.upload-tip {
  display: block;
  font-size: 22rpx;
  color: var(--text-weak);
  margin-top: 4rpx;
  line-height: 1.4;
}

.required-star {
  color: var(--danger-color);
  margin-right: 6rpx;
  font-weight: bold;
}

.upload-card.disabled {
  opacity: 0.6;
}

.example-card {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #fff7ed;
  border: 1rpx solid #fed7aa;
}

.example-img {
  width: 100%;
  height: 100%;
}

.example-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 42rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(154, 52, 18, 0.78);
}

.example-text {
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 600;
}
</style>
