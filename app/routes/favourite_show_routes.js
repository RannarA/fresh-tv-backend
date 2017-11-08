const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const secret = jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://rannara.eu.auth0.com/.well-known/jwks.json',
});

const jwtCheck = jwt({
    secret: secret,
    audience: '0qe3K92GFPuWTOIztKq30OwXgeif5JlH',
    issuer: 'https://rannara.eu.auth0.com/',
    algorithms: ['RS256'],
});

module.exports = function (app, db) {
    app.use(jwtCheck);

    app.get('/favourites', (req, res) => {
        console.log(req.user.sub)
        db.collection('favourites').find({userId: req.user.sub}).toArray((err, data) => {
            res.send(data);
        });
    });

    app.post('/favourites', (req, res) => {
        const favourite = { showId: req.body.showId, userId: req.user.sub };
        db.collection('favourites').insertOne(favourite, (err, result) => {
            if (err) {
                res.send({ 'error': 'An error has occurred' });
            } else {
                res.send(result.ops[0]);
            }
        });
    });

    app.delete('/favourites/:show_id', (req, res) => {
        const item = db.collection('favourites').findOne({showId: req.params.show_id,
            userId: req.user.sub});
        db.collection('favourites').removeOne({
            '_id': item._id,
        }, (err, result) => {
            if (err)
                result.send(err);

            db.close();
            // result.send({ message: 'Successfully deleted' });
        });
    })
};