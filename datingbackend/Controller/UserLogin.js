const { userData, userPhoto, userMessage, FriendRequestData, ProFileLikeData } = require('../Model/UserSchema')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "Api";
const generateUniqueId = require('generate-unique-id');
const axios = require('axios');
var generator = require('generate-password');

const getData =(req,res)=>{
    res.send("I am node js")
}

const getAllUserRequest = async (req, res) => {
    await userData.find({}, { password: 0 }).then((err, data) => {
        if (err) {
            res.json(err)
        } else {
            res.json(data)
        }
    })
}
const SignUpRequest = async (req, res) => {
    try {
        const { username, contactnumber, email, password, dob, country, city, gender, lookingfor } = req.body;

        const refrenceId = generateUniqueId({
            length: 10,
            useLetters: false,
            includeSymbols: [''],
        });

        const existingUser = await userData.findOne({ email: email });
        if (existingUser) {
            return res.json({ message: "user already exist", success: false });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);

            const Signupuser = await userData.create({
                username: username,
                contactnumber: contactnumber,
                email: email,
                password: hashedPassword,
                dob: dob,
                country: country,
                city: city,
                gender: gender,
                lookingfor: lookingfor,
                refrenceId: refrenceId,
                isOnline: "Offline"
            });
            const token = jwt.sign({ email: Signupuser.email }, SECRET_KEY);
            res.status(201).json({ message: "Register successfully", success: true, token: token });
        }
    } catch {
        res.json({ message: "something went wrong", success: false });
    }
}

const LoginRequest = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await userData.findOne({ email: email })
        if (!existingUser) {
            return res.json({ message: "user not found", success: false });
        }
        const matchPassword = await bcrypt.compare(password, existingUser.password);
        if (!matchPassword) {
            return res.json({ message: "Invalid Credential", success: false })
        };
        const token = jwt.sign({ email: existingUser }, SECRET_KEY);
        // io.emit('login', existingUser.email);
        res.json({ message: "Login successfully", success: true, token: token });

    } catch {
        res.json({ message: "something went wrong" });
    }
}

const loginWithGoogleRequest = async (req, res) => {
    const { token } = req.body; // Assuming the token is sent in the request body

    try {
        const refrenceId = generateUniqueId({
            length: 10,
            useLetters: false,
            includeSymbols: [''],
        });

        // Verify the Google token with Google's servers
        const response = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
        const loginCredential = response.data;
        const username = loginCredential.name;
        const email = loginCredential.email;

        const jwtPayload = { userId: loginCredential.sub, email: loginCredential.email };
        const authToken = jwt.sign(jwtPayload, SECRET_KEY);

        const existingUser = await userData.findOne({ email: email });
        if (!existingUser) {
            const data = new userData({
                username: username,
                email: email,
                refrenceId: refrenceId
            })
            await data.save()
        }
        const useremail = await userData.findOne({ email: email })

        // Send the JWT as part of the response
        res.status(200).json({ token: authToken, email: useremail.email, message: 'Authentication successful', success: true });

        //   res.status(200).json({ message: 'Authentication successful' });
    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(400).json({ message: 'Authentication failed', success: false });
    }

}

const SearchUserRequest = async (req, res) => {
    try {
        const username = req.params.searchData.toLowerCase();
        const searchResults = await userData.find({
            $or: [
                { username: { $regex: username, $options: 'i' } }, // Case-insensitive search for username
                { email: { $regex: username, $options: 'i' } },    // Case-insensitive search for email
            ]
        });

        res.json({ success: true, message: searchResults });
        console.log(username);
    } catch (error) {
        console.error("Error searching for users:", error);
        res.status(500).json({ success: false, message: "An error occurred" });
    }
}

const LogOutRequest = (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Extract the token from the Authorization header

    try {
        jwt.verify(token, SECRET_KEY);

        // Implement any other logout logic you need (such as updating user status)
        res.clearCookie('token');
        // Respond with success and message
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        // Respond with failure and message
        res.json({ success: false, message: 'Logout failed' });
    }

}

