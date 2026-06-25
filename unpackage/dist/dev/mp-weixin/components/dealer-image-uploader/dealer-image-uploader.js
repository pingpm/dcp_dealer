"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const utils_uploadFileSize = require("../../utils/upload-file-size.js");
const _sfc_main = {
  name: "DealerImageUploader",
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: ""
    },
    tip: {
      type: String,
      default: ""
    },
    usageScene: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      default: "IMAGE"
    },
    maxCount: {
      type: Number,
      default: 9
    },
    addText: {
      type: String,
      default: "添加图片"
    },
    required: {
      type: Boolean,
      default: false
    },
    separator: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    exampleSrc: {
      type: String,
      default: ""
    },
    exampleText: {
      type: String,
      default: "查看示例"
    },
    statusFormat: {
      type: String,
      default: "count"
    }
  },
  emits: ["update:modelValue", "change"],
  data() {
    return {
      uploading: false
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
      return this.files.length ? "status-success" : "status-warning";
    },
    computedStatusText() {
      if (this.statusFormat === "single") {
        return this.files.length ? "已上传" : "未上传";
      }
      return `${this.files.length} 张已传`;
    },
    uploadButtonText() {
      return this.uploading ? "上传中..." : this.addText;
    }
  },
  methods: {
    emitFiles(files) {
      const next = files.slice(0, this.maxCount);
      this.$emit("update:modelValue", next);
      this.$emit("change", next);
    },
    chooseImage() {
      if (this.uploading || !this.canUpload)
        return;
      common_vendor.index.chooseImage({
        count: this.remainingCount,
        success: async (res) => {
          const tempFilePaths = res.tempFilePaths || [];
          const tempFiles = res.tempFiles || [];
          if (!tempFilePaths.length)
            return;
          const { uploadablePaths, rejectedFiles } = utils_uploadFileSize.splitFilesBySize(tempFilePaths, tempFiles);
          if (rejectedFiles.length) {
            const title = rejectedFiles.length === 1 ? `图片不能超过${utils_uploadFileSize.formatUploadSize(utils_uploadFileSize.DEALER_IMAGE_UPLOAD_MAX_BYTES)}，请压缩后重新上传` : `已跳过${rejectedFiles.length}张超过${utils_uploadFileSize.formatUploadSize(utils_uploadFileSize.DEALER_IMAGE_UPLOAD_MAX_BYTES)}的图片`;
            common_vendor.index.showToast({ title, icon: "none" });
          }
          if (!uploadablePaths.length)
            return;
          this.uploading = true;
          try {
            let nextFiles = this.maxCount === 1 ? [] : [...this.files];
            for (const filePath of uploadablePaths) {
              if (nextFiles.length >= this.maxCount)
                break;
              const file = await utils_api.uploadFile(filePath, this.fileType, this.usageScene);
              const fileObj = { fileId: file.fileId, fileUrl: file.fileUrl };
              if (this.maxCount === 1) {
                nextFiles = [fileObj];
              } else {
                nextFiles.push(fileObj);
              }
            }
            this.emitFiles(nextFiles);
          } catch (error) {
          } finally {
            this.uploading = false;
          }
        }
      });
    },
    previewImage(url) {
      common_vendor.index.previewImage({ urls: [url] });
    },
    previewExample() {
      if (!this.exampleSrc)
        return;
      common_vendor.index.previewImage({ urls: [this.exampleSrc] });
    },
    deleteFile(index) {
      const nextFiles = [...this.files];
      nextFiles.splice(index, 1);
      this.emitFiles(nextFiles);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $props.required
  }, $props.required ? {} : {}, {
    b: common_vendor.t($props.title),
    c: $props.tip
  }, $props.tip ? {
    d: common_vendor.t($props.tip)
  } : {}, {
    e: common_vendor.t($options.computedStatusText),
    f: common_vendor.n($options.statusClass),
    g: common_vendor.f($options.files, (file, index, i0) => {
      return common_vendor.e({
        a: file.fileUrl,
        b: common_vendor.o(($event) => $options.previewImage(file.fileUrl), file.fileId || file.fileUrl)
      }, !$props.disabled ? {
        c: common_vendor.o(($event) => $options.deleteFile(index), file.fileId || file.fileUrl)
      } : {}, {
        d: file.fileId || file.fileUrl
      });
    }),
    h: !$props.disabled,
    i: $options.canUpload
  }, $options.canUpload ? {
    j: $data.uploading ? 1 : "",
    k: common_vendor.t($options.uploadButtonText),
    l: $data.uploading ? 1 : "",
    m: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args), "90")
  } : {}, {
    n: $props.exampleSrc
  }, $props.exampleSrc ? {
    o: $props.exampleSrc,
    p: common_vendor.t($props.exampleText),
    q: common_vendor.o((...args) => $options.previewExample && $options.previewExample(...args), "91")
  } : {}, {
    r: $props.separator ? 1 : ""
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/dealer-image-uploader/dealer-image-uploader.js.map
