const favouriteShowRoutes = require('./favourite_show_routes');
const userRoutes = require('./user_routes');

module.exports = function(app, db) {
    favouriteShowRoutes(app, db);
    // userRoutes(app, db);
    // Other route groups could go here, in the future
};