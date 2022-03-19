import db from '../../models/index.model.js';
const { User, Payment, Payment_out } = db;
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
        data.requestType = "captureWallet";
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
    try {
        const user = await User.findById(req.user.user_id);
        if (!req.body.phone) {
            return res.json({ message: "Vui lòng nhập số điện thoại" })
        }
        if (!req.body.displayName) {
            return res.json({ message: "Vui lòng nhập tên hiển thị trên MOMO" })
        }
        if (!req.body.amount || req.body.amount < 10000 || req.body.amount > user.coins ) {
            return res.json({ message: "Số tiền bạn nhập phải lớn hơn 10.000 VNĐ và nhỏ hơn số tiền bạn đang có!" });
        }
        const data = new Payment_out(req.body);
        data.requestId = PARTNER_CODE + new Date().getTime();
        data.orderId = data.requestId;
        data.amount = req.body.amount;
        data.user_id = req.user.user_id;
        data.username = req.user.username;
        data.phone = req.body.phone;
        data.resultCode = "7000";
        data.message = "Giao dịch đang được xử lý.";
        data.displayName = req.body.displayName;
        data.save(function (err) {
            if (err) { return next(err); }
            return res.json({ data, message: "Vui lòng đợi phản hồi từ Admin" })
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}

export const confirmReq = async (req, res) => {
    try {
        if (req.user.role === "admin") {
            const success = req.query.success;
            const fail = req.query.fail;
            const payment = await Payment_out.findById({ _id: req.params.id });
            const admin = await User.findById({ _id: req.user.user_id });
            const user = await User.findById({ _id: payment.user_id })
            if (!success && !fail) {
                return res.json("Nothing to do")
            }
            if (success == "true") {
                const coinsOfAdmin = admin.coins + payment.amount;
                const coinsOfUser = user.coins - payment.amount;
                await User.findByIdAndUpdate(
                    { _id: req.user.user_id },
                    { coins: coinsOfAdmin }
                );
                await User.findByIdAndUpdate(
                    { _id: payment.user_id },
                    { coins: coinsOfUser }
                );
                const reqSuccess = await Payment_out.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        resultCode: "0",
                        message: "Giao dịch thành công."
                    },
                    { returnOriginal: false }
                );
                return res.json({ reqSuccess, message: "Thanh toán thành công!" });
            }
            if (fail == "true") {
                const reqFail = await Payment_out.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        resultCode: "1003",
                        message: "Giao dịch bị đã bị hủy."
                    },
                    { returnOriginal: false }
                );
                return res.json({ reqFail, message: "Thanh toán thất bại!" });
            }
        }
        return res.json({ message: "Bạn không có quyền truy cập!" })
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}

/* 
Tạo yêu cầu rút tiền 
Ad đọc và xác nhận yêu cầu rút tiền 
Ad chuyển tiền bằng tay  

*/
