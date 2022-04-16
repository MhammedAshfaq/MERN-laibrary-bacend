const MongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv').config();

const state = {
    db: null
}

module.exports.connect = (done) => {
    MongoClient.connect(process.env.MONGOGB_CONNECTION_URL, (err, client) => {
        if (err) return done(err);
        state.db = client.db(process.env.DB_NAME);
        done();
    })
}

module.exports.get = () => {
    return state.db
}