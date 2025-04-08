const mongoose = require('mongoose');

module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected Database successfully!');
  } catch (error) {
    console.error('Connected failed! Error: ', error);
  }
}