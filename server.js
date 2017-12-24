const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const config = require('./config/config');

const User = require('./app/models/user');
const TvShow = require('./app/models/tvshow');

const app = express();

const port = 8000;

const saltRounds = 10;

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

apiRoutes.post('/sign-up', (req, res) => {
    let user = {
        name: req.body.name,
        password: req.body.password,
        admin: false
    };

    User.findOne({
        name: user.name
    }, (err, user) => {
        if (err || user) {
            res.json({success: false, message: 'Sign up failed'})
        } else {
            bcrypt.hash(user.password, saltRounds, function(err, hash) {
                // Store hash in your password DB.
                console.log(hash)
            });
        }
    })
});

/*
    Authentication guard
 */
apiRoutes.use((req, res, next) => {
    const token = req.headers['authorization'];
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

apiRoutes.delete('/watchlist/:id', (req, res) => {
    TvShow.findOneAndRemove({userId: req.decoded.userId, showId: req.params.id}, (err, result) => {
       if (err) {
           res.status(400).send({
               message: 'Deletion failed'
           })
       } else {
           res.status(200).send({
               success: true,
           })
       }
    });
});

app.use('/api', apiRoutes);

app.listen(port);
console.log('It has begun');
