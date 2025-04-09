const cloudinary = require("cloudinary").v2;

module.exports.connect = (cloud_name, api_key, api_secret) => {
  cloudinary.config({
    cloud_name: cloud_name,
    api_key: api_key,
    api_secret: api_secret,
  });
}