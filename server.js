const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');

const jwt = require('jsonwebtoken');
const config = require('./config/config');

const User = require('./app/models/user');
const TvShow = require('./app/models/tvshow');

const app = express();

const port = 8000;
mongoose.connect(config.database, {
    useMongoClient: true
});
app.set('jwtSecret', config.sectret);

app.use(bodyParser.json());

app.use(morgan('dev'));

app.get('/', (req, res) => {
   res.send('Welcome to fresh-tv-backend');
});

const apiRoutes = express.Router();

/*
    AUTHENTICATION
 */
apiRoutes.post('/authenticate', (req, res) => {
    User.findOne({
        name: req.body.name
    }, (err, user) => {
        if (err) throw err;

        if (!user) {
            console.log('user not found');
            res.json({success: false, message: 'Authentication failed'});
        } else if (user) {
            if (user.password !== req.body.password) {
                console.log('Wrong password');
                res.json({success: false, message: 'Authentication failed'});
            } else {
                const payload = {
                    userId: user._id
                };

                const token = jwt.sign(payload, app.get('jwtSecret'), {
                    expiresIn: 1440
                });

                res.json({
                    success: true,
                    token: token
                });
            }
        }
    })
});

/*
    Authentication guard
 */
apiRoutes.use((req, res, next) => {
    const token = req.headers['Authorization'];

    if (token) {
        jwt.verify(token, app.get('jwtSecret'), (err, decoded) => {
            if (err) {
                console.log(err);
                return res.status(403).send({
                    message: 'Invalid token'
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        res.status(403).send({
            message: 'Not authenticated'
        });
    }
});

/*
    Guarded endpoints
 */
apiRoutes.get('/watchlist', (req, res) => {
    TvShow.find({userId: req.decoded.userId}, (err, tvShows) => {
        res.json(tvShows);
    });
});

apiRoutes.post('/watchlist', (req, res) => {
    const tvShow = new TvShow({
        userId: req.decoded.userId,
        showId: req.body.showId
    });

    tvShow.save(err => {
        if (err) throw err;

        res.status(200).send({
            success: true
        });
    })
});

app.use('/api', apiRoutes);

app.listen(port);
console.log('It has begun');
