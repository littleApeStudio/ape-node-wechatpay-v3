const axios = require("axios")



/**
 * native 支付
 */
const native = {}



/**
 * 下单
 * 
 * @param param 请求参数
 */
native.nativePay = function (param) {
    // 当前时间戳
    let timestamp = Math.round(Date.now() / 1000)
    // 随机字符串
    let randomString = this.getRandomString()
    // 签名值
    let signature = this.getSignature("POST", "/v3/pay/transactions/native", timestamp, randomString, JSON.stringify(param))
    // 请求头 authorization
    let authorization = this.getAuthorization(randomString, timestamp, signature)

    return new Promise((resolve, reject) => {
        // 判断是否有参数
        if (param) {
            // 发送请求
            axios({
                url: "https://api.mch.weixin.qq.com/v3/pay/transactions/native",
                method: "post",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": authorization
                },
                data: param
            }).then((res) => {
                resolve({
                    code: res.status,
                    code_url: res.data.code_url
                })
            }).catch((err) => {
                reject(JSON.stringify({
                    code: err.response ? err.response.status : "",
                    data: err.response ? err.response.data : ""
                }))
            })
        } else {
            reject("Native 支付下单失败，失败原因：缺少参数 param，未发送请求")
        }
    })
}



module.exports = native