const otpMap = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function setOTP(email) {
  const otp = generateOTP();
  otpMap.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });
  return otp;
}

function verifyOTP(email, inputOtp, deleteOtp = true) {
  const entry = otpMap.get(email);
  if (!entry) return false;

  const { otp, expiresAt } = entry;
  const isExpired = Date.now() > expiresAt;
  const isValid = otp === inputOtp;

  if (isExpired) {
    otpMap.delete(email);
    return false;
  }

  if (!isValid) return false;

  if (deleteOtp) {
    otpMap.delete(email);
  }
  return true;
}

module.exports = {
  generateOTP,
  setOTP,
  verifyOTP
}; 