
const apiResponse = (res, statusCode, message, data = null) => {
  res.json({
    code: statusCode,
    message,
    data
  });
};

module.exports = apiResponse;