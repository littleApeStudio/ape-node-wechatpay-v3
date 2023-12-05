class apeWeChatPay {
    constructor(data) {
        /**
         * axios
         */
        this.axios = require("axios")
        /**
         * node 内置加解密模块
         */
        this.crypto = require('crypto');
        /**
         * 商户证书序列号
         */
        this.serialNo = data.serial_no;
        /**
         * 公众平台 appid
         */
        this.appid = data.appid;
        /**
         * 商户号
         */
        this.mchid = data.mchid;
        /**
         * 公钥
         */
        this.apiclientCert = data.apiclientCert;
        /**
         * 密钥
         */
        this.apiclientkey = data.apiclientkey;
        /**
         * 签名类型
         */
        this.authType = data.authType || "WECHATPAY2-SHA256-RSA2048";
    }
}

/**
 * 导入工具方法（获取签名值 / 获取请求头 Authorization / 随机字符串生成函数 ）
 */
const tools = require("./dist/tools/index")
Object.assign(apeWeChatPay.prototype, tools);

/**
 * 导入 Jsapi 支付方法（下单 ）
 */
const jsapi = require("./dist/jsapi/index")
Object.assign(apeWeChatPay.prototype, jsapi);

/**
 * 导入 Native 支付方法（下单 ）
 */
const native = require("./dist/native/index")
Object.assign(apeWeChatPay.prototype, native);

/**
 * 导出类
 */
module.exports = apeWeChatPay