import mongoose from "mongoose";
const Schema = mongoose.Schema;

const GroupSchema = new Schema(
	{
		name: String,
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'users',
		},
		members: [
			{
				type: Schema.Types.ObjectId,
				ref: 'users',
			},
		],
		chats: [
			{
				message: String,
				sender: {
					type: Schema.Types.ObjectId,
					ref: 'users',
				},
				userName: String,
				avatar: String,
				date: {
					type: Date,
					default: Date.now(),
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

export default Group = mongoose.model('groups', GroupSchema);
