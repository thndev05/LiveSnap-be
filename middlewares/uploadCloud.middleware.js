const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const cloudinaryConfig = require('../config/cloudinary');

cloudinaryConfig.connect(
  process.env.CLOUD_NAME,
  process.env.API_KEY,
  process.env.API_SECRET,
);

module.exports.upload = async (req, res, next) => {
  if (req.files && req.files.length > 0) {
    let streamUpload = (file) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        streamifier.createReadStream(file.buffer).pipe(stream);
      });
    };

    try {
      const uploadPromises = req.files.map(file => streamUpload(file));

      const results = await Promise.all(uploadPromises);

      req.body.files = results.map((result, index) => ({
        fieldName: req.files[index].fieldname,
        image: result.secure_url
      }));
      
      next();
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).send("Error uploading files");
    }
  } else {
    next();
  }
}