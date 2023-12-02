function weChatPay(data) {
    this.crypto = require('crypto');

    this.serialNo = data.serial_no // 商户证书序列号
    this.appid = data.appid //公众平台 appid
    this.mchid = data.mchid //商户号
    this.apiclientCert = data.apiclientCert //公钥
    this.apiclientkey = data.apiclientkey //密钥
    this.AuType = data.AuType || "WECHATPAY2-SHA256-RSA2048"

    // 获取签名
    this.getSignature = function (method, url, timestamp, nonce_str, body) {// 请求方法，请求地址，时间戳，请求随机串，请求体
        // 生成签名串
        let signString = `${method}\n${url}\n${timestamp}\n${nonce_str}\n${body || ""}\n`
        // 创建Sign对象，并指定算法为SHA256
        let createSign = this.crypto.createSign('SHA256');
        // 更新签名串
        createSign.update(signString);
        // 使用私钥进行签名
        let signature = createSign.sign(this.apiclientkey);
        // 对签名结果进行Base64编码
        signature = signature.toString('base64');
        // 返回签名
        return signature
    }
    // 生成 Authorization
    this.getAuthorization = function (nonce_str, timestamp, signature) { // 请求随机串，时间戳，签名值
        // 生成 Authorization
        let authorization = `${this.AuType} mchid="${this.mchid}",nonce_str="${nonce_str}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.serialNo}"`
        // 返回 Authorization
        return authorization
    }
}

module.exports = weChatPay