const getUserProfileRequest = async (req, res) => {
    try {
        let useremail = req.params.useremail;
        await userData.find({
            "$or": [
                { "email": { $regex: useremail } }],
        },
            { password: 0, contactnumber: 0 }
        ).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json({ data: data, success: true })
            }
        })
    }
    catch {
        res.json("Something went wrong");
    }
}
const getUserProfileByEmailRequest = async (req, res) => {
    try {
        let email = req.params.email;
        await userData.find({
            "$or": [
                { "email": { $regex: email } }],
        },
            { password: 0, contactnumber: 0, email: 0, }
        ).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json({ data: data, success: true })
            }
        })
    }
    catch {
        res.json("Something went wrong");
    }
}
const UpdateProfileRequest = async (req, res) => {
    console.log(req.body.id)
    try {
        const id = req.body.id;
        if (req.files && req.files.photo) {
            const photo = req.files.photo[0].filename;
            await userData.findByIdAndUpdate(id, {
                "photo": photo,
            }).then((data) => {
                res.json({ message: "Profile photo Updated successfully", success: true, data: data });
            })
        } else {
            const id = req.body;
            const { username, contactnumber, dob, country, city, gender, lookingfor } = req.body;
            await userData.findByIdAndUpdate(id, {
                "username": username, "contactnumber": contactnumber, "dob": dob, "country": country, "city": city, "gender": gender,
                "lookingfor": lookingfor
            }).then((data) => {
                res.json({ message: "Updated successfully", success: true, data: data });
            })
        }
    } catch (error) {
        res.status(500).json({ message: "An error occurred", success: false });
    }
}
const getProfileById = async (req, res) => {
    try {
        let id = req.params.id;
        userData.findById(id, { password: 0 }).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json(data)
            }
        })
    }
    catch {
        res.json("Something went wrong");
    }
}
const ResetPasswordRequest = async (req, res) => {
    const { password, newpassword } = req.body;
    const id = req.body._id
    console.log(req.body._id);
    try {
        const user = await userData.findById(id)
        console.log(user);
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.json({ message: 'Old password is incorrect', success: false });
        }
        const hashedPassword = await bcrypt.hash(newpassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.json({ message: 'Password updated successfully', success: true, data: user });
    } catch (error) {
        s
        console.error(error);
        res.json({ message: 'An error occurred', success: false });
    }
};
const SetProfilePhotoByRef = async (req, res) => {
    console.log(req.body)

    const { refrenceId, photo } = req.body;
    try {
        const user = await userData.findOne({ refrenceId: refrenceId });
        user.photo = photo;
        await user.save();
        res.json({ message: 'profile updated successfully', success: true, data: user });
    } catch (error) {
        res.json({ message: 'An error occurred', success: false });
    }
}
const addPhotoRequest = async (req, res) => {
    const { refrenceId, description } = req.body;
    try {
        const photo = (req.files) ? req.files.photo[0].filename : null
        const sendPhoto = new userPhoto({
            refrenceId,
            description,
            photo
        })
        await sendPhoto.save().then((data) => {
            res.json({ message: "Photo Added successfully", success: true, result: data })
        })

    } catch (err) {
        res.status(500).json({ message: 'An error occurred', success: false });
    }
}
const getPhotoByRefrenceId = (req, res) => {
    try {

        let refrenceId = req.params.refrenceId;
        console.log(refrenceId)

        userPhoto.find({
            "$or": [
                { "refrenceId": { $regex: refrenceId } }
            ]
        }).then((data) => {
            if (data && data.length > 0) {

                res.json({ data: data, success: true, message: "Photos found" });
            } else {

                res.json({ data: [], success: false, message: "No photos found" });
            }
        });
    } catch {
        res.json({ message: "Something went wrong", success: false });
    }
};
const getProfilePhoto = (req, res) => {
    try {
        let id = req.params.id;
        userPhoto.findById(id).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json(data)

            }
        })
    }
    catch {
        res.json("Something went wrong");
    }
}
const photoDeleteRequest = async (req, res) => {
    let { id } = req.params;
    await userPhoto.findByIdAndDelete(id).then(() => {
        res.json({ message: "Delete succesfully", success: true });
    })
}


// <--------------------------------------------Message Request--------------------------------->

const MessageRequest = async (req, res) => {
    const { senderRefrenceId, recieverRefrenceId, message } = req.body
    console.log(req.body)

    try {
        const sender = await userData.findOne({ refrenceId: senderRefrenceId });
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });

        if (senderRefrenceId === recieverRefrenceId) {
            return res.json({ message: "you can't send self", success: false })
        }
        if (!sender || !receiver) {
            return res.status(404).json({ error: 'One or both users not found.' });
        }
        const messageData = new userMessage({
            sender: sender,
            receiver: receiver,
            message: message
        });
        const data = await messageData.save();

        return res.status(201).json({ message: 'sent successfully', success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while processing the request.', success: false });
    }
}

