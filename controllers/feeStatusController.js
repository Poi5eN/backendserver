const FeeStatus = require("../models/feeStatus");
const NewStudentModel = require("../models/newStudentModel");

exports.createOrUpdateFeePayment = async (req, res) => {
    try {
        const { studentId, feeHistory, dues} = req.body;

        const existingFeePayment = await FeeStatus.findOne({
            schoolId: req.user.schoolId,
            studentId,
            year: 2023,
        });

        if (existingFeePayment) {
            existingFeePayment.dues = dues
            existingFeePayment.feeHistory.push(...feeHistory);
            const updatedFeePayment = await existingFeePayment.save();
            res.status(201).json({
                success: true,
                message: "Fee Status is Saved Successfully",
                data: updatedFeePayment
            })

        } else {

            const newFeePayment = new FeeStatus({ schoolId: req.user.schoolId, year: 2023, ...req.body });
            const savedFeePayment = await newFeePayment.save();
            res.status(201).json({
                success: true,
                message: "Fee Status is Saved Successfully",
                data: savedFeePayment
            })
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Fee Status is not created Successfully",
            error: error.message
        })
    };
}


exports.getFeeStatus = async (req, res) => {
    try {

        const { studentId } = req.query;

        let filter ={
            ...(studentId ? { studentId: studentId } : {}),
        }

        const feesData = await FeeStatus.find({ schoolId: req.user.schoolId, ...filter });

        res.status(200).json({
            success: true,
            message: "Fees Data Successfully Get",
            data: feesData
        })

    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Fees Details is not get Successfully",
            error: error.message
        })

    }
}

exports.feeIncomeMonths = async (req, res) => {
    try {

        const feesData = await FeeStatus.find({ schoolId: req.user.schoolId });

        let arr = new Array(12);

        for (let i=0; i<12; i++) arr[i] = 0;

        console.log("feesData.length", feesData.length)

        for (let j=0; j<feesData.length; j++) {

            console.log("feesData[j].feeHistory.length", feesData[j].feeHistory.length)
            for (let k=0; k<feesData[j].feeHistory.length; k++) {

                console.log("feesData[j].feeHistory[k].paidAmount", feesData[j].feeHistory[k].paidAmount);
                arr[k] += Number(feesData[j].feeHistory[k].paidAmount);
            }

        }

        console.log(arr);

        res.status(200).json({
            success: true,
            message: "Fees Data Successfully Get",
            data: arr
        })

    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Fee Income According to month is not get due to error",
            error: error.message
        })
    }
}


exports.getAllFeeStatuses = async (req, res) => {
    try {
        // Fetch all fee statuses for the schoolId from the request token
        const feeStatuses = await FeeStatus.find({ schoolId: req.user.schoolId });

        // Fetch all students for the given schoolId
        const students = await NewStudentModel.find({ schoolId: req.user.schoolId });

        // Create a map of students for easy lookup by studentId
        const studentMap = students.reduce((map, student) => {
            map[student._id] = student;
            return map;
        }, {});

        // Combine fee statuses with corresponding student details
        const combinedData = feeStatuses.map(feeStatus => ({
            ...feeStatus._doc,
            studentDetails: studentMap[feeStatus.studentId]
        }));

        res.status(200).json({
            success: true,
            message: "All fee statuses fetched successfully",
            data: combinedData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch fee statuses",
            error: error.message
        });
    }
};



// exports.createExam = async (req, res) => {
//     try {

//         const {studentId, year, feeHistory} = req.body;

//         // if (!examName || !className || !section || !examInfo) {
//         //     return res.status(404).json({
//         //         success: false,
//         //         message: "Record Not Found Please Fill All Required Details"
//         //     })
//         // }

//         // const existExam = await ExamModel.findOne({
//         //     "schoolId": req.user.schoolId,
//         //     "className": req.user.classTeacher,
//         //     "section": req.user.section
//         // })

//         // if (existExam) {
//         //     return res.status(400).json({
//         //         success: false,
//         //         message: "Exam of that class and section is already created"
//         //     })
//         // }

//         const feesData = await FeeStatus.create({
//             schoolId: req.user.schoolId,
//             studentId,
//             year
//         })

//         res.status(201).json({
//             success: true,
//             message: "Exam is Successfully Created",
//             examData
//         })

//     }
//     catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Exam is not created Successfully",
//             error: error.message
//         })
//     }
// }

// exports.deleteExam = async (req, res) => {
//     try {

//         const {examId} = req.params;

//         const existExam = await ExamModel.findById(examId);

//         if (!existExam) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Exam Data not found"
//             })
//         }

//         const deletedExam = await existExam.deleteOne();

//         res.status(200).json({
//             success: true,
//             message: "Deleted Exam Info is Successfully",
//             deletedExam
//         })

//     } 
//     catch (error) {

//         res.status(500).json({
//             success: false,
//             message: "Delete info of Exam not done successfully due to error",
//             error: error.message
//         })

//     }
// }

// exports.updateExam = async (req, res) => {
//     try {

//         const {...examFields} = req.body;

//         const existExamData = await ExamModel.findOne({
//             schoolId: req.user.schoolId,
//             className: examFields.className,
//             section: examFields.section
//         })

//         if (!existExamData) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Exam Details is not found"
//             })
//         }

//         for (const key in examFields) {

//             if (key === "examName" || key === "examInfo")
//                 existExamData[key] = examFields[key]
//         }

//         const updatedExamData = await existExamData.save();

//         res.status(200).json({
//             success: true,
//             message: "Exam Details is successfully updated",
//             updatedExamData
//         })

//     }
//     catch (error) {

//         res.status(500).json({
//             success: false,
//             message: "Update Details of Exam is not successfully",
//             error: error.message
//         })

//     }
// }