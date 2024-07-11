const mongoose = require('mongoose');

const feeStatus = new mongoose.Schema({
    schoolId: {
        type: String,
        required: true
    },
    studentId: {
        type: String,
        required: true
    },

    year: {
        type: String,
        required: true
    },
    dues:{
        type: Number
    },
    // feeStatus: {
    //     type: String,
    //     required: true
    // },
    feeHistory: [
        {
            date: {
                type: Date,
                required: true
            },
            status: {
                type: String,
                required: true
            },
            month: {
                type: String,
                required: true
            },
            paidAmount: {
                type: String,
                required: true
            }
        }
    ]
});

module.exports = mongoose.model("feeStatus", feeStatus);