const getMessageRequest = async (req, res) => {
    try {
        let refrenceId = req.params.refrenceId;

        const messages = await userMessage.find({
            "$or": [
                { "refrenceId": { $regex: refrenceId } }
            ],
        },
        ).populate('sender')
            .exec();
        res.json({ data: messages, success: true });
    }
    catch {
        res.json("Something went wrong");
    }
}

const getMessageSendByRefRequest = async (req, res) => {
    try {
        let sendbyrefrenceId = req.params.sendbyrefrenceId;
        const recieverRefrenceId = req.body.recieverRefrenceId

        await userMessage.find({
            "$and": [
                { "sendbyrefrenceId": { $regex: sendbyrefrenceId } },
                { "refrenceId": { $regex: recieverRefrenceId } }
            ],
        }).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json({ data: data, success: true })
            }
        })
    }
    catch {
        res.json("Something went wrong");
    }

}

const getUserMessageRequest = async (req, res) => {
    try {
        const refrenceId = req.body.refrenceId;
        const sendbyrefrenceId = req.body.sendbyrefrenceId

        await userMessage.find({
            "$and": [
                { "refrenceId": { $regex: refrenceId } },
                { "sendbyrefrenceId": { $regex: sendbyrefrenceId } }
            ],
        }).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json({ data: data, success: true })
            }
        })
    }
    catch {
        // res.json("Something went wrong");
    }
}


// <-----------------------------------Friend Request Section ------------------------------------>

const FriendRequest = async (req, res) => {
    try {
        const { sendbyrefrenceId, recieverRefrenceId } = req.body;

        const sender = await userData.findOne({ refrenceId: sendbyrefrenceId });
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });

        if (sendbyrefrenceId === recieverRefrenceId) {
            return res.json({ message: "you can't send self", success: false })
        }

        if (!sender || !receiver) {
            return res.status(404).json({ error: 'One or both users not found.' });
        }
        const friendRequest = new FriendRequestData({
            sender: sender,
            receiver: receiver,
            status: 'pending',
            notification: "0"
        });
        const data = await friendRequest.save();
        // sender.status = 'sent';
        // await sender.save();
        return res.status(201).json({ message: { status: ' Sent!', _id: data._id }, success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while processing the request.', success: false });
    }
}

const FriendRequestRecieverStatus = async (req, res) => {
    try {
        const senderRefrenceId = req.params.senderRefrenceId
        const recieverRefrenceId = req.params.recieverRefrenceId
        const sender = await userData.findOne({ refrenceId: senderRefrenceId });
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });

        if (!sender && !receiver) {
            return res.json({ error: 'User not found.' });
        }
        const friendRequest = await FriendRequestData.findOne({ sender: sender._id, receiver: receiver._id });

        if (!friendRequest) {
            return res.json({ message: 'No friend request found for the render.' });
        }

        return res.json({ message: friendRequest.status, success: true });

    } catch (error) {
        console.error('Error while finding friend requests:', error);
        return res.json({ error: 'An error occurred while fetching sender status.' });
    }
}

const FriendRequestSenderStatus = async (req, res) => {
    try {
        const sendbyrefrenceId = req.params.senderId;
        const recieverRefrenceId = req.params.receiverId;
        console.log(recieverRefrenceId);
        console.log(sendbyrefrenceId)

        const sender = await userData.findOne({ refrenceId: sendbyrefrenceId });
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });

        if (!sender && !receiver) {
            return res.json({ error: 'User not found.' });
        }
        const friendRequest = await FriendRequestData.findOne({ sender: sender._id, receiver: receiver._id });

        return res.json({ message: friendRequest, success: true });

    } catch (error) {
        console.error('Error while finding friend requests:', error);
        return res.json({ error: 'An error occurred while fetching sender status.' });
    }
}

const unFriendRequest = async (req, res) => {
    let { id } = req.params;
    await FriendRequestData.findByIdAndDelete(id).then(() => {
        res.json({ message: "Delete succesfully", success: true });
    })

}

const getFriendRequestByRef = async (req, res) => {

    const recieverRefrenceId = req.params.recieverRefrenceId
    console.log(recieverRefrenceId);

    try {
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });

        if (!receiver) {
            return res.json({ message: "user not found", success: false });
        }
        const pendingRequests = await FriendRequestData.find({ receiver: receiver._id })
            .populate({
                path: 'sender',
                select: '-password -otherSensitiveData', // Exclude sensitive data of the sender
                model: 'UserSignUp'
            });

        if (!pendingRequests) {
            return res.json({ message: "not request fount for reciever", success: false });
        }
        const pendingRequestsData = pendingRequests.map((request) => {
            return {
                sender: request.sender,
                id: request._id,
                status: request.status,
                notification: request.notification
            };
        });
        return res.json({ data: pendingRequestsData, success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while fetching friend requests.', success: false });
    }
}



