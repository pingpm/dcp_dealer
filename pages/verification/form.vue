<template>
  <view class="page form-page">
    <view class="form-header">
      <view class="form-header-title">车商资质认证</view>
      <view class="form-header-desc">请提供真实有效的企业信息与场地照片，以便快速通过审核。</view>
    </view>

    <!-- Basic Corporate Info -->
    <view class="section">
      <view class="section-title">企业基本信息</view>

      <view class="field">
        <text class="label"><text class="required-star">*</text>联系人姓名</text>
        <input
          class="input"
          v-model="form.contactName"
          placeholder="请输入联系人姓名"
          placeholder-style="color:#9ca3af"
        />
      </view>

      <view class="field">
        <text class="label"><text class="required-star">*</text>企业全称</text>
        <input
          class="input"
          :class="{ error: companyNameError }"
          v-model="form.companyName"
          placeholder="请输入营业执照上的企业名称"
          placeholder-style="color:#9ca3af"
          @input="clearCompanyNameError"
          @confirm="checkCompanyNameUsed"
          @blur="checkCompanyNameUsed"
        />
        <text v-if="companyNameError" class="field-error-text">{{ companyNameError }}</text>
      </view>
    </view>

    <!-- Address selection -->
    <view class="section">
      <view class="section-title">经营地址</view>

      <view class="field">
        <text class="label"><text class="required-star">*</text>所在省市</text>
        <view class="picker-display-wrap" @click="openRegionPicker">
          <view v-if="form.provinceName" class="picker-text">
            {{ form.provinceName }} · {{ form.cityName }}
          </view>
          <view v-else class="picker-placeholder"> 点击选择所在省份与城市 </view>
          <text class="arrow-icon">❯</text>
        </view>
      </view>

      <view class="field">
        <text class="label"><text class="required-star">*</text>详细地址</text>
        <view
          class="picker-display-wrap address-detail-display"
          :class="{ disabled: !form.cityId }"
          @click="openAddressPicker"
        >
          <view v-if="form.addressPoiName || form.addressDetail" class="address-summary">
            <text class="address-summary-name">{{
              form.addressPoiName || form.addressDetail
            }}</text>
            <text v-if="form.addressDetail" class="address-summary-detail">{{
              form.addressDetail
            }}</text>
          </view>
          <view v-else class="picker-placeholder"> 在地图上选择经营场地详细地址 </view>
          <text class="arrow-icon">❯</text>
        </view>
      </view>
    </view>

    <!-- Upload Section -->
    <view class="section">
      <view class="section-title">资质与证件照片</view>

      <dealer-image-uploader
        v-model="licenseFiles"
        title="营业执照照片"
        tip="清晰拍摄，文字无遮挡，仅限1张"
        usage-scene="BUSINESS_LICENSE"
        :max-count="1"
        add-text="上传执照"
        required
        status-format="single"
        :example-src="exampleImages.dealerBusinessLicense"
      />

      <dealer-image-uploader
        v-model="siteFiles"
        title="经营场地照片"
        tip="展示真实车商展厅、场地，至少1张，最多9张"
        usage-scene="BUSINESS_SITE"
        :max-count="9"
        add-text="上传场地照"
        required
        separator
        :example-src="exampleImages.dealerBusinessSite"
      />

      <!-- #ifdef H5 -->
      <button class="secondary-btn dev-upload-btn" :loading="devUploading" @click="useDevPhotos">
        使用测试认证照片
      </button>
      <!-- #endif -->
    </view>

    <!-- Region Picker Component -->
    <region-picker ref="regionPicker" title="选择省市地区" @select="onRegionSelect" />
    <address-map-picker
      ref="addressMapPicker"
      title="选择详细地址"
      placeholder="搜索市场、园区、道路、公司名称"
      :allow-manual-address="false"
      @select="onAddressSelect"
    />

    <!-- Fixed Action Footer -->
    <view class="fixed-footer">
      <button class="primary-btn" :loading="submitting" @click="submit">提交并申请认证</button>
    </view>
    <miniapp-login-sheet ref="loginSheet" @success="handleLoginSuccess" />
  </view>
</template>

<script>
import { miniappLoginPageMixin } from '../../utils/miniapp-login-page.js';
import { api, requireLogin } from '../../utils/api.js';
import AddressMapPicker from '../../components/address-map-picker/address-map-picker.vue';
import DealerImageUploader from '../../components/dealer-image-uploader/dealer-image-uploader.vue';
import RegionPicker from '../../components/region-picker/region-picker.vue';

