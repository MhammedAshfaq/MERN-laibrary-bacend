const db = require('../config/connection');
const collection = require('../config/collection');
const { ObjectId } = require('mongodb');

module.exports = {
    addToCart: (bookId, userId) => {
        return new Promise(async (resolve, reject) => {
            // cart sample
            let bookObj = {
                item: ObjectId(bookId),
                quantity: 1
            }
            //each user existed cart checking
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) });
            if (userCart) {
                //user secound time click add to cart 
                // same book existed checking 
                let productExist = userCart.products.findIndex((product) => product.item == bookId)
                if (productExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId), "products.item": ObjectId(bookId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve({ message: 'Item Added Successfully', success: true })
                        })
                } else {
                    //not same product choose another product
                    db.get().collection(collection.CART_COLLECTION).update({ user: ObjectId(userId) },
                        {
                            $push: { products: bookObj }
                        }).then(() => {
                            resolve({ message: 'Item Added Successfully', success: true })
                        })
                }
            } else {
                //fist time cart create
                let cartObj = {
                    user: ObjectId(userId),
                    products: [bookObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((responce) => {
                    resolve({ message: 'Item Added Successfully', success: true })
                })
            }

        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                { $match: { user: ObjectId(userId) } },
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: "$products.quantity"
                    }
                },
                {
                    $lookup: {
                        from: collection.BOOK_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }

                    }
                }
            ]).toArray();
            resolve(cartItems)
        })
    },
    getTotalAmound: (userId) => {
        return new Promise(async (resolve, reject) => {
            const totalAmout = await db.get().collection(collection.CART_COLLECTION).aggregate([
                { $match: { user: ObjectId(userId) } },
                {
                    $unwind: "$products"
                }, {
                    $project: {
                        item: "$products.item",
                        quantity: "$products.quantity"
                    }
                },
                {
                    $lookup: {
                        from: collection.BOOK_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }
            ]).toArray()
            //total Amout
            resolve(totalAmout[0].total)
        })
    },
    getConfirmedProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            const cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) });
            resolve(cart)
        })
    },
    orderPlacing: (userId, order, products, total) => {
        return new Promise((resolve, reject) => {
            let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            let date = new Date()
            let currendDate = date.toLocaleDateString(undefined, options);

            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode,
                    emailId: order.email
                },
                date: currendDate,
                userId: ObjectId(userId),
                paymentMethod: order.method,
                products: products,
                totalAmount: total,
                status: 'pending'
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(userId) }).then((responce) => {
                    resolve();
                })
            })
        })
    },
    getOrderDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            const orderDetails = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).toArray();
            resolve(orderDetails)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                { $match: { _id: ObjectId(orderId) } },
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: "$products.quantity"
                    }
                },
                {
                    $lookup: {
                        from: collection.BOOK_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        quantity: 1,
                        item: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
            ]).toArray();
            resolve(orderProducts)
        })
    },
    removeCartItem: (cartId, itemId) => {
        return new Promise((resolve, reject) => {
            console.log(cartId)
            console.log(itemId)
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(cartId) },
                {
                    $pull: { products: { item: ObjectId(itemId) } }
                }
            ).then((response) => {
                resolve(response);
                console.log(response)
            })
        })
    },
    removoOrderList: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).deleteOne({ _id: ObjectId(orderId) }).then((responce) => {
                resolve();
            })
        })

    }


}