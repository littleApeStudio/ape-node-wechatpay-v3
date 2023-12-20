# ape-node-wechatpay-v3

# 目录

[安装](#安装)

- [npm](#npm)

[用法介绍](#用法介绍)

- [创建 weChatPay 实例](#创建-weChatPay-实例)

- [获取签名值](#获取签名值)

- [获取 HTTP Authorization 头](#获取-http-authorization-头)

- [获取 jsapi 客户端签名值](#获取jsapi客户端签名值)

- [下载微信支付平台证书](#下载微信支付平台证书)

- [支付回调签名验证](#支付回调签名验证)

- [证书、回调解密](#回调解密)

[内置方法介绍](#内置方法介绍)

- [Jsapi 下单](#Jsapi-下单)

- [Native 下单](#Native-下单)

[版本介绍](#版本介绍)

## 安装

### npm

```ssh
npm i ape-node-wechatpay-v3 --save
```

## weChatPay 用法介绍

### 创建 weChatPay 实例

创建实例

```javascript
const apeWeChatPay = require("ape-node-wechatpay-v3");
const fs = require("fs");

const weChatPay = new apeWeChatPay({
  appid: "xxxxxxxxxx",
  mchid: "xxxxxxxxxx",
  serial_no: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authType: "WECHATPAY2-SHA256-RSA2048",
  apiclientCert: fs.readFileSync("xxx/certificate/apiclient_cert.pem"),
  apiclientkey: fs.readFileSync("xxx/certificate/apiclient_key.pem"),
  certPath: "xxx/certificate",
  APIv3: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
});
```

参数说明

| 参数名称      | 参数介绍                                                                                                                                       | 是否必须 |
| :------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| appid         | 公众号（移动应用 / 小程序）的 appid                                                                                                            | 否       |
| mchid         | 商户号                                                                                                                                         | 是       |
| serial_no     | 证书序列号                                                                                                                                     | 是       |
| authType      | 请求头签名认证类型，不传则默认为 WECHATPAY2-SHA256-RSA2048                                                                                     | 否       |
| apiclientCert | 公钥                                                                                                                                           | 是       |
| apiclientkey  | 密钥                                                                                                                                           | 是       |
| certPath      | 微信支付平台证书下载路径（需要回调解密以及验证签名则必填）【包含 wechatpay.pem 和 wechatpaySerial.txt 俩个文件】，建议与公钥密钥在一个文件夹内 | 否       |
| APIv3         | 商户后台配置的 APIv3 密钥（需要回调解密以及验证签名则必填）                                                                                    | 否       |
| userAgent     | 微信支付平台证书下载接口请求头 user-agent（默认为 node Serve）                                                                                 | 否       |

`注意：serial_no 是证书序列号，请在商户后台查看。`

### 获取签名值

示例代码

```javascript
let signature = weChatPay.getSignature(method, url, timestamp, nonce_str, body);
```

参数说明

| 参数名称    | 参数介绍                                       | 是否必须 |
| :---------- | :--------------------------------------------- | :------- |
| `method`    | 支付接口方法                                   | 是       |
| `url`       | 支付接口地址                                   | 是       |
| `timestamp` | 时间戳                                         | 是       |
| `nonce_str` | 请求随机串                                     | 是       |
| `body`      | 请求体（接口需要传则给，反之给空字符串，如""） | 否       |

### 获取 HTTP Authorization 头

示例代码

```javascript
let authorization = weChatPay.getAuthorization(nonce_str, timestamp, signature);
```

参数说明

| 参数名称    | 参数介绍                             | 是否必须 |
| :---------- | :----------------------------------- | :------- |
| `nonce_str` | 请求随机串（需要与获取签名值的一致） | 是       |
| `timestamp` | 时间戳                               | 是       |
| `signature` | 签名值                               | 是       |

### 获取 jsapi 客户端签名值

示例代码

```javascript
let paySign = this.getJsapiSignature(appid, timeStamp, nonceStr, package);
```

参数说明

| 参数名称    | 参数介绍           | 是否必须 |
| :---------- | :----------------- | :------- |
| `appid`     | 应用 ID            | 是       |
| `timeStamp` | 时间戳             | 是       |
| `nonceStr`  | 随机字符串         | 是       |
| `package`   | 订单详情扩展字符串 | 是       |

### 下载微信支付平台证书

会生成 wechatpay.pem 和 wechatpaySerial.txt 俩个文件，每次更新会覆盖旧的。

`微信官方建议在十二小时内更新，可以写定时任务`

示例代码

```javascript
let result = {};
try {
  result = await weChatPay.getWeChatPayCert();
} catch (error) {
  console.log(error);
}
console.log(result);
// { code: 200, msg: '下载证书成功' }
```

`！！！使用此方法必须在构造实体类时传递 certPath 、 APIv3 这俩个参数 ！！！`

文件说明

| 文件名称            | 说明                                             |
| :------------------ | :----------------------------------------------- |
| wechatpay.pem       | 下载平台证书接口解密出来公钥（回调签名验证需要） |
| wechatpaySerial.txt | 下载平台证书接口的公钥序列号（回调签名验证需要） |

返回说明（为了方便开发者做对应的处理）

| code                          | data                               | msg      |
| :---------------------------- | :--------------------------------- | :------- |
| 200                           | 下载成功                           | 解释说明 |
| 500 / 其他（在 catch 里返回） | 下载失败（错误信息），详细请看 msg | 解释说明 |

### 支付回调签名验证

示例代码

```javascript
let Body = req.body; // 微信请求你的回调接口的实体类 body
let Headers = req.headers; // 微信请求你的回调接口的 headers
let result = null;
try {
  result = await weChatPay.verifySignature(
    Headers["wechatpay-signature"], // 应答签名
    Headers["wechatpay-serial"], // 平台证书序列号
    Headers["wechatpay-timestamp"], // 生成签名的时间戳
    Headers["wechatpay-nonce"], // 应答随机串
    req.body
  );
} catch (error) {
  console.log(error);
}
console.log(result);
// { code: 200, msg: '验签名串和签名验证通过' }
```

`！！！使用此方法必须在构造实体类时传递 certPath 、 APIv3 这俩个参数 ！！！`

返回说明（为了方便开发者做对应的处理）

| code                          | data                               | msg      |
| :---------------------------- | :--------------------------------- | :------- |
| 200                           | 验证通过                           | 解释说明 |
| 500 / 其他（在 catch 里返回） | 验证失败（错误信息），详细请看 msg | 解释说明 |

### 回调解密

建议在签名验证成功后解密

示例代码

```javascript
let Body = req.body; // 微信请求你的回调接口的实体类 body
let Headers = req.headers; // 微信请求你的回调接口的 headers
let data = null;
try {
  data = await weChatPay.decrypting(
    Body.resource.ciphertext, // 结果数据密文
    Body.resource.nonce, // 加密使用的随机串
    Body.resource.associated_data // 附加数据
  );
} catch (error) {
  console.log(error);
}
console.log(data);
// { code: 200, data: xxxx(解密的数据), msg: '解密成功' }
```

`！！！使用此方法必须在构造实体类时传递 certPath 、 APIv3 这俩个参数 ！！！`

返回说明（为了方便开发者做对应的处理）

| code                          | data                               | msg      |
| :---------------------------- | :--------------------------------- | :------- |
| 200                           | 解密出来的数据                     | 解释说明 |
| 500 / 其他（在 catch 里返回） | 解密失败（错误信息），详细请看 msg | 解释说明 |

## weChatPay 内置方法介绍

### Jsapi 下单

示例代码

```javascript
let data = {
  appid: "xxxxxx",
  mchid: "xxxxxx",
  description: "测试",
  out_trade_no: "xxxxxx",
  notify_url: "xxxxxx",
  amount: {
    total: 1,
  },
  payer: {
    openid: "xxxxxx",
  },
};
let result;
try {
  result = await weChatPay.jsapiPay(data);
} catch (error) {
  console.log(error);
}
console.log(result);
// 正常返回如下示例(data中包含jsapi支付客户端（小程序或者网页）所需要的全部参数)
// {
//   code: 200,
//   data: {
//     appid: 'xxxxxx',
//     timeStamp: 'xxxxxx',
//     nonceStr: 'xxxxxx',
//     package: 'prepay_id=xxxxxx',
//     signType: 'RSA',
//     paySign: 'xxxxxx'
//   },
//   msg: 'success'
// }
```

参数说明

| 参数名称 | 参数介绍               | 是否必须 |
| :------- | :--------------------- | :------- |
| `data`   | jsapi 下单的 body 参数 | 是       |

[详细请点击查看微信官方-jsapi-下单文档](https://pay.weixin.qq.com/docs/merchant/apis/jsapi-payment/direct-jsons/jsapi-prepay.html)

### Native 下单

示例代码

```javascript
let data = {
  appid: "xxxxxx",
  mchid: "xxxxxx",
  description: "测试",
  out_trade_no: "xxxxxx",
  notify_url: "xxxxxx",
  amount: {
    total: 1,
  },
};
let result;
try {
  result = await weChatPay.nativePay(data);
} catch (error) {
  console.log(error);
}
console.log(result);
// 正常返回如下示例
// {
//     "code": 200,
//     "code_url": "xxxxxxxxxx"
// }
```

参数说明

| 参数名称 | 参数介绍                | 是否必须 |
| :------- | :---------------------- | :------- |
| `data`   | native 下单的 body 参数 | 是       |

[详细请点击查看微信官方-native-下单文档](https://pay.weixin.qq.com/docs/merchant/apis/native-payment/direct-jsons/native-prepay.html)

## 版本介绍

| 版本号 | 版本介绍                                                                           |
| :----- | :--------------------------------------------------------------------------------- |
| 1.0.0  | 仅支持获取签名和获取头部参数 Authorization                                         |
| 1.0.1  | 在 1.0.0 的基础上增加了说明文档                                                    |
| 1.0.2  | 增加了 native 支付下单函数的封装                                                   |
| 1.0.21 | 增加了 jsapi 支付下单函数的封装                                                    |
| 1.0.3  | 增加了微信支付平台证书下载方法、支付回调签名验证的方法、 证书（回调)解密方法的封装 |
