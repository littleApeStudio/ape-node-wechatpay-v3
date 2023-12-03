/**
 * 工具
 */
const tools = {}



/**
 * 获取签名
 * 
 * @param method 接口请求方法
 * @param url 接口请求地址
 * @param timestamp 时间戳
 * @param nonce_str 请求随机串
 * @param body 请求体
 */
tools.getSignature = function (method, url, timestamp, nonce_str, body) {
    // 生成签名串
    let signString = `${method}\n${url}\n${timestamp}\n${nonce_str}\n${body || ""}\n`;
    // 创建Sign对象，并指定算法为SHA256
    let createSign = this.crypto.createSign('SHA256');
    // 更新签名串
    createSign.update(signString);
    // 使用私钥进行签名
    let signature = createSign.sign(this.apiclientkey);
    // 对签名结果进行Base64编码
    signature = signature.toString('base64');
    // 返回签名
    return signature;
};



/**
 * 生成 Authorization
 * 
 * @param nonce_str 请求随机串（每次调用需要与获取签名的同步）
 * @param timestamp 时间戳
 * @param signature 签名值
 */
tools.getAuthorization = function (nonce_str, timestamp, signature) {
    // 生成 Authorization
    let authorization = `${this.authType} mchid="${this.mchid}",nonce_str="${nonce_str}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.serialNo}"`;
    // 返回 Authorization
    return authorization;
};



/**
 * 生成随机字符串
 * 
 * @param length 随机字符串长度
 */
tools.getRandomString = function (length) {
    var resLen = length || 32
    var result = '';
    var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var strLen = str.length;
    for (var i = 0; i < resLen; i++) {
        result += str.charAt(Math.floor(Math.random() * strLen));
    }
    return result;
}



module.exports = tools