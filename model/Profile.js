import mongoose from "mongoose";
const { Schema } = mongoose;
const ProfileSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
		firstName: String,
		lastName: String,
		address: String,
		apartment: String,
		country: String,
		emirate: String,
		phone: String,
		profilePicture: String,
		isGuest: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

const Profile = mongoose.model('profiles', ProfileSchema);
export default  Profile;
