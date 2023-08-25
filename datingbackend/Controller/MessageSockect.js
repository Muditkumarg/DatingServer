
const socket = require('../app.js')
const {userMessage,userData} = require('../Model/UserSchema.js')



const messageSocket = async (data) => {
    try {
        const roomName = generateRoomName(data.messageRoom.senderRefrenceId, data.messageRoom.recieverRefrenceId);
        console.log(data);

        const sender = await userData.findOne({ refrenceId: data.messageRoom.senderRefrenceId });
        const receiver = await userData.findOne({ refrenceId: data.messageRoom.recieverRefrenceId });

        const newMessage = new userMessage({
            sender: sender,
            receiver: receiver,
            message: data.message.message
        });
        await newMessage.save();

        const messages = await userMessage.find({
            $or: [
                { sender: data.messageRoom.senderRefrenceId, receiver: data.messageRoom.recieverRefrenceId },
                { sender: data.messageRoom.recieverRefrenceId, receiver: data.messageRoom.senderRefrenceId }
            ]
        }).sort({ createdAt: 1 });

        console.log(messages)
        io.to(roomName).emit("recieve-message", { messages });

    } catch (error) {
        console.error("Error sending message:", error);
    }
}

module.exports = messageSocket