const express = require('express');
const authHelpers = require('../controller/authController');
const bookHelpers = require('../controller/bookController');
const db = require('../config/connection');
const collection = require('../config/collection');
const { response } = require('express');
const passport = require('passport');
const dotenv = require('dotenv').config();
const router = express.Router();
require('../middleware/passport')(passport);
const nodemailer = require('nodemailer');
const bcryptjs = require('bcryptjs')


//Home
router.get('/list', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({ message: 'ok' })
})

// //Login Router
router.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(401).json({ success: false, error: 'feilds required' })
    } else {
        authHelpers.doLogin(req.body).then((response) => {
            if (response.success) {
                res.status(200).json({ success: response.success, token: response.token, user: response.user, message: response.message })
            } else {
                res.status(401).json({ success: response.success, error: response.error })
            }
        })
    }
})

// //Register Router
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(401).json({ success: false, error: 'feilds required' })
    } else {
        const userExiste = await db.get().collection(collection.USER_COLLECTION).findOne({ email: email });
        if (userExiste) {
            res.status(404).json({ success: false, error: 'This Email already existed' })
        } else {
            authHelpers.doSignup(req.body).then((response) => {
                if (response.statusText) {
                    res.status(201).json({ success: response.statusText, token: response.token })
                }
            }).catch((err) => {
                console.log(err)
            })
        }
    }
})

//forgptpasword otp send to mail
router.post('/email-send', async (req, res) => {
    const sendingEmail = req.body.email;
    const data = await db.get().collection(collection.USER_COLLECTION).findOne({ email: sendingEmail })
    if (data) {
        let otpCode = Math.floor((Math.random() * 10000) + 1);

        otpObj = {
            email: sendingEmail,
            code: otpCode,
            expireIn: new Date().getTime() + 300 * 1000
        }

        const otpSaver = await db.get().collection(collection.OTP_COLLECTION).insertOne(otpObj);

        var transpoter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "ashfaqmohammedcv@gmail.com",
                pass: "Email Password"
            }
        });

        var mailOptions = {
            from: "ashfaqmohammedcv@gmail.com",
            to: sendingEmail,
            subject: 'Forgot Password OTP message',
            html: `<p>Your forgot password otp is :<span style="margin-left:5px; color:blue; fontSize:19px; font-weight:bold ;" >${otpObj.code}</span> </p>`,

        };

        transpoter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log("nodemailler error is :-", err)
            } else {
                res.status(200).json({ success: true, message: "Please check your email ID" })
            }
        })
    } else {
        res.status(404).json({ success: false, message: "Email ID not existed" })
    }
})

//Change Passord
router.post('/change-passowed', async (req, res) => {
    //otpChecking   
    const data = await db.get().collection(collection.OTP_COLLECTION).findOne({ email: req.body.email })
    if (data) {
        let currentTime = new Date().getTime();
        let diff = data.expireIn - currentTime;
        if (diff < 0) {
            res.status(401).json({ success: false, message: "Token Expire" })
        } else {
            const newPassword = await bcryptjs.hash(req.body.password, 10)

            const passwordChange = await db.get().collection(collection.USER_COLLECTION).updateOne({ email: req.body.email },
                {
                    $set: {
                        password: newPassword
                    }
                });
            if (passwordChange.modifiedCount) {
                res.status(200).json({ success: true, message: "Password cheanged successfully" })
            } else {
                res.status(500).json({ success: false, error: "Internel server error" })
            }
        }
    } else {
        res.status(400).json({ success: false, message: "Invalid  otp" })
    }
})

//Add to cart
router.post('/add-to-cart/:id', (req, res) => {
    const bookId = req.params.id;
    const userId = req.body.user;
    try {
        bookHelpers.addToCart(bookId, userId).then((response) => {
            if (response.success) {
                res.status(201).json({ message: response.message, success: response.success })
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internel server Error' })
    }
})


//get allcartproducts
router.get('/get-cart-products/:id', async (req, res) => {
    const userId = req.params.id;
    const products = await bookHelpers.getCartProducts(userId);
    res.status(200).json(products);
})

//getcatrProductsToalAmout
router.get('/cart-total-amound/:id', async (req, res) => {
    const userId = req.params.id;
    const totalAmoud = await bookHelpers.getTotalAmound(userId);
    res.status(200).json({ success: true, total: totalAmoud })

})

//place order
router.post('/place-order/:id', async (req, res) => {
    const userId = req.params.id;
    const userInfo = req.body;

    const totalAmoud = await bookHelpers.getTotalAmound(userId);
    const products = await bookHelpers.getConfirmedProductList(userId);

    bookHelpers.orderPlacing(userId, userInfo, products.products, totalAmoud).then((response) => {
        res.status(200).json({ success: true, message: 'Order Placed' })
    }).catch((err) => {
        console.log(err)
    })
})

//get order details
router.get('/order-details/:id', async (req, res) => {
    const userId = req.params.id;
    const orderDetails = await bookHelpers.getOrderDetails(userId);
    res.status(200).json({ success: true, details: orderDetails })
})

router.get('/order-products/:id', async (req, res) => {
    const id = req.params.id;
    const orderProducts = await bookHelpers.getOrderProducts(id);
    res.status(200).json({ success: true, products: orderProducts })

})

//deleteCart Product
router.post('/remove-cart-product', (req, res) => {
    const cartId = req.body.cartId;
    const itemId = req.body.productId
    bookHelpers.removeCartItem(cartId, itemId).then((response) => {
        res.status(200).json({ success: true, message: 'Item Removed' })
    })
})

//remove Order
router.post('/cancel-order/:id', (req, res) => {
    const orderId = req.params.id;
    bookHelpers.removoOrderList(orderId).then((response) => {
        res.status(200).json({ success: true, message: 'Order deleted' })
    }).catch((err) => {
        res.status(404).json({ success: false, message: 'Somthing Eroor' })
    })
})



module.exports = router;