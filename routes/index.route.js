const userRoute = require('./user.route');
const snapRoute = require('./snap.route');
const friendRoute = require('./friend.route');
const authRoute = require('./auth.route');

const authMiddleware = require('../middlewares/auth.middleware');

module.exports = (app) => {
  const version = '/v1';

  app.use(version + '/auth', authRoute);

  app.use(version+ '/users', userRoute);

  app.use(version+ '/snaps',
    authMiddleware.requireAuth,
    snapRoute
  );

  app.use(version+ '/friends',
    authMiddleware.requireAuth,
    friendRoute
  );
}