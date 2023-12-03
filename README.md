# ape-node-wechatpay-v3

## 1、安装

#### npm

`npm i ape-node-wechatpay-v3 --save`

---

## 2、weChatPay 用法介绍

#### 创建实例

```javascript
const weChatPay = require('ape-node-wechatpay-v3');
const fs = require('fs');

const wxPay = new weChatPay({
  appid: 'xxxxxx',
  mchid: 'xxxxxx',
  serial_no: 'xxxxxx',
  apiclientCert: fs.readFileSync('xxxxxx.pem'),
  apiclientkey: fs.readFileSync('xxxxxx.pem'),
});
```

#### 创建实例参数说明

| 参数名称        | 参数介绍                                         | 是否必须 |
| :-------------- | :----------------------------------------------- | :------- |
| `appid`         | 直连商户申请的公众号或移动应用 appid             | 是       |
| `mchid`         | 商户号                                           | 是       |
| `serial_no`     | 证书序列号                                       | 是       |
| `apiclientCert` | 公钥                                             | 是       |
| `apiclientkey`  | 密钥                                             | 是       |
| `authType`      | 认证类型，不传则默认为 WECHATPAY2-SHA256-RSA2048 | 否       |

###### 注意：

1、serial_no 是证书序列号，请在商户后台查看。

#### 获取签名值

```javascript
let signature = wxPay.getSignature(method, url, timestamp, nonce_str, body);
```

#### 获取签名值参数说明

| 参数名称    | 参数介绍                           | 是否必须 |
| :---------- | :--------------------------------- | :------- |
| `method`    | 支付接口方法                       | 是       |
| `url`       | 支付接口地址                       | 是       |
| `timestamp` | 时间戳                             | 是       |
| `nonce_str` | 请求随机串                         | 是       |
| `body`      | 请求体（接口需要传则给，反之不给） | 否       |

#### 获取 HTTP Authorization 头

```javascript
let authorization = wxPay.getAuthorization(nonce_str, timestamp, signature);
```

#### 获取获取 HTTP Authorization 头参数说明

| 参数名称    | 参数介绍                             | 是否必须 |
| :---------- | :----------------------------------- | :------- |
| `nonce_str` | 请求随机串（需要与获取签名值的一致） | 是       |
| `timestamp` | 时间戳                               | 是       |
| `signature` | 签名值                               | 是       |

---

## 3、weChatPay 内置方法介绍

#### Native 下单

```javascript
let data = {
  appid: 'xxxxxx',
  mchid: 'xxxxxx',
  description: '测试',
  out_trade_no: 'xxxxxx',
  notify_url: 'xxxxxx',
  amount: {
    total: 1,
  },
};
let result;
try {
  result = await wxPay.nativePay(data);
} catch (error) {
  console.log(error);
}
console.log(resuult);
```

#### Native 下单参数说明

| 参数名称      | 参数介绍                            | 是否必须                                                                                      |
| :------------ | :---------------------------------- | :-------------------------------------------------------------------------------------------- |
| `data`        | native 下单的 body 参数             | 是                                                                                            |
| data 里的参数 | 微信官方文档有说明（Body 包体参数） | <https://pay.weixin.qq.com/docs/merchant/apis/native-payment/direct-jsons/native-prepay.html> |

---

## 4、版本介绍

| 版本号 | 版本介绍                                   |
| :----- | :----------------------------------------- |
| 1.0.0  | 仅支持获取签名和获取头部参数 Authorization |
| 1.0.1  | 在 1.0.0 的基础上增加了说明文档            |
| 1.0.2  | 增加了 native 支付下单函数的封装           |

######
