const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    dp: {
        type: String,
        default: " "
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true
    },
    isOnline: { type: Boolean, default: false },
    wins: [{
        points: {
            type: String,
            required: true,
        },
        opponent: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    losses: [{
        points: {
            type: String,
            required: true
        },
        opponent: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    level: {
        type: Number,
        default: 1
    },
    cardsOwned: [{
        cardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Card'
        },
        quantity: {
            type: Number,
            default: 1
        }
    }],
    lastLogin: {
        type: Date,
        default: Date.now
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    badges: [{
        type: String
    }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
