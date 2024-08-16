const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./conn/db_conn.js');
const UserRoute = require('./routers/user.js');
const User = require('./models/user.js'); // Ensure User model is imported
const http = require('http');
const socketIo = require('socket.io');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'https://66bed3a350dbc69caf1e1daf--glistening-buttercream-e5c45e.netlify.app/', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Routers
app.use('/api/v1', UserRoute);

// Creating server
const server = http.createServer(app);

// Creating Socket.IO instance after server initialization
const io = socketIo(server, {
    pingTimeout: 60000,
    cors: {
        origin: 'http://localhost:5173'
    },
});

// Socket.IO setup
io.on('connection', (socket) => {
    console.log('User connected');

    const { userId } = socket.handshake.query; // Correctly access userId
    console.log(`User Id ${userId}`);
    
    if (userId) {
        // Use async/await with findByIdAndUpdate
        (async () => {
            try {
                const user = await User.findByIdAndUpdate(userId, { isOnline: true }, { new: true });
                console.log('User online status updated:', user);

                // Emit online status to all clients if needed
                io.emit('updateOnlineStatus', { userId, status: true });
            } catch (err) {
                console.error('Error updating user online status:', err);
            }
        })();
    }

    socket.on('disconnect', () => {
        console.log('User disconnected');
        
        if (userId) {
            // Use async/await with findByIdAndUpdate
            (async () => {
                try {
                    const user = await User.findByIdAndUpdate(userId, { isOnline: false }, { new: true });
                    console.log('User offline status updated:', user);

                    // Emit offline status to all clients if needed
                    io.emit('updateOnlineStatus', { userId, status: false });
                } catch (err) {
                    console.error('Error updating user offline status:', err);
                }
            })();
        }
    });

    socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
    });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
