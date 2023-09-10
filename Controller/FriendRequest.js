const {userData,FriendRequestData} = require('../Model/UserSchema');


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
           isSeen:false
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
    try {
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });

        if (!receiver) {
            return res.json({ message: "user not found", success: false });
        }
        const pendingRequests = await FriendRequestData.find({ receiver: receiver._id })
            .populate([{
                path: 'sender',
                select: '-password -otherSensitiveData', // Exclude sensitive data of the sender
                model: 'UserSignUp'
            },
                {
                    path: 'receiver',
                    select: '-password -otherSensitiveData', // Exclude sensitive data of the receiver
                    model: 'UserSignUp'
                }
        ]);

        if (!pendingRequests) {
            return res.json({ message: "not request fount for reciever", success: false });
        }
        return res.json({ data: pendingRequests, success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while fetching friend requests.', success: false });
    }
}

const getFriends = async (req, res) => {

    const recieverRefrenceId = req.params.recieverRefrenceId
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
const isSeenFriendReqNotification=async(req,res)=>{
    try {
        const query = { isSeen: false };
        const updateOperation = { $set: { isSeen: true } };
        const result = await FriendRequestData.updateMany(query, updateOperation);
        res.json({success:true,message:"updated"})
    } catch (error) {
        console.error('Error updating documents:', error);
    }
}


module.exports = {FriendRequest, FriendRequestSenderStatus, getFriendRequestByRef, acceptFriendRequest, deleteFriendRequest,FriendRequestRecieverStatus, getFriendRequestByBoth, getFriends, unFriendRequest,isSeenFriendReqNotification}