const getFriends = async (req, res) => {

    const recieverRefrenceId = req.params.recieverRefrenceId

    console.log(recieverRefrenceId);


    try {
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });
        if (!receiver) {
            return res.json({ message: "User not found", success: false });
        }
        const confirmedRequests = await FriendRequestData.find({
            $or: [
                { receiver: receiver._id },
                { sender: receiver._id }
            ],
            status: 'Friend'
        }).populate([{
            path: 'sender',
            select: '-password -otherSensitiveData',
            model: 'UserSignUp'
        },
        {
            path: 'receiver',
            select: '-password -otherSensitiveData', // Exclude sensitive data of the receiver
            model: 'UserSignUp'
        }
        ]);

        if (!confirmedRequests) {
            return res.json({ message: "No confirmed friends found for the receiver", success: false });
        }

        const confirmedFriends = confirmedRequests.map((request) => {
            const friendInfo =
                request.receiver.equals(receiver._id) ? request.sender : request.receiver;

            return {
                friendReferenceId: friendInfo.refrenceId,
                friendInfo: friendInfo,
                requestId: request._id
            };
        });
        return res.json({ message: confirmedFriends, success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while fetching confirmed friends.', success: false });
    }
}
const getFriendRequestByBoth = async (req, res) => {
    const recieverRefrenceId = req.params.recieverRefrenceId
    const senderRefrenceId = req.params.senderRefrenceId
    console.log(recieverRefrenceId);

    try {
        const sender = await userData.findOne({ refrenceId: senderRefrenceId })
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });

        if (!sender && !receiver) {
            return res.json({ message: "user not found", success: false });
        }

        const pendingRequests = await FriendRequestData.find({ sender: sender._id, receiver: receiver._id })
            .populate({
                path: 'sender',
                select: '-password -otherSensitiveData',
                model: 'UserSignUp'
            });

        if (!pendingRequests || pendingRequests.length === 0) {
            return res.json({ message: "not request fount for reciever", success: false });
        }
        const pendingRequestsData = pendingRequests.map((request) => {
            return {
                sender: request.sender,
                id: request._id,
                status: request.status,
            };
        });
        return res.json({ message: pendingRequestsData, success: true, show: true });
    } catch (error) {
        console.error(error);
        return res.json({ message: 'An error occurred while fetching friend requests.', success: false });
    }
}

const acceptFriendRequest = async (req, res) => {
    const sender = req.params.senderId;
    try {
        const friendRequest = await FriendRequestData.findById(sender);
        if (!friendRequest) {
            return res.json({ message: "Friend request not found", success: false });
        }
        if (friendRequest.status !== 'pending') {
            return res.json({ message: "Friend request is not pending", success: false });
        }
        friendRequest.status = 'Friend';
        friendRequest.notification = "1"
        const data = await friendRequest.save();

        return res.json({ message: [{ status: "Accepted", id: data._id }], success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while accepting the friend request.', success: false });
    }
}

const deleteFriendRequest = async (req, res) => {
    const id = req.params.senderId
    await FriendRequestData.findByIdAndDelete(id).then(() => {
        res.json({ message: "Delete succesfully", success: true });
    })
}

// <------------------------Profile Like ------------------------------------------>

const likeProfileRequest = async (req, res) => {
    try {
        const { sendbyrefrenceId, recieverRefrenceId } = req.body;

        const sender = await userData.findOne({ refrenceId: sendbyrefrenceId });
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });

        if (sendbyrefrenceId === recieverRefrenceId) {
            return res.json({ message: "you can't send self", success: false })
        }
        if (!sender || !receiver) {
            return res.status(404).json({ error: 'One or both users not found.' });
        }
        const ProfileLike = new ProFileLikeData({
            sender: sender,
            receiver: receiver,
            status: 'Liked',
            isSeen:false
        });
        await ProfileLike.save();
        return res.status(201).json({ message: ' Liked', success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while processing the request.', success: false });
    }
}

const likeProfleSenderStatus = async (req, res) => {
    try {
        const sendbyrefrenceId = req.params.senderId;
        const recieverRefrenceId = req.params.receiverId;
        console.log(recieverRefrenceId);
        console.log(sendbyrefrenceId);

        const sender = await userData.findOne({ refrenceId: sendbyrefrenceId });
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });

        if (!sender && !receiver) {
            return res.json({ error: 'User not found.' });
        }
        const ProfileLike = await ProFileLikeData.findOne({ sender: sender._id, receiver: receiver._id });
        if (!ProfileLike) {
            return res.json({ message: 'No friend request found for the sender.' });
        }
        return res.json({ message: ProfileLike.status, success: true });
    } catch (error) {
        console.error('Error while finding friend requests:', error);
        return res.json({ error: 'An error occurred while fetching sender status.' });
    }
}

