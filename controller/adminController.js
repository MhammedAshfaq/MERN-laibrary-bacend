const db = require('../config/connection');
const collection = require('../config/collection');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { response } = require('express');
const dotenv = require('dotenv').config();

module.exports = {
    doLogin: (userInfo) => {
        return new Promise(async (resolve, reject) => {
            const response = {};
            const userExist = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: userInfo.email });
            if (!userExist) {
                response.admin = false;
                response.error = "Invalid Email address"
                resolve(response)
            } else {
                if (userExist.id !== userInfo.id) {
                    response.admin = false;
                    response.error = "Secret ID do not match"
                    resolve(response)
                } else {
                    bcryptjs.compare(userInfo.password, userExist.password).then((status) => {
                        if (!status) {
                            response.admin = false;
                            response.error = "Pasword do not match"
                            resolve(response)
                        } else {
                            const options = {
                                id: userExist._id,
                                email: userExist.email
                            }
                            const token = jwt.sign({ options }, process.env.JWT_ADMIN_SECRET, { expiresIn: '10d' })

                            response.admin = true;
                            response.message = "Login Successfully";
                            response.data = userExist;
                            response.token = token
                            resolve(response)
                        }
                    })
                }
            }
        })
    },
    getAllUsersList: () => {
        return new Promise(async (resolve, reject) => {
            const users = await db.get().collection(collection.USER_COLLECTION).find().toArray();
            resolve(users)
        })
    },
    createBook: (bookInfo) => {
        return new Promise(async (resolve, reject) => {
            bookInfo.price = await parseInt(bookInfo.price)
            db.get().collection(collection.BOOK_COLLECTION).insertOne(bookInfo).then((response) => {
                resolve(response)
            })
        })
    },
    getAllBooks: () => {
        return new Promise(async (resolve, reject) => {
            const allBooks = await db.get().collection(collection.BOOK_COLLECTION).find().toArray();
            resolve(allBooks)
        })
    },
    getBookDetails: (bookId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BOOK_COLLECTION).findOne({ _id: ObjectId(bookId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getAllOrderLists: () => {
        return new Promise(async (resolve, reject) => {
            const orderList = await db.get().collection(collection.ORDER_COLLECTION).find().toArray();
            resolve(orderList)
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
                $set: {
                    status: 'placed'
                }
            }).then((response) => {
                resolve()
            })
        })
    }

}