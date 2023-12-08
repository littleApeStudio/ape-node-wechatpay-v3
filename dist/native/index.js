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
    let timestamp = Math.floor(Date.now() / 1000)
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
            this.axios({
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
                    code_url: res.data.code_url,
                    msg: "success"
                })
            }).catch((err) => {
                reject({
                    code: err.response ? err.response.status : 500,
                    data: err.response ? err.response.data : "",
                    msg: "Native 支付下单返回异常"
                })
            })
        } else {
            reject({
                code: 500,
                msg: "Native 支付下单失败，失败原因：缺少参数 param，未发送请求"
            })
        }
    })
}

module.exports = native