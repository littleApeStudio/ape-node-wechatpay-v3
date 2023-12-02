# ape-node-wechatpay-v3

## 安装

#### npm

`npm i ape-node-wechatpay-v3 --save`

## weChatPay 用法介绍

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

| 参数名称 | 参数介绍                      | 是否必须 |
| :-------------- | :----------------------------------- | :-------------- |
| `appid`         | 直连商户申请的公众号或移动应用 appid | 否              |
| `mchid`         | 商户号                               | 是              |
| `serial_no`     | 证书序列号                           | 是              |
| `apiclientCert` | 公钥                                 | 是              |
| `apiclientkey`  | 密钥                                 | 是              |
| `AuType`  | 认证类型，不传则默认为WECHATPAY2-SHA256-RSA2048| 否              |

###### 注意：

1、serial_no 是证书序列号，请在商户后台查看。

#### 获取签名值

```javascript
let signature = wxPay.getSignature(method, url, timestamp, nonce_str, body);
```

#### 获取签名值参数说明

| 参数名称 | 参数介绍                    | 是否必须 |
| :-------------- | :--------------------------------- | :-------------- |
| `method`        | 支付接口方法                       | 是              |
| `url`           | 支付接口地址                       | 是              |
| `timestamp`     | 时间戳                             | 是              |
| `nonce_str`     | 请求随机串                         | 是              |
| `body`          | 请求体（接口需要传则给，反之不给） | 否              |

#### 获取 HTTP Authorization 头

```javascript
let authorization = wxPay.getAuthorization(nonce_str, timestamp, signature);
```

#### 获取获取 HTTP Authorization 头参数说明

| 参数名称 | 参数介绍                      | 是否必须 |
| :-------------- | :----------------------------------- | :-------------- |
| `nonce_str`     | 请求随机串（需要与获取签名值的一致） | 是              |
| `timestamp`     | 时间戳                               | 是              |
| `signature`     | 签名值                               | 是              |

## 版本介绍

| 版本号 | 版本介绍                            |
| :------------ | :----------------------------------------- |
| 1.0.0         | 仅支持获取签名和获取头部参数 Authorization |
| 1.0.1         | 在 1.0.0 的基础上增加了说明文档            |

######
