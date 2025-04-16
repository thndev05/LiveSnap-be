const userRoute = require('./user.route');
const snapRoute = require('./snap.route');
const friendRoute = require('./friend.route');
const authRoute = require('./auth.route');

const authMiddleware = require('../middlewares/auth.middleware');

module.exports = (app) => {
  app.use('/api/auth', authRoute);

  app.use('/api/users', userRoute);

  app.use('/api/snaps',
    authMiddleware.requireAuth,
    snapRoute
  );

  app.use('/api/friends',
    authMiddleware.requireAuth,
    friendRoute
  );
}