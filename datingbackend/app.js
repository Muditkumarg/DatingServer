const express = require('express');
const cors = require('cors');
const router = require('./Routes/Route');
const mongoose = require('./Database/db');
const { userData, userMessage, FriendRequestData } = require('./Model/UserSchema.js');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const { Socket } = require('dgram');

const app = express();
app.use(express.json());
app.use(cors());
const server = http.createServer(app)

dotenv.config()

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    }
})
app.use((req, res, next) => {
    console.log("HTTP Method " + req.method + "URL" + req.url);
    next();
});

app.use('/uploads', express.static('./uploads'));
// app.use('/profileuploads', express.static('./profilesuploads'));
// app.use('/VisaDocsuploads',express.static('./VisaDocsuploads'));

app.use('/', router);

function generateRoomName(senderId, receiverId) {
    return senderId < receiverId ? `${senderId}-${receiverId}` : `${receiverId}-${senderId}`;
}
io.on("connection", (socket) => {
    console.log(`user connected: ${socket.id}`);

    // <---------------------------------Socket For Real Time Status Of User----------------------------->

    socket.on("login", async (email) => {
        // Emit user's online status to everyone 
        console.log(email)
        try {
            const sender = await userData.findOne({ email: email });

            // const loginUserStatus = await userData.findByIdAndUpdate(sender._id,{"isOnline":"Online"})
            sender.isOnline = "Online"
            const loginUserStatus = await sender.save();
            const allUsersData = await userData.find({}, { password: 0, })
            io.emit("user-status", allUsersData);

        } catch (error) {
            console.error("Error fetching and emitting messages:", error);
        }
    });
    socket.on("disconnect", () => {
        // Retrieve the email from socket and emit user's offline status
        const { email } = socket;
        if (email) {
            io.emit("user-status", { email: email, isOnline: "Offline" });
        }
    });
    socket.on('logout', async (refrenceId) => {

        const sender = await userData.findOne({ refrenceId: refrenceId })
        sender.isOnline = "Offline"
        const logOutUserStatus = await sender.save();
        const allUsersData = await userData.find({}, { password: 0, })
        io.emit("user-status", allUsersData);

        console.log(sender)
    })

    // <----------------------------------Get all Message By reciverRefrenceId----------------------->

    socket.on("send-Ref",async (data)=>{
        console.log("sendRef",data.recieverRefrenceId);
        const roomName = data.recieverRefrenceId;
        socket.join(roomName);
        try {
            const receiver = await userData.findOne({ refrenceId: data.recieverRefrenceId });
    
            const unreadMessages = await userMessage.find({
                $and: [
                    { receiver: receiver._id },
                    { isRead: false } // Filter unread messages
                ]
            }).sort({ createdAt: 1 });
            io.to(roomName).emit("recievealluser-message", { messages: unreadMessages });
        } catch (error) {
            console.error("Error fetching and emitting messages:", error);
        }
    })

    // <---------------------------------Socket For Real Time Message ------------------------------------->
    socket.on("messagejoin-room", async (data) => {

        const roomName = generateRoomName(data.senderRefrenceId, data.recieverRefrenceId);
        socket.join(roomName);
        console.log(`User joined room: ${roomName}`);

        try {
            const sender = await userData.findOne({ refrenceId: data.senderRefrenceId });
            const receiver = await userData.findOne({ refrenceId: data.recieverRefrenceId });

            const messages = await userMessage.find({
                $or: [
                    { sender: sender._id, receiver: receiver._id },
                    { sender: receiver._id, receiver: sender._id }
                ]
            }).sort({ createdAt: 1 });
            socket.emit("recieve-message", { messages });
        } catch (error) {
            console.error("Error fetching and emitting messages:", error);
        }
    });
    socket.on('send-message', async (data) => {
        try {
            const roomName = generateRoomName(data.messageRoom.senderRefrenceId, data.messageRoom.recieverRefrenceId);
            const sender = await userData.findOne({ refrenceId: data.messageRoom.senderRefrenceId });
            const receiver = await userData.findOne({ refrenceId:data.messageRoom.recieverRefrenceId });
            const friendRequestSenderReceiver = await FriendRequestData.findOne({
                sender: sender._id,
                receiver: receiver._id,
                status: 'Friend'
            });
    
            const friendRequestReceiverSender = await FriendRequestData.findOne({
                sender: receiver._id,
                receiver: sender._id,
                status: 'Friend'
            });
            if(friendRequestSenderReceiver || friendRequestReceiverSender){
                const newMessage = new userMessage({
                    sender: sender._id,
                    receiver: receiver._id,
                    message: data.message.message,
                    isRead: false,
                });
                await newMessage.save();
    
                const messages = await userMessage.find({
                    $or: [
                        { sender: sender._id, receiver: receiver._id },
                        { sender: receiver._id, receiver: sender._id }
                    ]
                }).sort({ createdAt: 1 });
                io.to(roomName).emit("recieve-message", { messages });
            }
            else{
                console.log("Sender and receiver are not friends. Message not sent.");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    });
    socket.on("mark-all-messages-as-read", async (data) => {
        const { senderRefrenceId, recieverRefrenceId } = data;
    console.log("Ffg",senderRefrenceId,recieverRefrenceId)
        try {
            
            const sender = await userData.findOne({ refrenceId: senderRefrenceId });
            const receiver = await userData.findOne({ refrenceId:recieverRefrenceId });
            console.log("Sende",sender._id)
            console.log("Rec",receiver._id)

        await userMessage.updateMany(
                {
                    sender:receiver._id,
                    receiver:sender._id,
                    isRead: false
                },
                { $set: { isRead: true } }
            );

            const readMessage = await userMessage.find({receiver:receiver._id})
            socket.emit("recievealluser-message", { messages: readMessage });
           
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    })
})



server.listen(5000, () => {
    console.log("port 5000 activate")
})