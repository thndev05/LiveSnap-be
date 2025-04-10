const userRoute = require('./user.route');
const snapRoute = require('./snap.route');

const authMiddleware = require('../middlewares/auth.middleware');

module.exports = (app) => {
  app.use('/api/users', userRoute);

  app.use('/api/snaps',
    authMiddleware.requireAuth,
    snapRoute
  );
}