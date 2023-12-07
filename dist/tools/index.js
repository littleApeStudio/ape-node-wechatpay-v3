/**
 * 工具
 */
const tools = {};

/**
 * 生成随机字符串
 *
 * @param length 随机字符串长度
 */
tools.getRandomString = function (length) {
  var resLen = length || 32;
  var result = "";
  var str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var strLen = str.length;
  for (var i = 0; i < resLen; i++) {
    result += str.charAt(Math.floor(Math.random() * strLen));
  }
  return result;
};

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
  let signString = `${method}\n${url}\n${timestamp}\n${nonce_str}\n${
    body || ""
  }\n`;
  // 创建Sign对象，并指定算法为SHA256
  let createSign = this.crypto.createSign("SHA256");
  // 更新签名串
  createSign.update(signString);
  // 使用私钥进行签名
  let signature = createSign.sign(this.apiclientkey);
  // 对签名结果进行Base64编码
  signature = signature.toString("base64");
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
 * 下载微信支付平台证书
 *
 * @param userAgent HTTP头User-Agent
 * @param downloadPath 微信支付平台证书下载路径（包含 wechatpay.pem 证书文件和 wechatpay.json 下载证书接口的应答报文）
 */
tools.getWeChatPayCert = function (userAgent, downloadPath) {
  // 当前时间戳
  let timestamp = Math.floor(Date.now() / 1000);
  // 随机字符串
  let randomString = this.getRandomString();
  // 签名值
  let signature = this.getSignature(
    "GET",
    "/v3/certificates",
    timestamp,
    randomString,
    ""
  );
  // 请求头 authorization
  let authorization = this.getAuthorization(randomString, timestamp, signature);

  return new Promise((resolve, reject) => {
    // 发送请求
    this.axios({
      url: "https://api.mch.weixin.qq.com/v3/certificates",
      method: "get",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": userAgent || "userAgent",
        Authorization: authorization,
      },
      data: param,
    })
      .then((res) => {
        console.log(res);
        let body = JSON.stringify("{}");
        let pem = "";
        // 下载应答报文到本地
        this.fs.writeFile(downloadPath + "/wechatpay.json", body, (err) => {
          if (err) {
            reject(err);
          } else {
            // 下载 pem 证书到本地
            this.fs.writeFile(downloadPath + "/wechatpay.pem", pem, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve({
                  code: 200,
                  msg: "下载证书成功",
                });
              }
            });
          }
        });
      })
      .catch((err) => {
        reject({
          code: err.response ? err.response.status : "",
          data: err.response ? err.response.data : "",
          msg: "下载微信支付平台证书返回异常",
        });
      });
  });
};

/**
 * 支付回调签名验证
 *
 * @param Signature  应答的 HTTP 头部 Wechatpay-Signature
 * @param Serial  应答的 HTTP 头部 Wechatpay-Serial
 * @param Timestamp  应答的 HTTP 头部 Wechatpay-Timestamp
 * @param Nonce  应答的 HTTP 头部 Wechatpay-Nonce
 */
tools.verifySignature = function (Signature, Serial, Timestamp, Nonce) {
  // 获取微信支付平台证书
  const weChatPayCert = "";
  // 下载微信支付平台证书的应答报文主体
  let Body = {};
  // 构造验签名串
  let signStr = `${Timestamp}\n${Nonce}\n${Body}\n`;
  // 使用 base64 解码 Wechatpay-Signature 字段值，得到应答签名
  let weChatPaySignature = Buffer.from(Signature, "base64").toString("utf-8");
  // 使用微信支付平台公钥对签名进行解密
  let decrypt = this.crypto.createDecipheriv(
    "RSA-SHA256",
    weChatPayCert,
    Buffer.alloc(16, 0)
  );
  // 微信签名进行SHA256哈希运算
  let decryptData = decrypt.update(weChatPaySignature, "hex", "utf8");
  decryptData += decrypt.final("utf8");
  // 对解密后的数据进行SHA256哈希运算
  let hash = this.crypto.createHash("sha256");
  hash.update(signStr);
  let hashValue = hash.digest("hex");
  // 将哈希值与微信支付平台提供的原始签名进行对比
  if (hashValue === decryptData) {
    console.log("验签名串和签名验证通过");
  } else {
    console.log("验签名串和签名验证失败");
  }
};

/**
 * 
 * @ cipher 要解密的数据
 * @ key APIv3密钥
 * @ nonce 加密证书的随机串
 * @ algorithm 加密算法
 */
tools.decryptingBody = function (cipher, key, nonce, algorithm) {
  // 要解密的数据
  const ciphertext = Buffer.from(cipher);
  // 创建AEAD_AES_256_GCM模式的解密器
  const decipher = this.crypto.createDecipheriv(algorithm || "AEAD_AES_256_GCM", key, nonce);
  // 解密数据
  const plaintext = decipher.update(ciphertext, "hex", "utf8");
  const tag = decipher.final();
  return {
    plaintext: plaintext,
    tag: tag,
  };
};

module.exports = tools;
