
const apiResponse = (res, statusCode, message, data = {}) => {
  res.json({
    code: statusCode,
    message,
    data
  });
};

module.exports = apiResponse;