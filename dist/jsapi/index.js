/**
 * jsapi 支付
 */
const jsapi = {}

/**
 * 下单
 * 
 * @param param 请求参数
 */
jsapi.jsapiPay = function (param) {
    // 当前时间戳
    let timestamp = Math.floor(Date.now() / 1000)
    // 随机字符串
    let randomString = this.getRandomString()
    // 签名值
    let signature = this.getSignature("POST", "/v3/pay/transactions/jsapi", timestamp, randomString, JSON.stringify(param))
    // 请求头 authorization
    let authorization = this.getAuthorization(randomString, timestamp, signature)

    return new Promise((resolve, reject) => {
        // 判断是否有参数
        if (param) {
            // 发送请求
            this.axios({
                url: "https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi",
                method: "post",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": authorization
                },
                data: param
            }).then((res) => {
                let appid = param.appid
                let timeStamp = Math.floor(Date.now() / 1000)
                let nonceStr = this.getRandomString()
                let package = "prepay_id=" + res.data.prepay_id
                let paySign = this.getJsapiSignature(appid,timeStamp,nonceStr,package)
                resolve({
                    code: res.status,
                    data: {
                        appid: appid,
                        timeStamp: String(timeStamp),
                        nonceStr: nonceStr,
                        package: package,
                        signType: "RSA",
                        paySign: paySign
                    },
                    msg: "success"
                })
            }).catch((err) => {
                reject({
                    code: err.response ? err.response.status : 500,
                    data: err.response ? err.response.data : err,
                    msg: "jsapi 支付下单返回异常"
                })
            })
        } else {
            reject({
                code: 500,
                msg: "jsapi 支付下单失败，失败原因：缺少参数 param，未发送请求"
            })
        }
    })
}

module.exports = jsapi