import mongoose from "mongoose";
const { Schema } = mongoose;
const OtpSchema = new Schema({
	email: { type: String, required: true },
	code: { type: String, required: true },
	expiresAt: { type: Date, required: true },
});

const OTP = mongoose.model('otps', OtpSchema);

export default OTP;
