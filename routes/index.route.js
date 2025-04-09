const userRoute = require('./user.route');
const snapRoute = require('./snap.route');

module.exports = (app) => {
  app.use('/api/users', userRoute);

  app.use('/api/snaps', snapRoute);
}