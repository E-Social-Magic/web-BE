import db from '../../models/index.model.js';
const { User, Payment } = db;
const { createHmac } = await import('crypto');
import axios from 'axios';
import env from '../../../config/config.js';
const { PARTNER_CODE, ACCESS_KEY, SECRET_KEY, API_MOMO } = env;
//Nạp coins
export const depositCoins = async (req, res) => {
    try {
        if (!req.body.amount) {
            return res.json({ message: "Vui Lòng nhập số tiền" })
        }
        const user_id = req.user.user_id;
        const data = req.body;
        data.partnerCode = PARTNER_CODE;
        data.accessKey = ACCESS_KEY;
        data.secretkey = SECRET_KEY;
        data.requestId = data.partnerCode + new Date().getTime();
        data.orderId = data.requestId;
        data.orderInfo = "Pay with MoMo";
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
        await axios.post(API_MOMO + '/create',
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
        const user = await User.findById({ _id: data.extraData });
        const payment = new Payment();
        payment.requestId = data.requestId;
        payment.orderId = data.orderId;
        payment.amount = data.amount;
        payment.responseTime = data.responseTime;
        payment.message = data.message;
        payment.resultCode = data.resultCode;
        payment.user_id = data.extraData;
        payment.username = user.username;
        payment.save(function (err) {
            if (err) { return next(err); }
        });
        if (data.resultCode == 0) {
            await User.findByIdAndUpdate({ _id: data.extraData },
                { coins: data.amount },
                { returnOriginal: false }
            )
            return res.json("Thanh toán thành công!");
        }
        else {
            return res.json("Thanh toán không thành công!")
        }
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}

export const listPayment = [async (req, res) => {
    const { offset = 1, limit = 10 } = req.query;
    try {
        const payments = await Payment.find()
            .limit(limit * 1)
            .skip((offset - 1) * limit)
            .exec();
        const count = await Payment.countDocuments();
        res.json({
            payments,
            totalPages: Math.ceil(count / limit),
            currentPage: offset
        });
    } catch (err) {
        console.error(err.message);
    }
}]

export const detailPayment = async (req, res) => {
    try {
        if (req.user.role == "admin") {
            const payment = await Payment.findById(req.params.id);
            const data = {};
            data.partnerCode = PARTNER_CODE;
            data.accessKey = ACCESS_KEY;
            data.requestId = payment.requestId;
            data.orderId = payment.orderId;
            data.lang = "en";
            var rawSignature = "accessKey=" + data.accessKey + "&orderId=" + data.orderId + "&partnerCode=" + data.partnerCode + "&requestId=" + data.requestId;
            data.signature = createHmac('sha256', SECRET_KEY)
                .update(rawSignature)
                .digest('hex');
            await axios.post(API_MOMO + '/query',
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
        }
        else {
            return res.json({ message: "Bạn không có quyền truy cập!" });
        }
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}
//Rút coins
export const withdrawCoins = async (req, res) => {

}


/* 
Tạo yêu cầu rút tiền 
Ad đọc và xác nhận yêu cầu rút tiền 
Ad chuyển tiền bằng tay  

*/
