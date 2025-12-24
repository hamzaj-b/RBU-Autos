const CryptoJS = require("crypto-js");

const ENC_KEY = process.env.PASSWORD_ENC_KEY || "supersecret"; // must be strong, in .env

// Encrypt password before saving
function encryptPassword(password) {
  return CryptoJS.AES.encrypt(password, ENC_KEY).toString();
}

// Decrypt password when revealing
function decryptPassword(ciphertext) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENC_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error("Password decrypt failed", err);
    return null;
  }
}

module.exports = { encryptPassword, decryptPassword };
