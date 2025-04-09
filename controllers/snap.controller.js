const Snap = require('../models/snap.model');
const apiResponse = require('../helpers/response');

module.exports.test = async (req, res) => {
  try {
    const snaps = await Snap.find({});

    return apiResponse(
      res,
      200,
      'Get snaps successfully',
      {
        snaps: snaps
      })
  } catch (e) {
    return apiResponse(res, 400, 'Get snaps failed');
  }
}