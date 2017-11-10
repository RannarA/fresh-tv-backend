const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');

const jwt = require('jsonwebtoken');
const config = require('./config/config');
const User = require('./app/models/user');

const app = express();

const port = 8000;
mongoose.connect(config.database, {
    useMongoClient: true
});
app.set('jwtSecret', config.sectret);

app.use(bodyParser.json());

app.use(morgan('dev'));

app.get('/', (req, res) => {
   res.send('Api works');
});

app.get('/setup', (req, res) => {
   const nick = new User({
       name: 'Nick Blah',
       password: 'nickspass',
       admin: true
   });

   nick.save(err => {
       if (err) throw err;

       console.log('User saved');
       res.json({success: true});
   })
});

const apiRoutes = express.Router();

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
                   admin: user.admin
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

apiRoutes.use((req, res, next) => {
   const token = req.body.token || req.query.token || req.headers['x-access-token'];

   if (token) {
       jwt.verify(token, app.get('jwtSecret'), (err, decoded) => {
          if (err) {
              return res.json({success: false, message: 'Authentication failed'});
          } else {
              req.decoded = decoded;
              next();
          }
       });
   } else {
       res.status(403).send({
           success: false,
           message: 'Not authenticated'
       });
   }
});

apiRoutes.get('/', (req, res) => {
    res.json({message: 'Api message'})
});

apiRoutes.get('/users', (req, res) => {
    User.find({}, (err, users) => {
        res.json(users);
    });
});

app.use('/api', apiRoutes);

app.listen(port);
console.log('It has begun');

// MongoClient.connect(db.url, (err, database) => {
//     if (err) return console.log(err);
//     require('./app/routes')(app, database);
//     app.listen(port, () => {
//         console.log('We are live on ' + port);
//     });
// });