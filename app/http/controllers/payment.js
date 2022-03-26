import db from '../../models/index.model.js';
const { User, Payment } = db;
import { createHmac } from 'crypto';
import axios from 'axios';
import env from '../../../config/config.js';
const { PARTNER_CODE, ACCESS_KEY, SECRET_KEY, API_MOMO } = env;
var success = "Hoàn thành";
var noPermission = "Không có quyền truy cập!";
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
        // data.redirectUrl = "http://localhost:3001/api/return";
        // data.ipnUrl = "http://localhost:3001/api/notify";
        data.redirectUrl = "https://web-be-2-idkrb.ondigitalocean.app/api/return";
        data.ipnUrl = "https://web-be-2-idkrb.ondigitalocean.app/api/notify";
        data.amount = req.body.amount;
        data.requestType = "captureWallet";
        data.extraData = user_id;
        var rawSignature = "accessKey=" + data.accessKey + "&amount=" + data.amount + "&extraData=" + data.extraData + "&ipnUrl=" + data.ipnUrl + "&orderId=" + data.orderId + "&orderInfo=" + data.orderInfo + "&partnerCode=" + data.partnerCode + "&redirectUrl=" + data.redirectUrl + "&requestId=" + data.requestId + "&requestType=" + data.requestType
        data.signature = createHmac('sha256', data.secretkey)
            .update(rawSignature)
            .digest('hex');
        data.lang = "vi";
        await axios.post(API_MOMO + '/create',
            data,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (response, next) {
                return res.json({ data: response.data, message: success });
            }).catch(function (err) {
                console.error(err);
            });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const processTransaction = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findById({ _id: data.extraData });
        const payment = new Payment();
        payment.requestId = data.requestId;
        payment.orderId = data.orderId;
        payment.amount = data.amount;
        payment.message = data.message;
        payment.resultCode = data.resultCode;
        payment.user_id = data.extraData;
        payment.username = user.username;
        payment.type = "in";
        payment.accountBalance = user.coins;
        if (data.resultCode == 0) {
            let paymentAfter = await payment.save();
            const user = await User.findById(data.extraData);
            let coinsUser = user.coins + Number(data.amount)
            await User.findByIdAndUpdate({ _id: data.extraData },
                { coins: coinsUser },
                { returnOriginal: false }
            )
            await Payment.findByIdAndUpdate({_id: paymentAfter.id}, {accountBalance: coinsUser})
            return res.json({message: "Thanh toán thành công!"});
        }
        else {
            payment.save();
            return res.json({message: "Thanh toán không thành công!"});
        }
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const listPayment = async (req, res) => {
    const { offset = 1, limit = 10 } = req.query;
    try {
        const payments = await Payment.find({
            type: "in"
        })
            .limit(limit * 1)
            .skip((offset - 1) * limit)
            .exec();
        const count = await Payment.countDocuments();
        payments.sort((a, b) => b.createdAt - a.createdAt)
        res.json({
            payments,
            totalPages: Math.ceil(count / limit),
            currentPage: offset,
            message: success
        });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const detailPayment = async (req, res) => {
    try {
        if (req.user.role == "admin") {
            const payment = await Payment.findById(req.params.id);
            const data = {};
            data.partnerCode = PARTNER_CODE;
            data.accessKey = ACCESS_KEY;
            data.requestId = payment.requestId;
            data.orderId = payment.orderId;
            data.lang = "vi";
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
                    return res.json({ data: response.data, message: success });
                }).catch(function (err) {
                    console.error(err);
                });
        }
        else {
            return res.status(403).json({ message: noPermission });
        }
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const listPaymentOut = async (req, res) => {
    const { offset = 1, limit = 10 } = req.query;
    try {
        const payments = await Payment.find({
            type: "out"
        })
            .limit(limit * 1)
            .skip((offset - 1) * limit)
            .exec();
        const count = await Payment.countDocuments();
        payments.sort((a, b) => b.createdAt - a.createdAt)
        res.json({
            payments,
            totalPages: Math.ceil(count / limit),
            currentPage: offset,
            message: success
        });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
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
        const data = new Payment(req.body);
        data.requestId = PARTNER_CODE + new Date().getTime();
        data.orderId = data.requestId;
        data.amount = req.body.amount;
        data.user_id = req.user.user_id;
        data.username = req.user.username;
        data.phone = req.body.phone;
        data.resultCode = "7000";
        data.message = "Giao dịch đang được xử lý.";
        data.type = "out";
        data.displayName = req.body.displayName;
        const coinsOfUser = user.coins - data.amount;
        data.accountBalance = coinsOfUser;
        await User.findByIdAndUpdate(
            { _id: req.user.user_id },
            { coins: coinsOfUser }
        );
        data.save(function (err) {
            if (err) { return next(err); }
            return res.json({ data, message: "Vui lòng đợi phản hồi từ Admin" })
        });
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

export const confirmReq = async (req, res) => {
    try {
        if (req.user.role === "admin") {
            const success = req.query.success;
            const payment = await Payment.findById({ _id: req.params.id });
            const admin = await User.findById({ _id: req.user.user_id });
            const user = await User.findById({ _id: payment.user_id })
            if (!success) {
                return res.json({payment, message: "Hoàn thành"})
            }
            if (success == "true") {
                const coinsOfAdmin = admin.coins + payment.amount;
                await User.findByIdAndUpdate(
                    { _id: req.user.user_id },
                    { coins: coinsOfAdmin }
                );
                const reqSuccess = await Payment.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        resultCode: "0",
                        message: "Thành công."
                    },
                    { returnOriginal: false }
                );
                return res.json({ reqSuccess, message: "Thanh toán thành công!" });
            }
            if (success == "false") {
                const coinsOfUser = user.coins + payment.amount;
                await User.findByIdAndUpdate(
                    { _id: payment.user_id },
                    { coins: coinsOfUser }
                );
                const reqFail = await Payment.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        resultCode: "1003",
                        message: "Giao dịch bị đã bị hủy.",
                        accountBalance: coinsOfUser
                    },
                    { returnOriginal: false }
                );
                return res.json({ reqFail, message: "Thanh toán thất bại!" });
            }
        }
        return res.json({ message: "Bạn không có quyền truy cập!" })
    } catch (error) {
        return res.status(500).json({
            message: `Lỗi: ${error}`,
        });
    }
}

/* 
Tạo yêu cầu rút tiền 
Ad đọc và xác nhận yêu cầu rút tiền 
Ad chuyển tiền bằng tay  

*/
