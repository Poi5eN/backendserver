const ExamModel = require("../models/examModel");

exports.createExam = async (req, res) => {
    try {

        const {examName, className, section, examInfo} = req.body;

        if (!examName || !className || !section || !examInfo) {
            return res.status(404).json({
                success: false,
                message: "Record Not Found Please Fill All Required Details"
            })
        }

        const existExam = await ExamModel.findOne({
            "schoolId": req.user.schoolId,
            "className": req.user.classTeacher,
            "section": req.user.section,
            "examName": req.body.examName
        })

        if (existExam) {
            return res.status(400).json({
                success: false,
                message: "Exam of that class and section is already created"
            })
        }

        const examData = await ExamModel.create({
            schoolId: req.user.schoolId,
            examName,
            className,
            section,
            examInfo
        })

        res.status(201).json({
            success: true,
            message: "Exam is Successfully Created",
            examData
        })

    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Exam is not created Successfully",
            error: error.message
        })
    }
}

exports.deleteExam = async (req, res) => {
    try {

        const {examId} = req.params;

        const existExam = await ExamModel.findById(examId);

        if (!existExam) {
            return res.status(404).json({
                success: false,
                message: "Exam Data not found"
            })
        }

        const deletedExam = await existExam.deleteOne();

        res.status(200).json({
            success: true,
            message: "Deleted Exam Info is Successfully",
            deletedExam
        })

    } 
    catch (error) {

        res.status(500).json({
            success: false,
            message: "Delete info of Exam not done successfully due to error",
            error: error.message
        })

    }
}

exports.updateExam = async (req, res) => {
    try {

        const {...examFields} = req.body;

        const existExamData = await ExamModel.findOne({
            schoolId: req.user.schoolId,
            className: examFields.className,
            section: examFields.section
        })

        if (!existExamData) {
            return res.status(400).json({
                success: false,
                message: "Exam Details is not found"
            })
        }

        for (const key in examFields) {

            if (key === "examName" || key === "examInfo")
                existExamData[key] = examFields[key]
        }

        const updatedExamData = await existExamData.save();

        res.status(200).json({
            success: true,
            message: "Exam Details is successfully updated",
            updatedExamData
        })

    }
    catch (error) {

        res.status(500).json({
            success: false,
            message: "Update Details of Exam is not successfully",
            error: error.message
        })

    }
}

exports.getAllExams = async (req, res) => {
    try {

        const {className, section} = req.query;

        const filter = {
            ...(className ? {className: className} : {}),
            ...(section ? {section: section} : {})
        } 

        const examData = await ExamModel.find({schoolId: req.user.schoolId, ...filter});

        res.status(200).json({
            success: true,
            message: "Exam Data Successfully Get",
            examData
        })

    }
    catch (error) {

        res.status(500).json({
            success: false,
            message: "Exam Details is not get Successfully",
            error: error.message
        })

    }
}