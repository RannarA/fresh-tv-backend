var ObjectID = require('mongodb').ObjectID;

module.exports = function (app, db) {
    app.get('/favourites', (req, res) => {
        db.collection('favourites').find().toArray((err, data) => {
            res.send(data);
        });
    });

    app.post('/favourites', (req, res) => {
        const favourite = { text: req.body.showId, title: req.body.userId };
        db.collection('favourites').insertOne(favourite, (err, result) => {
            if (err) {
                res.send({ 'error': 'An error has occurred' });
            } else {
                res.send(result.ops[0]);
            }
        });
    });
};