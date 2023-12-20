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
  let signString = `${method}\n${url}\n${timestamp}\n${nonce_str}\n${body}\n`;
  // 创建Sign对象，并指定算法为SHA256
  let createSign = this.crypto.createSign("SHA256");
  // 更新签名串
  createSign.update(signString);
  // 使用公钥进行签名
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
 *
 * @param appid 应用ID
 * @param timeStamp 时间戳
 * @param nonceStr 随机字符串
 * @param package 订单详情扩展字符串
 */
tools.getJsapiSignature = function (appid, timeStamp, nonceStr, package) {
  // 生成签名串
  let signString = `${appid}\n${timeStamp}\n${nonceStr}\n${package}\n`;
  // 创建Sign对象，并指定算法为SHA256
  let createSign = this.crypto.createSign("SHA256");
  // 更新签名串
  createSign.update(signString);
  // 使用公钥进行签名
  let signature = createSign.sign(this.apiclientkey);
  // 对签名结果进行Base64编码
  signature = signature.toString("base64");
  // 返回签名
  return signature;
};

/**
 * 下载微信支付平台证书（会生成 wechatpay.pem 和 wechatpaySerial.txt 俩个文件）
 */
tools.getWeChatPayCert = function () {
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
        "User-Agent": this.userAgent,
        Authorization: authorization,
      },
    })
      .then(async (res) => {
        let data = res.data;
        let certData = {};
        if (data.data.length > 1) {
          certData = data.data[data.data.length - 1];
        } else {
          certData = data.data[0];
        }
        // 需要解密的证书密文
        let ciphertext = certData.encrypt_certificate.ciphertext;
        // 加密证书的随机串
        let nonce = certData.encrypt_certificate.nonce;
        // 加密证书的附加数据
        let associated_data = certData.encrypt_certificate.associated_data;
        // 解密内容
        let pem = null;
        try {
          pem = await this.decrypting(ciphertext, nonce, associated_data);
        } catch (error) {
          reject(error);
        }
        if (pem.code === 200) {
          // 下载应答报文到本地
          this.fs.writeFile(
            this.certPath + "/wechatpaySerial.txt",
            certData.serial_no,
            (err) => {
              if (err) {
                reject({
                  code: 500,
                  data: err,
                  msg: "保存微信支付平台证书序列号失败",
                });
              } else {
                // 下载 pem 证书到本地
                this.fs.writeFile(
                  this.certPath + "/wechatpay.pem",
                  pem.data,
                  (err) => {
                    if (err) {
                      reject({
                        code: 500,
                        data: err,
                        msg: "保存微信支付平台证书失败",
                      });
                    } else {
                      resolve({
                        code: 200,
                        msg: "下载证书成功",
                      });
                    }
                  }
                );
              }
            }
          );
        } else {
          reject({
            code: 500,
            msg: "解密微信支付平台证书异常",
          });
        }
      })
      .catch((err) => {
        reject({
          code: err.response ? err.response.status : 500,
          data: err.response ? err.response.data : err,
          msg: "下载微信支付平台证书接口异常",
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
 * @param Body  应答的 Body 体
 */
tools.verifySignature = function (Signature, Serial, Timestamp, Nonce, Body) {
  return new Promise((resolve, reject) => {
    try {
      // 获取微信支付平台证书
      let wechatpayCert = this.fs
        .readFileSync(this.certPath + "/wechatpay.pem")
        .toString("utf-8");
      // 下载微信支付平台证书的序列号
      let wechatpaySerial = this.fs
        .readFileSync(this.certPath + "/wechatpaySerial.txt")
        .toString("utf-8");
      // 验证证书序列号是否一致
      if (wechatpaySerial === Serial) {
        // 防止重放攻击，验证时间戳是否五分钟内
        if (Timestamp) {
          // // 构造验签名串
          let signStr = `${Timestamp}\n${Nonce}\n${JSON.stringify(Body)}\n`;
          // 使用 base64 解码 Wechatpay-Signature 字段值，得到应答签名
          let decodedSignature = Buffer.from(Signature, "base64");
          // 使用微信支付平台公钥对签名进行解密
          const verify = this.crypto.createVerify("SHA256");
          // 传入要验证的数据
          verify.update(signStr);
          // 验证签名
          const isValid = verify.verify(wechatpayCert, decodedSignature);
          if (isValid) {
            resolve({
              code: 200,
              msg: "验签名串和签名验证通过",
            });
          } else {
            reject({
              code: 403,
              msg: "验签名串和签名验证失败",
            });
          }
        } else {
          reject({
            code: 403,
            msg: "时间戳验证失败，非五分钟内",
          });
        }
      } else {
        reject({
          code: 401,
          msg: "证书序列号验证失败",
        });
      }
    } catch (error) {
      reject({
        code: 500,
        data: error,
        msg: "验证失败",
      });
    }
  });
};

/**
 * 证书、回调解密
 *
 * @ ciphertext 加密的数据
 * @ nonce 加密的随机串
 * @ associated_data 加密的附加数据
 */
tools.decrypting = function (ciphertext, nonce, associated_data) {
  return new Promise((resolve, reject) => {
    try {
      // 将密钥字符串转换为 Buffer 对象
      const keyBytes = Buffer.from(this.APIv3);
      // 将 加密证书的随机串、加密证书的附加数据转换为 Buffer 对象
      const nonceBytes = Buffer.from(nonce);
      const adBytes = Buffer.from(associated_data);
      // 将 Base64 编码的密文字符串转换为 Buffer 对象
      const data = Buffer.from(ciphertext, "base64");
      // 使用 AES-GCM 算法创建 Cipher 对象
      const aesGCM = this.crypto.createDecipheriv(
        "aes-256-gcm",
        keyBytes,
        nonceBytes
      );
      // 设置关联数据
      aesGCM.setAAD(adBytes);
      // 设置解密时需要验证的 tag
      aesGCM.setAuthTag(data.subarray(-16));
      // 对数据进行解密并获取结果
      let decrypted = aesGCM.update(data.subarray(0, -16));
      aesGCM.final();
      decrypted = decrypted.toString("utf-8") || null;
      resolve({
        code: 200,
        data: decrypted,
        msg: "解密成功",
      });
    } catch (error) {
      reject({
        code: 500,
        data: error,
        msg: "解密失败",
      });
    }
  });
};

module.exports = tools;
