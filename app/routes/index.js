const favouriteShowRoutes = require('./favourite_show_routes');

module.exports = function(app, db) {
    favouriteShowRoutes(app, db);
};