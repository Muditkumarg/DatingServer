const {userData,ProFileLikeData} = require('../Model/UserSchema');


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
            return res.json({ message: "Like" });
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

const isSeenNotificationRequest=async(req,res)=>{
    try {
        const query = { isSeen: false };
        const updateOperation = { $set: { isSeen: true } };
        
        const result = await ProFileLikeData.updateMany(query, updateOperation);
        res.json({success:true,message:"Updated"})
    } catch (error) {
        console.error('Error updating documents:', error);
    }
}

const deleteLikeProfile=async(req,res)=>{
    const id = req.params.id
    await ProFileLikeData.findByIdAndDelete(id).then(() => {
        res.json({ message: "Delete succesfully", success: true });
    })
}

module.exports = {likeProfileRequest,likeProfleSenderStatus, unLikeProfileRequest,likeProfleStatusForSender, likeProfileStatusReciever,seenLikeProfileUpdate,
    isSeenNotificationRequest,deleteLikeProfile}