const likeProfleStatusForSender = async (req, res) => {
    try {
        const sendbyrefrenceId = req.params.senderId;
        console.log(sendbyrefrenceId);

        const sender = await userData.findOne({ refrenceId: sendbyrefrenceId });

        if (!sender) {
            return res.json({ error: 'User not found.' });
        }

        const ProfileLike = await ProFileLikeData.find({ sender: sender._id });
        if (!ProfileLike) {
            return res.json({ message: 'No friend request found for the sender.' });
        }
        return res.json({ message: ProfileLike, success: true });
    } catch (error) {
        console.error('Error while finding friend requests:', error);
        return res.json({ error: 'An error occurred while fetching sender status.' });
    }
}

const likeProfileStatusReciever = async (req, res) => {
    const recieverRefrenceId = req.params.recieverRefrenceId;
    console.log(">>>>>>>>>>>", recieverRefrenceId);
    try {

        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });
        if (!receiver) {
            return res.json({ message: 'User not found.', success: false });
        }
        const ProfileLike = await ProFileLikeData.find({
            $or: [
                { receiver: receiver._id },
                // { sender: receiver._id }
            ],
        }).populate([{
            path: 'sender',
            select: '-password -otherSensitiveData',
            model: 'UserSignUp'
        },
        {
            path: 'receiver',
            select: '-password -otherSensitiveData', // Exclude sensitive data of the receiver
            model: 'UserSignUp'
        }
        ]);
        if (!ProfileLike) {
            return res.json({ message: 'No friend request found for the sender.', success: false });
        }
        console.log(ProfileLike);
        return res.json({ message: ProfileLike, success: true });
    } catch (error) {
        console.error('Error while finding friend requests:', error);
        return res.json({ error: 'An error occurred while fetching sender status.' });
    }
}

const unLikeProfileRequest = async (req, res) => {
    try {
        const { sendbyrefrenceId, recieverRefrenceId } = req.body;

        const sender = await userData.findOne({ refrenceId: sendbyrefrenceId });
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });

        if (sendbyrefrenceId === recieverRefrenceId) {
            return res.json({ message: "you can't send self", success: false })
        }
        if (!sender || !receiver) {
            return res.json({ message: 'One or both users not found.', success: false });
        }
        const existingLike = await ProFileLikeData.findOne({ sender: sender._id, receiver: receiver._id });

        if (!existingLike) {
            return res.json({ message: "You haven't liked this profile before.", success: false });
        }
        await ProFileLikeData.findByIdAndDelete(existingLike._id);

        return res.status(200).json({ message: 'Unliked profile successfully.', success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while processing the request.', success: false });
    }
}

const seenLikeProfileUpdate =async(req,res)=>{
const id = req.params.id
try {
    const updatedProfile = await ProFileLikeData.findByIdAndUpdate(id, { $set: { isSeen: true } }, { new: true });
  
    if (updatedProfile) {
      res.json({ message: "Successfully updated", success: true });
    } else {
      res.json({ message: "Profile not found", success: false });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", success: false });
  }


}

module.exports = {
    getAllUserRequest, SignUpRequest, LoginRequest, getUserProfileRequest, UpdateProfileRequest, getProfileById, ResetPasswordRequest,
    addPhotoRequest, getPhotoByRefrenceId, getProfilePhoto, SetProfilePhotoByRef, photoDeleteRequest, MessageRequest, getUserProfileByEmailRequest, getMessageRequest,
    getMessageSendByRefRequest, getUserMessageRequest, FriendRequest, FriendRequestSenderStatus, getFriendRequestByRef, acceptFriendRequest, deleteFriendRequest, likeProfileRequest,
    likeProfleSenderStatus, unLikeProfileRequest, FriendRequestRecieverStatus, getFriendRequestByBoth, getFriends, unFriendRequest, LogOutRequest, loginWithGoogleRequest
    , likeProfleStatusForSender, SearchUserRequest, likeProfileStatusReciever,seenLikeProfileUpdate,getData
}


