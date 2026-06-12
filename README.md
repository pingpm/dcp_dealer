# 车商端 uniapp

车商端用于车商认证、搜索承运商、联系承运商、发起订单、支付担保交易费、查看履约和确认收车。

## 启动

当前目录为 uniapp 工程，可通过 HBuilderX 打开并运行到微信开发者工具，也可从仓库根目录运行：

```bash
npm run dev:dealer
```

本地 H5 调试可进入当前 workspace 运行：

```bash
npm --workspace @car-transport/dealer-uniapp run dev:h5
```

接口默认请求：

```bash
http://127.0.0.1:3001/api
```

需要先启动后端：

```bash
npm run dev:api
npm run dev:dealer
```

## 当前页面范围

- 登录、认证状态、车商认证表单。
- 首页搜索、搜索结果、联系承运商、发起订单。
- 订单填写、担保交易费支付成功反馈、订单列表、订单详情。
- 模拟合同确认、取消申请、取消协商历史。
- 我的、通知设置。

## 约定

- 车商端主色使用橘色。
- 内部状态值必须使用 `docs/schema/enums.md` 中的英文枚举。
- 金额字段使用整数分，API 字段后缀使用 `Cent`。
- 当前开发支付流程使用后端支付回调骨架模拟成功，真实微信支付参数接入留到外部支付任务。
