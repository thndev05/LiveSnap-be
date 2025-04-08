const userRoute = require('./user.route');

module.exports = (app) => {
  app.use('/api/users', userRoute);
}