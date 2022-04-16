const express = require('express')
const router = express.Router();
const adminController = require('../controller/adminController');
const db = require('../config/connection');
const collection = require('../config/collection');
const { response } = require('express');

//Admin login
router.post('/signin', (req, res) => {
    const { email, id, password } = req.body;
    if (!email || !id || !password) {
        return res.status(401).json({ success: false, error: 'feild required' })
    } else {
        adminController.doLogin(req.body).then((response) => {
            if (response.admin) {
                res.status(200).json({ success: response.admin, token: response.token, message: response.message })
            } else {
                res.status(404).json({ success: response.admin, error: response.error })
            }
        }).catch((err) => {
            res.status(500).json({ success: false, error: 'Internel Server Error' })
        })
    }
})

//Getting all users in admin side
router.get('/getallusers', async (req, res) => {
    const allusers = await adminController.getAllUsersList();
    res.status(200).json({ success: true, users: allusers })
})

//create Boook
router.post('/addBook', async (req, res) => {
    const { name, price, date, url } = req.body;
    if (!name || !url || !price || !date) {
        return res.status(405).json({ success: false, error: 'Feild required' })
    } else {
        //checking book existed
        const existeBook = await db.get().collection(collection.BOOK_COLLECTION).findOne({ name: name });
        if (existeBook) {
            return res.status(409).json({ success: false, error: ' Sorry This book is already added' })
        } else {
            adminController.createBook(req.body).then((response) => {
                res.status(201).json({ success: true, message: 'Book added' })
            }).catch((err) => {
                // res.status(500).json({ success: false, error: 'Internel Server error' })
            })
        }

    }
})

//getting all books in admin side 
router.get('/getallbooks', async (req, res) => {
    const allBooks = await adminController.getAllBooks();
    res.status(200).json({ success: true, books: allBooks })
})

//get on bookdetails
router.get("/getbookdetails/:id", (req, res) => {
    const bookDetails = req.params.id;
    adminController.getBookDetails(bookDetails).then((response) => {
        res.status(200).json({ success: true, book: response })
    }).catch((err) => {
        res.status(500).json({ success: false, error: 'Internel server error' })
    })

})
//get all orderd Lists
router.get('/get-all-order-lists', (req, res) => {
    try {
        adminController.getAllOrderLists().then((response) => {
            res.status(200).json({ success: true, list: response })
        })
    } catch (error) {
        console.log(error.message)
    }
})

//Order Item Status changing
router.get('/confim-order-list/:id', (req, res) => {
    const orderId = req.params.id;
    adminController.changePaymentStatus(orderId).then((response) => {
        res.status(200).json({ success: true, message: 'Item Placed' })
    }).catch((err) => {
        console.log(err)
    })
})

module.exports = router;