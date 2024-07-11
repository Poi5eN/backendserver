const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    schoolId : {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: true
    },
    section :[String],
    subject :[String],
    primary: {
        type: Boolean,
        default: false
    }
})
module.exports = mongoose.model('Class', classSchema)