const db = require('../config/connection');
const collection = require('../config/collection');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { response } = require('express');

module.exports = {
    doLogin: (userInfo) => {
        return new Promise(async (resolve, reject) => {
            let response = {};
            const user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userInfo.email });
            if (user) {
                bcryptjs.compare(userInfo.password, user.password).then((Pass) => {
                    if (Pass) {
                        const token =  jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '10d' })

                        response.success = true;
                        response.message = "Login Successfully";
                        response.user = user;
                        response.token = token;
                        resolve(response)
                    } else {
                        response.success = false;
                        response.error = "Password not match"
                        resolve(response)
                    }
                })
            } else {
                response.success = false;
                response.error = "User not existed here"
                resolve(response)
            }
        })

    },
    doSignup: (userInfo) => {
        return new Promise(async (resolve, reject) => {
            userInfo.password = await bcryptjs.hash(userInfo.password, 10);
            db.get().collection(collection.USER_COLLECTION).insertOne(userInfo).then((response) => {
                const id = response.insertedId.toString();
                const token = jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: '10d' });
                resolve({ token, statusText: true })
            })
        })
    }
}
