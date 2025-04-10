const Snap = require('../models/snap.model');
const apiResponse = require('../helpers/response');

// [GET]: BASE_URL/api/snaps/test
module.exports.test = async (req, res) => {
  try {
    const snaps = await Snap.find({
      deleted: false
    });

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

// [POST]: BASE_URL/api/snaps/upload
module.exports.upload = async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user._id;
    const image = req.body.files[0].image;

    if (!image) {
      return apiResponse(res, 400, 'File is required');
    }

    const data = {
      userId: userId,
      caption: caption,
      image: image
    }
    const newSnap = new Snap(data);
    await newSnap.save();

    return apiResponse(res, 200, 'Upload snap successfully.', newSnap);

  } catch (error) {
    console.error('Upload Snap Error:', error);
    return apiResponse(res, 200, 'Server error.');
  }
}

// [DELETE]: BASE_URL/api/snaps/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const snapId = req.params.id;
    const snap = await Snap.findById(snapId);

    if (!snap) {
      return apiResponse(res, 400, 'SnapID is invalid.');
    } else {
      await snap.updateOne({
        deleted: true
      });

      return apiResponse(res, 200, 'Delete snap successfully.');
    }

  } catch (error) {
    console.error('Upload Snap Error:', error);
    return apiResponse(res, 400, 'Server error.');
  }
}