"use strict";
const utils_miniappLoginPage = require("../../utils/miniapp-login-page.js");
const utils_api = require("../../utils/api.js");
const utils_format = require("../../utils/format.js");
const common_vendor = require("../../common/vendor.js");
const TRAVELED_COLOR = "#f97316";
const REMAINING_COLOR = "#3b82f6";
function pointFrom(longitude, latitude) {
  const lng = Number(longitude);
  const lat = Number(latitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat))
    return null;
  return { longitude: lng, latitude: lat };
}
function coordinateParam(point) {
  return `${Number(point.longitude).toFixed(6)},${Number(point.latitude).toFixed(6)}`;
}
function samePoint(a, b) {
  if (!a || !b)
    return false;
  return Math.abs(Number(a.longitude) - Number(b.longitude)) < 1e-6 && Math.abs(Number(a.latitude) - Number(b.latitude)) < 1e-6;
}
function dedupeContinuousPoints(points) {
  return points.reduce((list, point) => {
    if (!point)
      return list;
    const prev = list[list.length - 1];
    if (!samePoint(prev, point))
      list.push(point);
    return list;
  }, []);
}
function nearestIndex(points, target) {
  if (!points.length || !target)
    return -1;
  let result = 0;
  let minDistance = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    const distance = Math.abs(point.longitude - target.longitude) + Math.abs(point.latitude - target.latitude);
    if (distance < minDistance) {
      minDistance = distance;
      result = index;
    }
  });
  return result;
}
const _sfc_main = {
  mixins: [utils_miniappLoginPage.miniappLoginPageMixin],
  data() {
    return {
      orderId: "",
      order: {},
      loadingRoute: false,
      routeError: "",
      routeDistanceMeter: 0,
      routeDurationSecond: 0,
      routePoints: [],
      traveledPoints: [],
      remainingPoints: [],
      pageReady: false,
      recordsPanelOpen: false,
      mapScale: 6,
      mapCenter: {
        latitude: 39.90923,
        longitude: 116.397428
      }
    };
  },
  computed: {
    originPoint() {
      return pointFrom(this.order.originLongitude, this.order.originLatitude);
    },
    destinationPoint() {
      return pointFrom(this.order.destinationLongitude, this.order.destinationLatitude);
    },
    timelineLocations() {
      return (this.order.transitLocations || []).map((loc) => ({
        ...loc,
        point: pointFrom(loc.longitude, loc.latitude)
      })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    },
    canToggleRecords() {
      return this.timelineLocations.length > 2;
    },
    visibleTimelineLocations() {
      return this.recordsPanelOpen ? this.timelineLocations : this.timelineLocations.slice(0, 2);
    },
    chronologicalLocations() {
      return [...this.timelineLocations].reverse();
    },
    routeLocations() {
      return this.chronologicalLocations.filter((loc) => loc.point);
    },
    latestTransitPoint() {
      const latest = this.routeLocations[this.routeLocations.length - 1];
      return (latest == null ? void 0 : latest.point) || this.originPoint;
    },
    includePoints() {
      return [
        this.originPoint,
        this.destinationPoint,
        ...this.routeLocations.map((loc) => loc.point)
      ].filter(Boolean);
    },
    markers() {
      const markers = [];
      if (this.originPoint) {
        markers.push({
          id: 1,
          ...this.originPoint,
          width: 28,
          height: 28,
          iconPath: "/static/map_marker.svg",
          callout: {
            content: `起点 ${this.order.originCityName || ""}`,
            color: "#0f172a",
            fontSize: 12,
            borderRadius: 6,
            padding: 6,
            display: "ALWAYS"
          }
        });
      }
      if (this.destinationPoint) {
        markers.push({
          id: 2,
          ...this.destinationPoint,
          width: 28,
          height: 28,
          iconPath: "/static/map_marker.svg",
          callout: {
            content: `终点 ${this.order.destinationCityName || ""}`,
            color: "#0f172a",
            fontSize: 12,
            borderRadius: 6,
            padding: 6,
            display: "ALWAYS"
          }
        });
      }
      this.routeLocations.forEach((loc, index) => {
        markers.push({
          id: 10 + index,
          ...loc.point,
          width: 22,
          height: 22,
          iconPath: "/static/map_marker.svg",
          callout: {
            content: index === this.routeLocations.length - 1 ? "最新位置" : `途径点${index + 1}`,
            color: "#0f172a",
            fontSize: 12,
            borderRadius: 6,
            padding: 6,
            display: index === this.routeLocations.length - 1 ? "ALWAYS" : "BYCLICK"
          }
        });
      });
      return markers;
    },
    mapPolylines() {
      const polylines = [];
      if (this.traveledPoints.length > 1) {
        polylines.push({
          points: this.traveledPoints,
          color: TRAVELED_COLOR,
          width: 7,
          arrowLine: true
        });
      }
      if (this.remainingPoints.length > 1) {
        polylines.push({
          points: this.remainingPoints,
          color: REMAINING_COLOR,
          width: 7,
          arrowLine: true
        });
      }
      if (!polylines.length && this.originPoint && this.destinationPoint) {
        polylines.push({
          points: [this.originPoint, this.destinationPoint],
          color: REMAINING_COLOR,
          width: 6,
          dottedLine: true
        });
      }
      return polylines;
    },
    routeDistanceText() {
      if (!this.routeDistanceMeter)
        return "等待路线规划";
      if (this.routeDistanceMeter >= 1e3)
        return `${(this.routeDistanceMeter / 1e3).toFixed(1)}公里`;
      return `${this.routeDistanceMeter}米`;
    },
    routeDurationText() {
      if (!this.routeDurationSecond)
        return "";
      const hours = Math.floor(this.routeDurationSecond / 3600);
      const minutes = Math.round(this.routeDurationSecond % 3600 / 60);
      if (hours > 0)
        return `约${hours}小时${minutes ? `${minutes}分钟` : ""}`;
      return `约${minutes}分钟`;
    },
    summaryStatusText() {
      const status = this.order.orderStatus;
      return utils_format.orderStatusText[status] || "在途位置";
    },
    summaryStatusClass() {
      return utils_format.statusClass(this.order.orderStatus);
    }
  },
  onLoad(options) {
    if (!utils_api.requireLogin())
      return;
    this.orderId = options.orderId || "";
    this.load();
  },
  methods: {
    dateText: utils_format.dateText,
    async load() {
      const data = await utils_api.api.orderDetail(this.orderId);
      this.order = data.order || {};
      this.pageReady = true;
      this.updateMapCenter();
      await this.buildRoute();
    },
    updateMapCenter() {
      const center = this.latestTransitPoint || this.originPoint || this.destinationPoint;
      if (center) {
        this.mapCenter = {
          latitude: center.latitude,
          longitude: center.longitude
        };
      }
    },
    splitRouteByLatest(routePoints) {
      const latest = this.latestTransitPoint;
      if (!latest || samePoint(latest, this.originPoint)) {
        this.traveledPoints = [];
        this.remainingPoints = routePoints;
        return;
      }
      const latestIndex = nearestIndex(routePoints, latest);
      if (latestIndex < 0) {
        this.traveledPoints = [];
        this.remainingPoints = routePoints;
        return;
      }
      this.traveledPoints = dedupeContinuousPoints([
        ...routePoints.slice(0, latestIndex + 1),
        latest
      ]);
      this.remainingPoints = dedupeContinuousPoints([
        latest,
        ...routePoints.slice(latestIndex + 1)
      ]);
    },
    async buildRoute() {
      this.routeError = "";
      this.routeDistanceMeter = 0;
      this.routeDurationSecond = 0;
      if (!this.originPoint || !this.destinationPoint) {
        this.routePoints = this.includePoints;
        this.traveledPoints = [];
        this.remainingPoints = this.includePoints;
        this.routeError = "订单缺少起始地或目的地坐标，暂时无法规划地图路线。";
        return;
      }
      this.loadingRoute = true;
      try {
        const waypointPoints = this.routeLocations.map((loc) => loc.point);
        const result = await utils_api.api.amapDrivingRoute({
          origin: coordinateParam(this.originPoint),
          destination: coordinateParam(this.destinationPoint),
          waypoints: waypointPoints.map(coordinateParam).join(";")
        });
        const route = result.route || {};
        const points = dedupeContinuousPoints(route.polyline || []);
        this.routePoints = points.length ? points : this.includePoints;
        this.routeDistanceMeter = Number(route.distanceMeter || 0);
        this.routeDurationSecond = Number(route.durationSecond || 0);
        this.splitRouteByLatest(this.routePoints);
      } catch (error) {
        this.routePoints = this.includePoints;
        this.splitRouteByLatest(this.routePoints);
        this.routeError = (error == null ? void 0 : error.message) || "路径规划失败，已使用已知坐标展示直线路线。";
      } finally {
        this.loadingRoute = false;
      }
    },
    toggleRecordsPanel() {
      this.recordsPanelOpen = !this.recordsPanelOpen;
    }
  }
};
if (!Array) {
  const _easycom_miniapp_login_sheet2 = common_vendor.resolveComponent("miniapp-login-sheet");
  _easycom_miniapp_login_sheet2();
}
const _easycom_miniapp_login_sheet = () => "../../components/miniapp-login-sheet/miniapp-login-sheet.js";
if (!Math) {
  _easycom_miniapp_login_sheet();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.pageReady
  }, $data.pageReady ? common_vendor.e({
    b: $data.mapCenter.latitude,
    c: $data.mapCenter.longitude,
    d: $data.mapScale,
    e: $options.markers,
    f: $options.mapPolylines,
    g: $options.includePoints,
    h: common_vendor.t($data.order.carrierName || "承运商"),
    i: common_vendor.t($data.order.originCityName),
    j: common_vendor.t($data.order.destinationCityName),
    k: common_vendor.t($options.summaryStatusText),
    l: common_vendor.n($options.summaryStatusClass),
    m: common_vendor.t($options.timelineLocations.length),
    n: common_vendor.t($options.routeDistanceText),
    o: $options.routeDurationText
  }, $options.routeDurationText ? {
    p: common_vendor.t($options.routeDurationText)
  } : {}, {
    q: $options.canToggleRecords
  }, $options.canToggleRecords ? {
    r: common_vendor.t($data.recordsPanelOpen ? "收起" : "查看全部"),
    s: common_vendor.o((...args) => $options.toggleRecordsPanel && $options.toggleRecordsPanel(...args), "38")
  } : {}, {
    t: $data.routeError
  }, $data.routeError ? {
    v: common_vendor.t($data.routeError)
  } : {}, {
    w: $options.timelineLocations.length
  }, $options.timelineLocations.length ? {
    x: common_vendor.f($options.visibleTimelineLocations, (loc, idx, i0) => {
      return common_vendor.e({
        a: common_vendor.t(idx + 1),
        b: idx === 0 ? 1 : "",
        c: common_vendor.t(loc.cityName || "在途位置"),
        d: common_vendor.t($options.dateText(loc.createdAt)),
        e: common_vendor.t(loc.address || "-"),
        f: loc.remark
      }, loc.remark ? {
        g: common_vendor.t(loc.remark)
      } : {}, {
        h: idx
      });
    }),
    y: $data.recordsPanelOpen ? 1 : ""
  } : {}, {
    z: $data.recordsPanelOpen ? 1 : ""
  }) : {
    A: common_vendor.sr("loginSheet", "3afe98bf-0"),
    B: common_vendor.o(_ctx.handleLoginSuccess, "0f")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/order/transit-track.js.map