export default {
  mixins: [miniappLoginPageMixin],
  components: {
    AddressMapPicker,
    DealerImageUploader,
    RegionPicker,
  },
  data() {
    return {
      form: {
        contactName: '',
        companyName: '',
        provinceId: '',
        provinceName: '',
        cityId: '',
        cityName: '',
        districtId: '',
        districtName: '',
        addressPoiName: '',
        addressDetail: '',
        longitude: '',
        latitude: '',
      },
      licenseFiles: [],
      siteFiles: [],
      exampleImages: {
        dealerBusinessLicense: '',
        dealerBusinessSite: '',
      },
      submitting: false,
      devUploading: false,
      companyNameError: '',
      companyNameChecking: false,
      companyNameCheckedValue: '',
    };
  },
  onLoad() {
    this.loadExampleImages();
    if (requireLogin()) this.loadDetail();
  },
  methods: {
    async loadExampleImages() {
      try {
        const data = await api.exampleImageConfigs();
        const byKey = {};
        (data.items || []).forEach((item) => {
          byKey[item.urlKey] = item;
        });
        this.exampleImages.dealerBusinessLicense = this.enabledExampleUrl(
          byKey.dealer_business_license_example_url,
        );
        this.exampleImages.dealerBusinessSite = this.enabledExampleUrl(
          byKey.dealer_business_site_example_url,
        );
      } catch (error) {
        this.exampleImages.dealerBusinessLicense = '';
        this.exampleImages.dealerBusinessSite = '';
      }
    },
    enabledExampleUrl(item) {
      return item?.enabled && item?.url ? item.url : '';
    },
    clearCompanyNameError() {
      this.companyNameError = '';
      this.companyNameCheckedValue = '';
    },
    async checkCompanyNameUsed() {
      const companyName = this.form.companyName.trim();
      if (!companyName || this.companyNameChecking) return false;
      if (this.companyNameCheckedValue === companyName) return Boolean(this.companyNameError);
      this.companyNameChecking = true;
      try {
        const result = await api.verificationCompanyNameCheck({ companyName });
        this.companyNameCheckedValue = companyName;
        if (result.companyNameUsed) {
          this.companyNameError = '该企业已入驻，请核对企业名称或更换后重试';
          return true;
        }
        this.companyNameError = '';
        return false;
      } catch (error) {
        return false;
      } finally {
        this.companyNameChecking = false;
      }
    },
    async loadDetail() {
      try {
        const detail = await api.verificationDetail();
        const profile = detail.profile || {};
        const snapshot = detail.version?.snapshotData || {};
        this.form = {
          ...this.form,
          contactName: snapshot.contactName || profile.contactName || '',
          companyName: snapshot.companyName || profile.companyName || '',
          provinceId: snapshot.provinceId || '',
          provinceName: snapshot.provinceName || '',
          cityId: snapshot.cityId || '',
          cityName: snapshot.cityName || '',
          districtId: snapshot.districtId || '',
          districtName: snapshot.districtName || '',
          addressPoiName: snapshot.addressPoiName || '',
          addressDetail: snapshot.addressDetail || '',
          longitude: snapshot.longitude || '',
          latitude: snapshot.latitude || '',
        };

        // Recover uploaded files preview metadata if present
        if (detail.version?.mediaFiles) {
          const media = detail.version.mediaFiles || [];
          this.licenseFiles = media
            .filter((f) => f.usageScene === 'BUSINESS_LICENSE')
            .map((f) => ({ fileId: f.fileId, fileUrl: f.fileUrl }));
          this.siteFiles = media
            .filter((f) => f.usageScene === 'BUSINESS_SITE')
            .map((f) => ({ fileId: f.fileId, fileUrl: f.fileUrl }));
        }
      } catch (error) {}
    },
    openRegionPicker() {
      this.$refs.regionPicker.open();
    },
    onRegionSelect(region) {
      this.form.provinceId = region.provinceId;
      this.form.provinceName = region.provinceName;
      this.form.cityId = region.cityId;
      this.form.cityName = region.cityName;
      this.form.districtId = '';
      this.form.districtName = '';
      this.form.addressPoiName = '';
      this.form.addressDetail = '';
      this.form.longitude = region.longitude || '';
      this.form.latitude = region.latitude || '';
    },
    openAddressPicker() {
      if (!this.form.cityId) {
        uni.showToast({ title: '请先选择所在省市', icon: 'none' });
        return;
      }
      this.$refs.addressMapPicker.open({
        id: '',
        name: this.form.addressPoiName || '',
        address: this.form.addressDetail || '',
        provinceName: this.form.provinceName || '',
        cityName: this.form.cityName || '',
        lng: this.form.longitude || '',
        lat: this.form.latitude || '',
        defaultLng: this.form.longitude || '',
        defaultLat: this.form.latitude || '',
        districtName: this.form.districtName || '',
        districtId: this.form.districtId || '',
      });
    },
    onAddressSelect(address) {
      const name = (address.name || '').trim();
      this.form.addressPoiName = name;
      this.form.addressDetail = address.address || name;
      this.form.longitude = address.lng || '';
      this.form.latitude = address.lat || '';
      this.form.districtName = address.districtName || this.form.districtName;
      this.form.districtId = address.districtId || this.form.districtId;
    },
    async useDevPhotos() {
      if (this.devUploading) return;
      this.devUploading = true;
      try {
        const [licenseFile, siteFile] = await Promise.all([
          api.importDevTestFile('test/dealer/dealer_company_licensepng.png', 'IMAGE'),
          api.importDevTestFile('test/dealer/dealer_office_photo1.png', 'IMAGE'),
        ]);
        this.licenseFiles = [{ fileId: licenseFile.fileId, fileUrl: licenseFile.fileUrl }];
        this.siteFiles = [{ fileId: siteFile.fileId, fileUrl: siteFile.fileUrl }];
      } finally {
        this.devUploading = false;
      }
    },
    validate() {
      const requiredFields = [
        ['contactName', '请填写联系人姓名'],
        ['companyName', '请填写企业全称'],
        ['provinceId', '请选择所在省市'],
        ['cityId', '请选择所在省市'],
        ['addressPoiName', '请在地图上选择详细地址'],
        ['addressDetail', '请在地图上选择详细地址'],
        ['longitude', '详细地址缺少定位信息，请重新在地图上选择'],
        ['latitude', '详细地址缺少定位信息，请重新在地图上选择'],
      ];
      for (const [key, message] of requiredFields) {
        if (!String(this.form[key] || '').trim()) {
          uni.showToast({ title: message, icon: 'none' });
          return false;
        }
      }
      if (this.companyNameError) {
        uni.showToast({ title: this.companyNameError, icon: 'none' });
        return false;
      }
      if (!this.licenseFiles.length) {
        uni.showToast({ title: '请上传营业执照照片', icon: 'none' });
        return false;
      }
      if (!this.siteFiles.length) {
        uni.showToast({ title: '请至少上传一张经营场地照片', icon: 'none' });
        return false;
      }
      return true;
    },
    async submit() {
      if (!this.validate()) return;
      if (await this.checkCompanyNameUsed()) {
        uni.showToast({ title: this.companyNameError, icon: 'none' });
        return;
      }
      this.submitting = true;
      try {
        const payload = {
          ...this.form,
          businessLicenseFileIds: this.licenseFiles.map((f) => f.fileId),
          businessSiteFileIds: this.siteFiles.map((f) => f.fileId),
        };
        await api.submitVerification(payload);
        uni.showToast({ title: '认证材料提交成功', icon: 'success' });
        setTimeout(() => uni.redirectTo({ url: '/pages/verification/status' }), 600);
      } catch (error) {
        const message = error?.message || '';
        if (message.includes('企业') && message.includes('入驻')) {
          this.companyNameError = message;
          this.companyNameCheckedValue = this.form.companyName.trim();
        }
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style>
.form-page {
  padding: 30rpx 30rpx calc(150rpx + env(safe-area-inset-bottom));
}

.required-star {
  color: var(--danger-color);
  margin-right: 6rpx;
  font-weight: bold;
}

.form-header {
  margin-bottom: 36rpx;
  padding: 0 10rpx;
}

.form-header-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #111827;
}

.form-header-desc {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 10rpx;
  line-height: 1.5;
}

/* Custom picker styling */
.picker-display-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 88rpx;
  padding: 0 28rpx;
  border: 1rpx solid var(--border-color);
  border-radius: var(--radius-md);
  background: #f9fafb;
  transition: all 0.2s ease;
}

.picker-text {
  font-size: 28rpx;
  color: var(--text-main);
  font-weight: 600;
}

.picker-placeholder {
  font-size: 28rpx;
  color: var(--text-weak);
}

.arrow-icon {
  font-size: 20rpx;
  color: var(--text-weak);
}

.address-detail-display {
  min-height: 96rpx;
  height: auto;
  align-items: flex-start;
  padding-top: 22rpx;
  padding-bottom: 22rpx;
  line-height: 1.45;
  white-space: normal;
}

.address-detail-display.disabled {
  background: #f3f4f6;
  color: #9ca3af;
}

.address-summary {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  width: 100%;
  min-width: 0;
}

.address-summary-name {
  color: #111827;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 1.35;
}

.address-summary-detail {
  color: #6b7280;
  font-size: 23rpx;
  line-height: 1.45;
}

.input.error {
  border: 1rpx solid #ef4444;
  background: #fef2f2;
  color: #991b1b;
}

.field-error-text {
  display: block;
  margin-top: 10rpx;
  color: #dc2626;
  font-size: 22rpx;
  line-height: 1.35;
}

.dev-upload-btn {
  width: 100%;
  margin-top: 26rpx;
}

</style>
