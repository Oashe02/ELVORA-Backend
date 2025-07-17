import mongoose from "mongoose";
const { Schema } = mongoose;
const UserSchema = new Schema({
	email: { type: String, required: true, unique: true },
	role: { type: String, enum: ['user', 'admin'], default: 'user' },
	googleId: { type: String },
	createdAt: { type: Date, default: () => new Date() },
	isVerified: { type: Boolean, default: false },
	isBlocked: { type: Boolean, default: false },
	isDeleted: { type: Boolean, default: false },
	// lastOrderDate: { type: Date, default: () => new Date() },
	// lastLoginDate: { type: Date, default: () => new Date() },
	// lastLoginIp: { type: String },
	// lastLoginLocation: { type: String },
	// lastLoginDevice: { type: String },
	// lastLoginBrowser: { type: String },
	// lastLoginOs: { type: String },
	// lastLoginUserAgent: { type: String },
	// lastLoginReferrer: { type: String },
	// lastLoginReferrerType: { type: String },
	// lastLoginReferrerUrl: { type: String },
	// lastLoginReferrerTitle: { type: String },
});

const User = mongoose.model('users', UserSchema);

export default User;
