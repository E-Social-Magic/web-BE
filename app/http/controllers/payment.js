import db from '../../models/index.model.js';
const { User } = db;
const { createHmac } = await import('crypto');
import axios from 'axios';

export const depositCoins = async (req, res) => {
    try {
        if (!req.body.amount) {
            return res.json({ message: "Vui Lòng nhập số tiền" })
        }
        const user_id = req.user.user_id;
        const data = req.body;
        data.partnerCode = "MOMOLPT320220316";
        data.accessKey = "RHsdaCHqCmtDQALF";
        data.secretkey = "ULmWaEZ4NuLmxTGnzMRB06nnXIED72e9";
        data.requestId = data.partnerCode + new Date().getTime();
        data.orderId = data.requestId;
        data.orderInfo = "pay with MoMo";
        data.redirectUrl = "http://localhost:3001/api/notify";
        data.ipnUrl = "http://localhost:3001/api/notify";
        data.amount = req.body.amount;
        data.requestType = "captureWallet"
        data.extraData = user_id;
        var rawSignature = "accessKey=" + data.accessKey + "&amount=" + data.amount + "&extraData=" + data.extraData + "&ipnUrl=" + data.ipnUrl + "&orderId=" + data.orderId + "&orderInfo=" + data.orderInfo + "&partnerCode=" + data.partnerCode + "&redirectUrl=" + data.redirectUrl + "&requestId=" + data.requestId + "&requestType=" + data.requestType
        data.signature = createHmac('sha256', data.secretkey)
            .update(rawSignature)
            .digest('hex');
        data.lang = "en";
        await axios.post('https://test-payment.momo.vn/v2/gateway/api/create',
            data,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (response, next) {
                return res.json({ data: response.data });
            }).catch(function (err) {
                console.error(err);
            });
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}

export const processTransaction = async (req, res) => {
    try {
        const data = req.query;
        if (data.resultCode == 0) {
            const user = await User.findByIdAndUpdate({ _id: data.extraData },
                { coins: data.amount },
                { returnOriginal: false }
            )
            if(user)
                return res.json("Thanh toán thành công!");
        }
        else 
            return res.json("Thanh toán không thành công!")
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}
//Nạp coins
export const withdrawCoins = async (req, res) => {

}
//Rút coins