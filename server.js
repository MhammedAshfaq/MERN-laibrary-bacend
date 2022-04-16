//Importing libraries
const express = require('express');
const dotenv = require('dotenv').config();
const colors = require('colors');
const cors = require('cors')
const bodyparser = require('body-parser')
const passport = require('passport');

//helping laibrareis
const app = express();
const { connect } = require('./config/connection');

// //Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ urlencoded: false }));
app.use(bodyparser());
app.use(passport.initialize());

// //Database Connection
connect((err) => {
    if (err) {
        console.log(`MongoDB Error ${err}`.bgRed.white);
    } else {
        console.log('Database Connected'.bgCyan.black.bold);
    };
});

// //Routers
app.use('/api/auth', require('./routers/authRouter'));
app.use('/api/admin',require('./routers/adminRouter'));

//Application PORT
app.listen(process.env.PORT, () => console.log(`Server running at PORT ${process.env.PORT}`.bgYellow.black.bold));