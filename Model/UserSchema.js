const mongoose = require('mongoose');

const SignUpSchema = mongoose.Schema({

    username: {
        type: String,
        required: true
    },
    contactnumber: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
    },
    dob: {
        type: String,
    },
    country: {
        type: String,
    },
    city: {
        type: String,
    },
    gender: {
        type: String
    },
    lookingfor: {
        type: String
    },
    refrenceId: {
        type: String
    },
    photo: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['sent', 'Friend', 'pending'],
        default: 'pending',
    },
    isOnline: {
        type: String
    }

},
    { timestamps: true }
)

const userData = mongoose.model('UserSignUp', SignUpSchema);

// <----------------------------------------UserPhoto Schema--------------------------------------->

const photoSchema = mongoose.Schema({
    refrenceId: {
        type: String
    },
    description: {
        type: String
    },
    photo: {
        type: String
    }
})

const userPhoto = mongoose.model('UserPhoto', photoSchema);

// <-----------------------------Friend Request Schema ------------------------------------------------------>

const friendRequestSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSignUp', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSignUp', required: true },
    status: { type: String, enum: ['pending', 'Friend', 'rejected'], default: 'pending' },
    isSeen:{ type: Boolean, default: false },
    timestamp: {
        type: Date,
        default: Date.now
    }
   
});
const FriendRequestData = mongoose.model('FriendRequest', friendRequestSchema);


//   <--------------------------------------Profile Like Schema ----------------------------------------->

const profileLikeSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSignUp', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSignUp', required: true },
    status: { type: String, enum: ['Like', 'Liked', 'rejected'], default: 'Liked' },
    isSeen:{ type: Boolean, default: false },
    timestamp: {
        type: Date,
        default: Date.now
    }
    // other friend request-related fields
});
const ProFileLikeData = mongoose.model('ProfileLike', profileLikeSchema);

// <-------------------------------------------------Message Schema--------------------------------------->
const messageSchema = mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSignUp', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSignUp', required: true },
    message: {
        type: String
    },
    isRead: { type: Boolean, default: false },
    isSeen:{ type: Boolean, default: false },
    timestamp: {
        type: Date,
        default: Date.now
    }
}
)
const userMessage = mongoose.model("UserMessage", messageSchema);



module.exports = { userData, userPhoto, userMessage, FriendRequestData, ProFileLikeData };