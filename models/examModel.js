const mongoose = require("mongoose");

const examDetailsSchema = {
    subjectName: {
        type: String,
        required: true
    },
    examDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    subjectTotalMarks: {
        type: Number,
        required: true
    }
}

const examSchema = new mongoose.Schema({
    schoolId: {
        type: String,
        required: true
    },
    examName: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    examInfo: [ examDetailsSchema ]

});


module.exports = mongoose.model("Exam", examSchema);