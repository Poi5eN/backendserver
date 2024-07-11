const Collection = require("../models/adminModel");
const FeeStructure = require("../models/feeStructureModel");
const Teacher = require("../models/teacherModel");
const cloudinary = require("cloudinary");
const getDataUri = require("../utils/dataUri");
const sendEmail = require("../utils/email");

const {
  setTokenCookie,
  hashPassword,
  createToken,
  verifyPassword,
  fetchTokenFromCookie,
} = require("./authController");
const { v4: uuidv4 } = require("uuid");
const teacherModel = require("../models/teacherModel");
const BookModel = require("../models/bookModel");
const ItemModel = require("../models/inventoryItemModel");
const NewRegistrationModel = require("../models/newRegistrationModel");
const NewStudentModel = require("../models/newStudentModel");
const ParentModel = require("../models/parentModel");
const EmployeeModel = require("../models/employeeModel");
const classModel = require("../models/classModel");
const NoticeModel = require("../models/noticeModel");
const CurriculumModel = require("../models/curriculumModel");
const AssignmentModel = require("../models/assignmentModel");
const issueBookModel = require("../models/issueBookModel");
const AdminInfo = require("../models/adminModel");

// exports.adminlogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await Collection.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const passwordMatch = verifyPassword(password, user.password);

//     if (!passwordMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }
//     const token = createToken(user);
//     setTokenCookie(res, token);

//     res.status(200).send({
//       success: true,
//       message: "Logged in successfully",
//       token: token,
//     });
//   } catch (err) {
//     res.status(500).send({ message: err.message });
//   }
// };

// exports.getAdminInfo = async (req, res) => {
//   try {
//     const admin = await AdminInfo.findOne({schoolId: req.user.schoolId});

//     if (!admin) {
//       return res.status(404).json({
//         success: false,
//         message: "school Id is not correct"
//       })
//     }

//     res.status(200).json({
//       success: true,
//       message: "Admin details fetched is successfully",
//       admin
//     })

//   }
//   catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Admin Details is not get Successfully Due to error",
//       error: error.message
//     })
//   }
// }

// Admin controller
exports.getAdminInfo = async (req, res) => {
  try {
    const admin = await AdminInfo.findOne({ schoolId: req.user.schoolId });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "school Id is not correct",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin details fetched is successfully",
      admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin Details is not get Successfully Due to error",
      error: error.message,
    });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const { email, password, ...userFields } = req.body;

    const file = req.file;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill the required fields",
      });
    } 
    const userExist = await Teacher.findOne({ email });

    if (userExist) {
      return res.status(400).send({
        success: false,
        message: "user already exist with this email",
      });
    } 
    const hashedPassword = await hashPassword(password);

    const fileUri = getDataUri(file);


    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

    const data = await Teacher.create({
      schoolId: req.user.schoolId,
      email: email,
      password: hashedPassword,
      image: {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      },
      ...userFields,
    });

    if (data) {
      const emailContent = `
       <p>Your EmailID: ${email}</p>
       <p>Your Password: ${password}</p>
       `;


      sendEmail(email, "Teacher Login Credentials", emailContent)
        .then(() => {
            console.log("Teacher created and also send message to teacher email id")
        })
        .catch((error) => {
          return res
            .status(500)
            .json({ success: false, message: "Error sending email to teacher email id" });
        });
    } else {
      return res.status(500).json({ success: false, message: "teacher is not created" });
    }

    res.status(201).send({
        success: true,
        message: "Teacher created Successfully",
      });
  } 
  catch (err) {
    res.status(500).send({ error: err.message });
  }
};

exports.deactivateTeacher = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(req.body);

    const deactivateTeacher = await Teacher.findOneAndUpdate(
      {
        schoolId: req.user.schoolId,
        email: email,
      },
      { $set: { status: "deactivated" } },
      { new: true }
    );

    if (deactivateTeacher) {
      res.json({
        status: true,
        message: "Teacher is deactivated",
        teacher: deactivateTeacher,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Teacher not found",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const { email, ...updateFields } = req.body;
    console.log("body", req.body);
    const file = req.file;
    console.log("file", req.file);
    console.log("Image", file);

    const existingTeacher = await Teacher.findOne({
      email: email,
      schoolId: req.user.schoolId,
    });

    if (!existingTeacher) {
      return res.status(404).json({
        status: false,
        message: "Teacher not found",
      });
    }

    if (file) {
      const fileUri = getDataUri(file);
      const mycloud = await cloudinary.uploader.upload(fileUri.content);

      existingTeacher.image = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      };
    }

    for (const key in updateFields) {
      console.log(key);
      existingTeacher[key] = updateFields[key];
    }

    const updatedTeacher = await existingTeacher.save();

    res.json({
      status: true,
      message: "Teacher is updated",
      teacher: updatedTeacher,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.getAllTeachers = async (req, res) => {
  try {
    const { email } = req.query;

    let filter = {
      ...(email ? { email: email } : {}),
    };

    const teachers = await Teacher.find({
      ...filter,
      schoolId: req.user.schoolId,
      status: "active",
    });

    res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a fee structure for a class
exports.createFeeStructure = async (req, res) => {
  try {
    const { className, feeType, amount } = req.body;

    const feesExist = await FeeStructure.findOne({
      schoolId: req.user.schoolId,
      className,
    });

    if (feesExist) {
      return res.status(400).json({
        success: false,
        message: "Fees already exist",
      });
    }

    const feeStructure = new FeeStructure({
      schoolId: req.user.schoolId,
      className,
      feeType,
      amount,
    });

    await feeStructure.save();

    return res
      .status(201)
      .json({ message: "Fee structure created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// Get fee structures for all classes in a school
exports.getAllFeeStructures = async (req, res) => {
  try {
    const { _id, className } = req.query;

    const filter = {
      ...(_id ? { _id: _id } : {}),
      ...(className ? { className: className } : {}),
    };

    const feeStructures = await FeeStructure.find({
      schoolId: req.user.schoolId,
      ...filter,
      additional: false,
    });
    res.status(200).json(feeStructures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateFees = async (req, res) => {
  try {
    const { feeStructureId } = req.params;
    // const { fees } = req.body;

    // Find the fee structure by ID
    const feeStructure = await FeeStructure.findByIdAndUpdate(
      feeStructureId,
      req.body
    );

    // if (!feeStructure) {
    //   return res.status(404).json({ message: "Fee structure not found" });
    // }

    // Iterate through the updated fees array and update the corresponding fees
    // fees.forEach((updatedFee) => {
    //   const existingFee = feeStructure.fees.findIndex((fee) =>
    //     fee._id.equals(updatedFee._id)
    //   );

    // if (existingFee) {
    //   existingFee.amount = updatedFee.amount;
    // }
    // });

    // Save the updated fee structure
    // const updatedFeeStructure = await feeStructure.save();

    res.status(200).json(feeStructure);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFees = async (req, res) => {
  try {
    const { feeStructureId } = req.params;
    console.log(feeStructureId);

    const fees = await FeeStructure.findById({ _id: feeStructureId });

    // console.log(bookData);

    if (!fees) {
      return res.status(200).json({
        success: false,
        Message: "fees doesnot exist ",
      });
    }

    await FeeStructure.deleteOne({ _id: feeStructureId });

    res.status(200).json({
      success: true,
      Message: "fees deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createAdditionalFee = async (req, res) => {
  try {
    const { name, feeType, amount } = req.body;

    const feesExist = await FeeStructure.findOne({
      schoolId: req.user.schoolId,
      additional: true,
      name,
      feeType,
    });

    if (feesExist) {
      return res.status(400).json({
        success: false,
        message: "Fees already exist",
      });
    }

    const feeStructure = new FeeStructure({
      schoolId: req.user.schoolId,
      name,
      feeType,
      amount,
      additional: true,
    });
    await feeStructure.save();

    res.status(201).json({ message: "Fee structure created successfully" });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: error.message });
  }
};

// Get fee structures for all classes in a school
exports.getAllAdditionalFee = async (req, res) => {
  try {
    const { _id } = req.query;

    const filter = {
      ...(_id ? { _id: _id } : {}),
    };

    const feeStructures = await FeeStructure.find({
      ...filter,
      schoolId: req.user.schoolId,
      additional: true,
    });
    res.status(200).json(feeStructures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// exports.updateAdditionalFee = async (req, res) => {
//   try {
//     const { feeStructureId } = req.params;

//     const feeStructure = await FeeStructure.findByIdAndUpdate(
//       feeStructureId, req.body)

//     res.status(200).json(feeStructure);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.deleteAdditionalFee = async (req, res) => {
//   try {
//     const { feeStructureId } = req.params;
//     console.log(feeStructureId)

//     const fees = await FeeStructure.findById({ _id: feeStructureId });

//     // console.log(bookData);

//     if (!fees) {
//       return res.status(200).json({
//         success: false,
//         Message: "fees doesnot exist ",
//       });
//     }

//     await FeeStructure.deleteOne({ _id: feeStructureId });

//     res.status(200).json({
//       success: true,
//       Message: "fees deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// --------------------------------Book Controller

// Create a Book Details for a class

exports.createBookDetails = async (req, res) => {
  try {
    const { bookName, authorName, quantity, category, className, subject } =
      req.body;

    const existBook = await BookModel.find({
      schoolId: req.user.schoolID,
      bookName,
    });
    console.log("existBook", existBook);
    if (existBook.length < 0) {
      return res.status(400).json({
        success: false,
        message: "This book is already created",
      });
    }

    const bookDetails = new BookModel({
      schoolId: req.user.schoolId,
      bookName,
      authorName,
      quantity,
      category,
      className,
      subject,
    });
    await bookDetails.save();

    res.status(201).json({
      success: true,
      message: "Book Details created successfully",
      bookDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get List of all books
exports.getAllBooks = async (req, res) => {
  try {
    const { _id } = req.query;
    console.log("REq.Body", req.query);

    const filter = {
      ...(_id ? { _id: _id } : {}),
    };

    const listOfAllBooks = await BookModel.find({
      ...filter,
      schoolId: req.user.schoolId,
    });

    res.status(200).json({
      success: true,
      message: "All Book fetch successfully",
      listOfAllBooks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Book not fetched due to error",
      error: error.message,
    });
  }
};

// Delete Book
exports.deleteBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const bookData = await BookModel.findById({ _id: bookId });

    if (!bookData) {
      return res.status(200).json({
        success: true,
        Message: "Book Not Exits Please Check",
      });
    }

    await BookModel.deleteOne({ _id: bookId });

    res.status(200).json({
      success: true,
      Message: "Book delete successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Book details not deleted due to error",
      error: error.message,
    });
  }
};

// update Book
exports.updateBook = async (req, res) => {
  try {
    const { ...updateFields } = req.body;

    const { bookId } = req.params;

    const bookData = await BookModel.findById({ _id: bookId });

    if (!bookData) {
      return res.status(404).json({
        success: true,
        Message: "Book Details is not found",
      });
    }

    for (const key in updateFields) {
      bookData[key] = updateFields[key];
    }

    const updatedBookData = await bookData.save();

    res.status(201).json({
      success: true,
      message: "Book Details is updated",
      updatedBookData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Book details is not update due to error Please fix first",
      error: error.message,
    });
  }
};

// --------------------------------Inventory Item Controller

// Create a Item Details for a class
exports.createItemDetails = async (req, res) => {
  try {
    const { itemName, category, quantity, price } = req.body;
    // console.log(req.body)

    const ItemExist = await ItemModel.findOne({
      schoolId: req.user.schoolId,
      itemName,
      category,
    });

    if (ItemExist) {
      return res.status(400).json({
        success: false,
        message: "Item already exist",
      });
    }

    const data = await ItemModel.create({
      schoolId: req.user.schoolId,
      itemName,
      category,
      quantity,
      price,
    });

    res.status(201).json({
      success: true,
      message: "Item Details created successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Item Not created due to error",
      error: error.message,
    });
  }
};

// Get List of all books
exports.getAllItems = async (req, res) => {
  try {
    const { _id } = req.query;
    const filter = {
      ...(_id ? { _id: _id } : {}),
    };

    const listOfAllItems = await ItemModel.find({
      ...filter,
      schoolId: req.user.schoolId,
    });

    res.status(200).json({
      success: true,
      message: "All Items fetch successfully",
      listOfAllItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Item not fetched due to error",
      error: error.message,
    });
  }
};

// Delete Item
exports.deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    console.log("ItemId", itemId);
    const itemData = await ItemModel.findById({ _id: itemId });
    if (!itemData) {
      return res.status(200).json({
        success: false,
        Message: "Item Not Exits Please Check",
      });
    }

    await ItemModel.deleteOne({ _id: itemId });

    res.status(200).json({
      success: true,
      Message: "Item delete successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Item details not deleted due to error",
      error: error.message,
    });
  }
};

// update Item

exports.updateItem = async (req, res) => {
  try {
    const { ...updateFields } = req.body;
    const { itemId } = req.params;
    const itemData = await ItemModel.findById({ _id: itemId });

    if (!itemData) {
      return res.status(404).json({
        success: true,
        Message: "Item Details is not found",
      });
    }
    for (const key in updateFields) {
      itemData[key] = updateFields[key];
    }

    const updatedItemData = await itemData.save();
    res.status(201).json({
      success: true,
      message: "Item Details is updated",
      updatedItemData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Item details is not update due to error Please fix first",
      error: error.message,
    });
  }
};

//creating Subjects

exports.createSubject = async (req, res) => {
  try {
    const { subject, className, classTeacher } = req.body;

    const existingClass = await Subject.findOne({ className });

    if (existingClass) {
      return res.status(400).json({ message: "Class already exists" });
    }

    const newSubject = await Subject.create({
      schoolID: req.user.schoolId,
      subject,
      className,
      classTeacher,
    });

    res
      .status(201)
      .json({ message: "Subject created successfully", subject: newSubject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ schoolId: req.user.schoolId });
    res.json({ success: true, subjects: subjects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const subjectId = req.params.subjectId;
    const { className, classTeacher, subject } = req.body;

    const existingClass = await Subject.findOne({
      schoolId: req.user.schoolId,
      className,
      subjectId,
    });

    if (!existingClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (classTeacher) {
      existingClass.classTeacher = classTeacher;
    }

    if (subject) {
      existingClass.subject = subject;
    }

    const updatedSubject = await existingClass.save();

    res.json({
      message: "Subject updated successfully",
      subject: updatedSubject,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create Student and Parent in one form --------------
// exports.createStudentParent = async (req, res) => {

//   try {

//           const { studentEmail, studentPassword, ...studentsFields } = req.body.student;
//           const { parentEmail, parentPassword, ...parentsFields } = req.body.parent;

//           const studentExist = await NewStudentModel.findOne({ studentEmail })
//           const parentExist = await ParentModel.findOne({ parentEmail })

//           if (studentExist || parentExist) {

//             return res.json({
//               success: false,
//               message: 'Already exist with this email'
//             })

//           }

//           else {
//             const studentHashPassword = await hashPassword(studentPassword);
//             const parentHashPassword = await hashPassword(parentPassword);

//             const studentData = await NewStudentModel.create({
//               studentEmail: studentEmail,
//               studentPassword: studentHashPassword,
//               ...studentsFields
//             });

//             if (studentData) {

//               const studentEmailContent = `
//               <p>Your EmailID: ${studentEmail}</p>
//               <p>Your Password: ${studentPassword}</p>
//               `;

//               sendEmail(studentEmail, 'Your Login Credentials', studentEmailContent)
//               .then(() => {

//                 // res.status(201).json({
//                 //   success: true,
//                 //   message: 'Student Created and also send message to student email Id'
//                 // })

//                 console.log("Student Created and also send message to student email Id");

//               })
//               .catch((error) => {

//                 return res.status(500).json({
//                   success: false,
//                   message: 'Mail is not send to Student Email Address due to error',
//                   error: error.message
//                 })

//               })

//             }
//             else {

//               return res.status(500).json({
//                 success: false,
//                 message: "Student is not created due to error"
//               })

//             }

//             const parentData = await ParentModel.create({
//               parentEmail: parentEmail,
//               parentPassword: parentHashPassword,
//               ...parentsFields
//             });

//             if (parentData) {

//               const parentEmailContent = `
//               <p>Your EmailID: ${parentEmail}</p>
//               <p>Your Password: ${parentPassword}</p>
//               `;

//               sendEmail(parentEmail, 'Your Login Credentials', parentEmailContent)
//               .then(() => {
//                 // res.status(201).json({
//                 //   success: true,
//                 //   message: 'Parent Created and also send message to Parent email Id'
//                 // })

//                 console.log("Parent Created and also send message to Parent email Id");
//               })
//               .catch((error) => {
//                 return res.status(500).json({
//                   success: false,
//                   message: 'Email is not send',
//                   error: error.message
//                 })
//               })

//             }
//             else {

//               return res.status(500).json({
//                 success: false,
//                 message: "Parent is not created due to error"
//               })

//             }

//           }

//           res.status(201).json({
//                   success: true,
//                   message: 'Student and its Parent Created and also send message to Student email id and Parent email Id'
//           })

//   }
//   catch (error) {

//         res.status(500).json({
//           success: false,
//           message: "Student and Parent is not register due to error",
//           error: error.message
//         })

//   }

// }

// exports.createStudentParent = async (req, res) => {

//   try {

//     console.log(req.body);
//     console.log(req.file);
//     console.log(req.files);

//     const {
//       // schoolId,
//       studentFullName,
//       studentEmail,
//       studentPassword,

//       studentDateOfBirth,

//       studentRole,
//       studentRollNo,
//       studentStatus,
//       studentGender,
//       studentJoiningDate,
//       studentAddress,
//       studentContact,
//       studentClass,
//       studentSection,
//       studentCountry,
//       studentSubject,
//       fatherName,
//       motherName,
//       parentEmail,
//       parentPassword,
//       parentStatus,
//       parentContact,
//       parentRole
//     } = req.body;

//     // const {studentImage, parentImage} = res.files;

//     const studentFile = req.files.studentImage;
//     const parentFile = req.files.parentImage;

//     const studentExist = await NewStudentModel.findOne({ studentEmail });
//     const parentExist = await ParentModel.findOne({ parentEmail });

//     if (studentExist || parentExist) {
//       return res.json({
//         success: false,
//         message: "Already exist with this email",
//       });
//     } else {
//       const studentHashPassword = await hashPassword(studentPassword);
//       const parentHashPassword = await hashPassword(parentPassword);

//       const studentImageResult = await cloudinary.uploader.upload(studentFile.tempFilePath);

//       const studentData = await NewStudentModel.create({
//         // schoolId,
//         studentFullName,
//         studentEmail,
//         studentPassword: studentHashPassword,
//         studentDateOfBirth,
//         studentRole,
//         studentRollNo,
//         studentStatus,
//         studentGender,
//         studentJoiningDate,
//         studentAddress,
//         studentContact,
//         studentClass,
//         studentSection,
//         studentCountry,
//         studentSubject,
//         studentImage: {
//           public_id: studentImageResult.public_id,
//           url: studentImageResult.secure_url
//         }
//       });
//       if (studentData) {
//         const studentEmailContent = `
//               <p>Your EmailID: ${studentEmail}</p>
//               <p>Your Password: ${studentPassword}</p>
//               `;

//         sendEmail(studentEmail, "Your Login Credentials", studentEmailContent)
//           .then(() => {
//             // res.status(201).json({
//             //   success: true,
//             //   message: 'Student Created and also send message to student email Id'
//             // })

//             console.log(
//               "Student Created and also send message to student email Id"
//             );
//           })
//           .catch((error) => {
//             return res.status(500).json({
//               success: false,
//               message: "Mail is not send to Student Email Address due to error",
//               error: error.message,
//             });
//           });
//       } else {
//         return res.status(500).json({
//           success: false,
//           message: "Student is not created due to error",
//         });
//       }

//       const parentImageResult = await cloudinary.uploader.upload(parentFile.tempFilePath);

//       const parentData = await ParentModel.create({
//         // schoolId,
//         fatherName,
//         motherName,
//         parentEmail,
//         parentPassword: parentHashPassword,
//         parentStatus,
//         parentContact,
//         parentRole,
//         parentImage: {
//           public_id: parentImageResult.public_id,
//           url: parentImageResult.secure_url
//         }
//       });

//       if (parentData) {
//         studentData.parentId = parentData._id
//         await studentData.save()
//         const parentEmailContent = `
//               <p>Your EmailID: ${parentEmail}</p>
//               <p>Your Password: ${parentPassword}</p>
//               `;

//         sendEmail(parentEmail, "Your Login Credentials", parentEmailContent)
//           .then(() => {
//             // res.status(201).json({
//             //   success: true,
//             //   message: 'Parent Created and also send message to Parent email Id'
//             // })

//             console.log(
//               "Parent Created and also send message to Parent email Id"
//             );
//           })
//           .catch((error) => {
//             return res.status(500).json({
//               success: false,
//               message: "Email is not send",
//               error: error.message,
//             });
//           });
//       } else {
//         return res.status(500).json({
//           success: false,
//           message: "Parent is not created due to error",
//         });
//       }
//     }

//     res.status(201).json({
//       success: true,
//       message:
//         "Student and its Parent Created and also send message to Student email id and Parent email Id",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Student and Parent is not register due to error",
//       error: error.message,
//     });
//   }
// };

//for admissionUser and adminUser both


// START OF THE REGISTRATION

// Function to generate unique registration number
const generateRegistrationNumber = async () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  const randomLetters = Array.from({ length: 3 }, () => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
  const randomNumbers = Array.from({ length: 3 }, () => numbers.charAt(Math.floor(Math.random() * numbers.length))).join('');
  const registrationNumber = randomLetters + randomNumbers;

  // Ensure the registration number is unique
  const existingRegistration = await NewRegistrationModel.findOne({ registrationNumber });
  if (existingRegistration) {
    return generateRegistrationNumber(); // Recursively generate until unique
  }

  return registrationNumber;
};

// Controller for creating a registration (POST)
exports.createRegistration = async (req, res) => {
  try {
    const {
      studentFullName,
      guardianName,
      registerClass,
      studentAddress,
      mobileNumber,
      studentEmail,
      gender,
      amount,
    } = req.body;

    // Check for missing fields
    if (!studentFullName || !guardianName || !registerClass || !studentAddress || !mobileNumber || !studentEmail || !gender || !amount) {
      return res.status(400).json({
        success: false,
        message: "Please enter all required data",
      });
    }

    // Check if the registration already exists
    const registrationExist = await NewRegistrationModel.findOne({ mobileNumber });
    if (registrationExist) {
      return res.status(400).json({
        success: false,
        message: "Already registered!",
      });
    }

    // Generate unique registration number
    const registrationNumber = await generateRegistrationNumber();

    // Create new registration entry
    const registrationData = await NewRegistrationModel.create({
      studentFullName,
      guardianName,
      registerClass,
      studentAddress,
      mobileNumber,
      studentEmail,
      gender,
      amount,
      registrationNumber,
    });

    // Send a confirmation email (if needed)
    if (registrationData) {
      const emailContent = `
        <p>Thank you for showing interest in our school.</p>
        <p>We have received your registration details.</p>
        <p>Student Name: ${studentFullName}</p>
        <p>Class: ${registerClass}</p>
        <p>Registration Number: ${registrationNumber}</p>
      `;
      sendEmail(studentEmail, "Registration Confirmation", emailContent)
        .then(() => {
          console.log("Registration confirmation email sent.");
        })
        .catch((error) => {
          console.error("Error sending confirmation email:", error.message);
        });

      return res.status(201).json({
        success: true,
        message: "Registration created successfully and confirmation email sent.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to create registration due to an error.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create registration due to an error.",
      error: error.message,
    });
  }
};

// Controller for fetching all registrations (GET)
exports.getRegistrations = async (req, res) => {
  try {
    const registrations = await NewRegistrationModel.find({});
    return res.status(200).json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations due to an error.",
      error: error.message,
    });
  }
};

// Controller for fetching a specific registration by ID (GET)
exports.getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await NewRegistrationModel.findById(id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch registration due to an error.",
      error: error.message,
    });
  }
};


// Controller for fetching a specific registration by registration number (GET)
exports.getRegistrationByNumber = async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    console.log(`Fetching registration with registrationNumber: ${registrationNumber}`); // Debug log
    const registration = await NewRegistrationModel.findOne({ registrationNumber });
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error('Error fetching registration:', error); // Debug log
    res.status(500).json({
      success: false,
      message: "Failed to fetch registration due to an error.",
      error: error.message,
    });
  }
};

// END OF THE REGISTRATION

exports.createStudentParent = async (req, res) => {
  try {
    const {
      studentFullName,
      studentEmail,
      studentPassword,
      studentDateOfBirth,
      studentRollNo,
      studentGender,
      studentJoiningDate,
      studentAddress,
      studentContact,
      studentClass,
      studentSection,
      studentCountry,
      studentSubject,
      fatherName,
      motherName,
      parentEmail,
      parentPassword,
      parentContact,
    } = req.body;

    if (!studentEmail || !studentPassword || !parentEmail || !parentPassword) {
      return res.status(400).json({
        success: false,
        message: "Please Enter All required Data",
      });
    }

    const studentFile = req.files[0];
    const parentFile = req.files[1];

    const studentExist = await NewStudentModel.findOne({ email: studentEmail });
    const parentExist = await ParentModel.findOne({ email: parentEmail });

    if (studentExist || parentExist) {
      return res.status(400).json({
        success: false,
        message: "Already exist with this email",
      });
    }
    const studentHashPassword = await hashPassword(studentPassword);
    const parentHashPassword = await hashPassword(parentPassword);

    const studentFileUri = getDataUri(studentFile);
    const parentFileUri = getDataUri(parentFile);

    const studentImageResult = await cloudinary.uploader.upload(
      studentFileUri.content
    );

    const studentData = await NewStudentModel.create({
      schoolId: req.user.schoolId,
      fullName: studentFullName,
      email: studentEmail,
      password: studentHashPassword,
      dateOfBirth: studentDateOfBirth,
      rollNo: studentRollNo,
      gender: studentGender,
      joiningDate: studentJoiningDate,
      address: studentAddress,
      contact: studentContact,
      class: studentClass,
      fatherName: fatherName,
      motherName:motherName,
      section: studentSection,
      country: studentCountry,
      subject: studentSubject,
      image: {
        public_id: studentImageResult.public_id,
        url: studentImageResult.secure_url,
      },
    });
    if (studentData) {
      const studentEmailContent = `
              <p>Your EmailID: ${studentEmail}</p>
              <p>Your Password: ${studentPassword}</p>
              `;

      sendEmail(studentEmail, "Student Login Credentials", studentEmailContent)
        .then(() => {
          console.log(
            "Student Created and also send message to student email Id"
          );
        })
        .catch((error) => {
          return res.status(500).json({
            success: false,
            message: "Mail is not send to Student Email Address due to error",
            error: error.message,
          });
        });
    } else {
      return res.status(500).json({
        success: false,
        message: "Student is not created due to error",
      });
    }

    const parentImageResult = await cloudinary.uploader.upload(
      parentFileUri.content
    );

    const parentData = await ParentModel.create({
      schoolId: req.user.schoolId,
      studentId: studentData._id,
      studentName: studentFullName,
      fullName: fatherName,
      motherName,
      email: parentEmail,
      password: parentHashPassword,
      contact: parentContact,
      image: {
        public_id: parentImageResult.public_id,
        url: parentImageResult.secure_url,
      },
    });

    if (parentData) {
      studentData.parentId = parentData._id;
      await studentData.save();
      const parentEmailContent = `
              <p>Your EmailID: ${parentEmail}</p>
              <p>Your Password: ${parentPassword}</p>
              `;

      sendEmail(parentEmail, "Parent Login Credentials", parentEmailContent)
        .then(() => {
          console.log(
            "Parent Created and also send message to Parent email Id"
          );
        })
        .catch((error) => {
          return res.status(500).json({
            success: false,
            message: "Email is not send",
            error: error.message,
          });
        });
    } else {
      return res.status(500).json({
        success: false,
        message: "Parent is not created due to error",
      });
    }

    res.status(201).json({
      success: true,
      message:
        "Student and its Parent Created and also send message to Student email id and Parent email Id",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Student and Parent is not register due to error",
      error: error.message,
    });
  }
};

exports.updateParent = async (req, res) => {
  try {
    const { fatherName, motherName, parentEmail, parentContact } = req.body;

    const parentImageFile = req.file;

    const parentData = await ParentModel.findOne({
      schoolId: req.user.schoolId,
      email: parentEmail,
    });

    if (!parentData) {
      return res.status(404).json({
        status: false,
        message: "Parent Data is not found",
      });
    }

    if (parentImageFile) {
      const fileUri = getDataUri(parentImageFile);
      const parentImageResult = await cloudinary.uploader.upload(
        fileUri.content
      );
      parentData.parentImage = {
        public_id: parentImageResult.public_id,
        url: parentImageResult.secure_url,
      };
    }

    if (fatherName) {
      parentData.fatherName = fatherName;
    }

    if (motherName) {
      parentData.motherName = motherName;
    }

    if (parentContact) {
      parentData.parentContact = parentContact;
    }

    if (parentEmail) {
      parentData.email = parentEmail;
    }

    const updatedParentData = await parentData.save();

    res.status(200).json({
      success: true,
      message: "Parent data is updated",
      updatedParentData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Parent data is not updated due to error",
      error: error.message,
    });
  }
};

exports.deactivateParent = async (req, res) => {
  try {
    const { email } = req.body;

    const Parent = await ParentModel.findOneAndUpdate(
      { schoolId: req.user.schoolId, email: email },
      {
        $set: {
          parentStatus: "deactivated",
        },
      },
      { new: true }
    );
    console.log(Parent);
    if (!Parent) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Parent is deactivated",
      Parent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Parent is not deactivated due to error",
      error: error.message,
    });
  }
};

exports.getAllParents = async (req, res) => {
  try {
    const { parentEmail } = req.query;

    const filter = {
      ...(parentEmail ? { email: parentEmail } : {}),
    };

    const allParent = await ParentModel.find({
      ...filter,
      schoolId: req.user.schoolId,
      status: "active",
    });

    if (allParent.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Parent Record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "List of parents",
      allParent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "All Parent list is not found due to error",
      error: error.message,
    });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const { email, studentClass, section } = req.query;

    console.log("Chaya", req.query);

    const filter = {
      ...(email ? { email: email } : {}),
      ...(studentClass ? { class: studentClass } : {}),
      ...(section ? { section: section } : {}),
    };

    console.log("P2 Filter", filter);

    const allStudent = await NewStudentModel.find({
      schoolId: req.user.schoolId,
      status: "active",
      ...filter,
    });

    res.status(200).json({
      success: true,
      message: "List of all students",
      allStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "All Student list is not found due to error",
      error: error.message,
    });
  }
};

exports.deactivateStudent = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email);
    const student = await NewStudentModel.findOne({
      schoolId: req.user.schoolId,
      email: email,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student data is not found",
      });
    }

    const Student = await NewStudentModel.findOneAndUpdate(
      { schoolId: req.user.schoolId, email: email },
      {
        $set: {
          status: "deactivated",
        },
      },
      { new: true }
    );

    const Parent = await ParentModel.findByIdAndUpdate(
      { schoolId: req.user.schoolId, _id: student.parentId },
      {
        $set: {
          status: "deactivated",
        },
      },
      { new: true }
    );

    if (!Student || !Parent) {
      return res.status(400).json({
        success: false,
        message: "Student and Parent is not deactivated due to error",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student and Parent is deactivated",
      Student,
      Parent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Student is not deactivated due to error",
      error: error.message,
    });
  }
};

// exports.updateStudent = async (req, res) => {

//   try {

//     const {
//       fullName,
//       email,
//       dateOfBirth,
//       rollNo,
//       gender,
//       joiningDate,
//       address,
//       contact,
//       className,
//       section,
//       subject,
//       country,
//     } = req.body;

//     console.log("amn1",req.body.image)

//     const image = req.file;
// console.log("aman",req.file)
//     const studentData = await NewStudentModel.findOne({ schoolId: req.user.schoolId,email: email });

//     if (!studentData) {
//       return res.status(404).json({
//         status: true,
//         message: "Student Data is not found",
//       })
//     }
//     else {

//       // const studentImageResult = await cloudinary.uploader.upload(studentImageFile.tempFilePath);
//       const fileUri = getDataUri(image);
//       const imageResult = await cloudinary.uploader.upload(fileUri.content);

//       const updatedStudentData = await NewStudentModel.updateOne(
//         {email: email},
//         {
//           $set: {
//             fullName:fullName,
//             dateOfBirth:dateOfBirth,
//             rollNo:rollNo,
//             gender:gender,
//             joiningDate:joiningDate,
//             address:address,
//             contact:contact,
//             class:className,
//             section:section,
//             subject:subject,
//             image: {
//               public_id: imageResult.public_id,
//               url: imageResult.secure_url
//             },
//             country: country
//           }
//         }
//       );

//       res.status(200).json({
//         success: true,
//         message: "Student data is updated",
//         updatedStudentData,
//       })
//     }

//   }
//   catch(error) {

//     res.status(500).json({
//       success: false,
//       message: "Student data is not updated due to error",
//       error: error.message
//     })

//   }
// };

exports.updateStudent = async (req, res) => {
  try {
    const { email, ...studentFields } = req.body;

    const StudentImage = req.file;
    const studentData = await NewStudentModel.findOne({
      schoolId: req.user.schoolId,
      email: email,
    });

    if (!studentData) {
      return res.status(404).json({
        status: false,
        message: "Student Data is not found",
      });
    }

    if (StudentImage) {
      const fileUri = getDataUri(StudentImage);
      const studentImageResult = await cloudinary.uploader.upload(
        fileUri.content
      );

      studentData.image = {
        public_id: studentImageResult.public_id,
        url: studentImageResult.secure_url,
      };
    }

    for (const key in studentFields) {
      studentData[key] = studentFields[key];
    }

    const updatedStudentData = await studentData.save();

    res.status(200).json({
      success: true,
      message: "Student data is updated",
      updatedStudentData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Student data is not updated due to error",
      error: error.message,
    });
  }
};

exports.getStudentsCreatedAfterAprilOfCurrentYear = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const cutoffMonth = 3; // April is month 3 (0-indexed)

    // Calculate the cutoff date based on the current year and April
    const cutoffDate = new Date(currentYear, cutoffMonth, 1);

    if (currentDate.getMonth() < cutoffMonth) {
      // If the current month is before April, subtract a year
      cutoffDate.setFullYear(currentYear - 1);
    }

    // Use the Mongoose 'find' method to query for students created after the cutoff date
    const allStudent = await NewStudentModel.find({
      schoolId: req.user.schoolId,
      status: "active",
      createdAt: { $gte: cutoffDate },
    });

    res.status(200).json({
      count: allStudent.length,
      success: true,
      allStudent: allStudent,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { email, password, ...employeeFields } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill the required fields",
      });
    }

    const employeeExist = await EmployeeModel.findOne({
      schoolId: req.user.schoolId,
      email: email,
    });

    if (employeeExist) {
      return res.status(404).json({
        success: false,
        message: "Employee Data is Already Exist",
      });
    }

    const hashedPassword = await hashPassword(password);

    const file = req.file;
    const fileUri = getDataUri(file);
    const employeeImage = await cloudinary.v2.uploader.upload(fileUri.content);

    const employeeData = await EmployeeModel.create({
      schoolId: req.user.schoolId,
      email,
      password: hashedPassword,
      image: {
        public_id: employeeImage.public_id,
        url: employeeImage.url,
      },
      ...employeeFields,
    });

    if (employeeData) {
      const employeeEmailContent = `
      <p>Your EmailID: ${email}</p>
      <p>Your Password: ${password}</p>
  `;

  sendEmail(email, "Employee Login Credentials", employeeEmailContent)
    .then(() => {
      console.log(
        "Employee Created and also send message to employee email Id"
      );
    })
    .catch((error) => {
      return res.status(500).json({
        success: false,
        message: "Mail is not send to Employee Email Address due to error",
        error: error.message,
      });
    });
    }
    else {
      return res.status(500).json({
        success: true,
        message: "employee is not created"
      })
    }

    res.status(201).json({
      success: true,
      message: "Employee Data is created",
      employeeData,
    });
  } catch (error) {
    res.status(500).json({
      success: "false",
      message: "Employee Data is not created due to error",
      error: error.message,
    });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const { email } = req.query;
    const filter = {
      ...(email ? { email: email } : {}),
    };
    const allEmployee = await EmployeeModel.find({
      ...filter,
      schoolId: req.user.schoolId,
      status: "active",
    });

    res.status(200).json({
      success: true,
      message: "List of all Employee",
      allEmployee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "All Employee list is not found due to error",
      error: error.message,
    });
  }
};

exports.deactivateEmployee = async (req, res) => {
  try {
    const { email } = req.body;

    const Employee = await EmployeeModel.findOneAndUpdate(
      { schoolId: req.user.schoolId, email: email },
      {
        $set: {
          status: "deactivated",
        },
      },
      { new: true }
    );

    if (!Employee) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee is deactivated",
      Employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Employee is not deactivated due to error",
      error: error.message,
    });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { email, ...employeeFields } = req.body;
    const employeeData = await EmployeeModel.findOne({
      schoolId: req.user.schoolId,
      email: email,
    });

    if (!employeeData) {
      return res.status(404).json({
        status: false,
        message: "Employee Data is not found",
      });
    }
    const file = req.file;

    if (file) {
      const fileUri = getDataUri(file);
      const employeeImageResult = await cloudinary.v2.uploader.upload(
        fileUri.content
      );
      employeeData.image = {
        public_id: employeeImageResult.public_id,
        url: employeeImageResult.secure_url,
      };
    }

    for (const key in employeeFields) {
      employeeData[key] = employeeFields[key];
    }

    const updatedEmployeeData = await employeeData.save();

    res.status(200).json({
      success: true,
      message: "Employee data is updated",
      updatedEmployeeData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Employee data is not updated due to error",
      error: error.message,
    });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { className, section, subject, primary } = req.body;

    const existClass = await classModel.findOne({
      schoolId: req.user.schoolId,
      className,
      section,
      primary
    });

    if (existClass) {
      return res.status(400).json({
        success: false,
        message: "This Class is already Created, You Don't Created Again",
      });
    }

    const classOfSchool = await classModel.create({
      schoolId: req.user.schoolId,
      className,
      section,
      subject,
      primary
    });

    res.status(200).json({
      success: true,
      message: "Class is Created Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Class is not created Due to error",
      error: error.message,
    });
  }
};

exports.getAllClass = async (req, res) => {
  try {
    const { className, primary } = req.query;
    
    const filter = {
      ...(className ? { className } : {}),
      ...(primary ? { primary }: {})
    };

    const classList = await classModel.find({
      ...filter,
      schoolId: req.user.schoolId,
    });

    if (!classList) {
      return res.status(404).json({
        success: false,
        message: "Class is not fetch due to error",
      });
    }

    res.status(200).json({
      success: true,
      message: "class list is fetched successfully",
      classList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Class list is not Get due to error",
      error: error.message,
    });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { className, section, subject } = req.body;
    const existClass = await classModel.findOne({
      schoolId: req.user.schoolId,
      className,
    });

    if (!existClass) {
      return res.status(404).json({
        success: false,
        message: "Class is not Exist",
      });
    }

    if (section) {
      existClass.section = section;
    }

    if (subject) {
      existClass.subject = subject;
    }

    const updateClass = await existClass.save();

    res.status(200).json({
      success: true,
      message: "Class is updated successfully",
      updateClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Update is not done due to error",
      error: error.message,
    });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { _id } = req.query;
    const existClass = await classModel.findOne({
      schoolId: req.user.schoolId,
      _id,
    });

    if (!existClass) {
      return res.status(404).json({
        success: false,
        message: "Class is not Exist",
      });
    }

    const deleteClass = await existClass.deleteOne();

    res.status(200).json({
      success: true,
      message: "Deleted Successfully",
      deleteClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Class is not deleted Due to error",
      error: error.message,
    });
  }
};

exports.getAllStudentStatus = async (req, res) => {
  try {
    const { email } = req.query;

    console.log("here", req.query);

    const filter = {
      ...(email ? { email: email } : {}),
    };

    const allStudent = await NewStudentModel.find({
      schoolId: req.user.schoolId,
      // studentStatus: "active",
      ...filter,
    });

    res.status(200).json({
      success: true,
      message: "List of all students",
      allStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "All Student list is not found due to error",
      error: error.message,
    });
  }
};

exports.createNotice = async (req, res) => {
  try {
    const { title, content } = req.body;
    const file = req.file;
    const fileDataUri = getDataUri(file);

    const existNotice = await NoticeModel.findOne({ title: title });

    if (existNotice) {
      return res.status(400).json({
        success: false,
        message: "Title of that notice is already exist",
      });
    }

    const noticeFile = await cloudinary.v2.uploader.upload(fileDataUri.content);

    const notice = await NoticeModel.create({
      schoolId: req.user.schoolId,
      title,
      content,
      file: {
        public_id: noticeFile.public_id,
        url: noticeFile.secure_url,
      },
      class: req.user.classTeacher,
      section: req.user.section,
      role: req.user.role,
    });

    res.status(201).json({
      success: true,
      message: "Notice is successfully created",
      notice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Notice is not created due to error",
      error: error.message,
    });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;

    const existNotice = await NoticeModel.findById(noticeId);

    if (!existNotice) {
      return res.status(400).json({
        success: false,
        message: "Notice does not exist",
      });
    }

    const deletedNotice = await existNotice.deleteOne();

    res.status(200).json({
      success: true,
      message: "Notice deleted successfully",
      deletedNotice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Notice is not deleted due to error",
      error: error.message,
    });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { ...noticeFields } = req.body;
    const file = req.file;

    const existNotice = await NoticeModel.findById(noticeId);

    if (!existNotice) {
      return res.status(404).json({
        success: false,
        message: "Notice does not exist",
      });
    }

    if (file) {
      const fileDataUri = getDataUri(file);

      const noticeFile = await cloudinary.v2.uploader.upload(
        fileDataUri.content
      );

      existNotice.file = {
        public_id: noticeFile.public_id,
        url: noticeFile.secure_url,
      };
    }

    for (let key in noticeFields) {
      existNotice[key] = noticeFields[key];
    }

    const updatedNotice = await existNotice.save();

    res.status(200).json({
      success: true,
      message: "Notice is updated successfully",
      updatedNotice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Notice is not updated due to Error",
      error: error.message,
    });
  }
};

exports.getAllNotice = async (req, res) => {
  try {
    const { noticeId, className, section, role } = req.query;

    const filter = {
      ...(noticeId ? { _id: noticeId } : {}),
      ...(className ? { class: className } : {}),
      ...(section ? { section: section } : {}),
      ...(role ? { role: role } : {}),
    };

    console.log("filter", filter);

    const allNotice = await NoticeModel.find({
      ...filter,
      schoolId: req.user.schoolId,
    });

    res.status(200).json({
      success: true,
      message: "Notice is fetch is successfully",
      allNotice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Notice is not get due to error",
      error: error.message,
    });
  }
};

// exports.getAllStudentOfClass = async (req, res) => {
//   try {

//     const { studentClass, studentSection } = req.body;

//     if (!studentClass || !studentSection) {
//       return res.status(404).json({
//         success: false,
//         message: "Name of Class and Section is Required"
//       });
//     }

//     const allStudent = await NewStudentModel.find({
//       schoolID: req.user.schoolID,
//       studentClass,
//       studentSection,
//       studentStatus: "active",
//     })

//     res.status(200).json({
//       success: true,
//       message: "All Student of Class is Successfully get",
//       allStudent
//     });

//   }
//   catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Student of Class is not get Due to error",
//       error: error.message
//     });
//   }
// }

exports.promotionOfStudent = async (req, res) => {
  try {
    const { students, promotedClass, promotedSection } = req.body;
    console.log("students", students, promotedClass, promotedSection);
    if (!students || !promotedClass || !promotedSection) {
      return res.status(400).json({
        success: false,
        message: "Missing Parameters",
      });
    }

    for (const student of students) {
      const updatedStudent = await NewStudentModel.findByIdAndUpdate(
        student,
        {
          class: promotedClass,
          section: promotedSection,
        },
        { new: true }
      );

      if (!updatedStudent) {
        return res.status(404).json({
          success: false,
          message: `Student Id ${student._id} is not found`,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Selected Student is Promoted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Promotion Of Student not done successfully",
      error: error.message,
    });
  }
};

exports.createCurriculum = async (req, res) => {
  try {
    const { className, academicYear } = req.body;
    const file = req.file;
    const fileDataUri = getDataUri(file);

    const existCurriculum = await CurriculumModel.findOne({
      className: className,
      academicYear: academicYear,
    });

    if (existCurriculum) {
      return res.status(400).json({
        success: false,
        message: "Curriculum of that Class is already exist",
      });
    }

    const curriculumFile = await cloudinary.v2.uploader.upload(
      fileDataUri.content
    );

    const curriculum = await CurriculumModel.create({
      schoolId: req.user.schoolId,
      className,
      academicYear,
      file: {
        public_id: curriculumFile.public_id,
        url: curriculumFile.secure_url,
      },
    });

    res.status(201).json({
      success: true,
      message: "Curriculum of That Class is successfully created",
      curriculum,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Curriculum of that class is not created due to error",
      error: error.message,
    });
  }
};

exports.deleteCurriculum = async (req, res) => {
  try {
    const { curriculumId } = req.params;

    const existCurriculum = await CurriculumModel.findById(curriculumId);

    if (!existCurriculum) {
      return res.status(400).json({
        success: false,
        message: "Curriculum of that class does not exist",
      });
    }

    const deletedCurriculum = await existCurriculum.deleteOne();

    res.status(200).json({
      success: true,
      message: "Curriculum of that class deleted successfully",
      deletedCurriculum,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Curriculum of that class is not deleted due to error",
      error: error.message,
    });
  }
};

exports.updateCurriculum = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const { ...curriculumFields } = req.body;
    const file = req.file;

    const existCurriculum = await CurriculumModel.findById(curriculumId);

    if (!existCurriculum) {
      return res.status(404).json({
        success: false,
        message: "Curriculum of that Class does not exist",
      });
    }

    if (file) {
      const fileDataUri = getDataUri(file);

      const curriculumFile = await cloudinary.v2.uploader.upload(
        fileDataUri.content
      );

      existCurriculum.file = {
        public_id: curriculumFile.public_id,
        url: curriculumFile.secure_url,
      };
    }

    for (let key in curriculumFields) {
      existCurriculum[key] = curriculumFields[key];
    }

    const updatedCurriculum = await existCurriculum.save();

    res.status(200).json({
      success: true,
      message: "Curriculum of that class is updated successfully",
      updatedCurriculum,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Curriculum of that class is not updated due to Error",
      error: error.message,
    });
  }
};

exports.getAllCurriculum = async (req, res) => {
  try {

    const {curriculumId, className} = req.query;

    const filter = {
      ...(curriculumId ? {_id: curriculumId} : {}),
      ...(className ? {className: className}: {})
    }

    const allCurriculum = await CurriculumModel.find({...filter, schoolId: req.user.schoolId });

    res.status(200).json({
      success: true,
      message: "Curriculum of that class is fetch is successfully",
      allCurriculum
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Curriculum of that class is not get due to error",
      error: error.message
    })
  }
}

exports.createAssignment = async (req, res) => {
  try {
    const { className, section, title, description, dueDate, subject } =
      req.body;
    const file = req.file;

    console.log("P2 file", req.file);
    console.log("P2 req.body", req.body);

    const fileDataUri = getDataUri(file);

    const existAssignment = await AssignmentModel.findOne({
      className: className,
      section: section,
      title: title,
    });

    if (existAssignment) {
      return res.status(400).json({
        success: false,
        message: "Assignment of that Class is already exist",
      });
    }

        const assignmentFile = await cloudinary.v2.uploader.upload(
      fileDataUri.content
    );

    const assignment = await AssignmentModel.create({
      schoolId: req.user.schoolId,
      className,
      section,
      title,
      description,
      dueDate,
      subject,
      file: {
        public_id: assignmentFile.public_id,
        url: assignmentFile.secure_url,
      },
    });

    res.status(201).json({
      success: true,
      message: "Assignment of That Class is successfully created",
      assignment,
    });
  } catch (error) {
    console.error("Error occurred at--->>>>>>:", error.stack);
    console.log("AJAYARJ---",error)
    res.status(500).json({
      success: false,
      message: "Assignment of that class is not created due to error",
      error: error.message,
    });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const existAssignment = await AssignmentModel.findById(assignmentId);

    if (!existAssignment) {
      return res.status(400).json({
        success: false,
        message: "Assignment of that class does not exist",
      });
    }

    const deletedAssignment = await existAssignment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Assignment of that class deleted successfully",
      deletedAssignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Assignment of that class is not deleted due to error",
      error: error.message,
    });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { ...assignmentFields } = req.body;
    const file = req.file;

    const existAssignment = await AssignmentModel.findById(assignmentId);

    if (!existAssignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment of that Class does not exist",
      });
    }

    if (file) {
      const fileDataUri = getDataUri(file);

      const assignmentFile = await cloudinary.v2.uploader.upload(
        fileDataUri.content
      );

      // const mycloud = await cloudinary.uploader.upload(fileUri.content);

      existAssignment.file = {
        public_id: assignmentFile.public_id,
        url: assignmentFile.secure_url,
      };
    }

    for (let key in assignmentFields) {
      existAssignment[key] = assignmentFields[key];
    }

    const updatedAssignment = await existAssignment.save();

    res.status(200).json({
      success: true,
      message: "Assignment of that class is updated successfully",
      updatedAssignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Assignement of that class is not updated due to Error",
      error: error.message,
    });
  }
};

// exports.getAllAssignment = async (req, res) => {
//   try {
//     const { assignmentId } = req.query;

//     const filter = {
//       ...(assignmentId ? { _id: assignmentId } : {}),
//     };

//     const allAssignment = await AssignmentModel.find({
//       ...filter,
//       schoolId: req.user.schoolId,
//     });

//     res.status(200).json({
//       success: true,
//       message: "Assignment of that class is fetch is successfully",
//       allAssignment,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Assignment of that class is not get due to error",
//       error: error.message,
//     });
//   }
// };

exports.getAllAssignment = async (req, res) => {
  try {

    const {assignmentId, className, section} = req.query;

    const filter = {
      ...(assignmentId ? {_id: assignmentId} : {}),
      ...(className ? {className: className}: {}),
      ...(section ? {section: section}: {})
    }

    const allAssignment = await AssignmentModel.find({...filter, schoolId: req.user.schoolId });

    res.status(200).json({
      success: true,
      message: "Assignment of that class is fetch is successfully",
      allAssignment
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Assignment of that class is not get due to error",
      error: error.message
    })
  }
}


exports.issueBook = async (req, res) => {
  try {
    const { ...issueBookFields } = req.body;

    const existBook = await BookModel.findById(issueBookFields.bookId);

    if (!existBook) {
      return res.status(404).json({
        success: false,
        message: "Book Details is not exist",
      });
    }

    const existStudent = await NewStudentModel.findById(
      issueBookFields.studentId
    );

    if (!existStudent) {
      return res.status(404).json({
        success: false,
        message: "Student record is not exist",
      });
    }

    const issuedData = await issueBookModel.findOne({
      schoolId: req.user.schoolID,
      bookId: issueBookFields.bookId,
      studentId: issueBookFields.studentId,
      bookName: issueBookFields.bookName,
      status: "issued",
    });

    if (issuedData) {
      return res.status(400).json({
        success: false,
        message: "This Book Already issued to this Student",
      });
    }

    if (existBook.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Stock is not available",
      });
    }

    const issueBookData = await issueBookModel.create({
      schoolId: req.user.schoolId,
      ...issueBookFields,
    });

    if (issueBookData) {
      existBook.quantity = existBook.quantity - 1;

      await existBook.save();
    }

    res.status(201).json({
      success: true,
      message: "Book issued successfully",
      issueBookData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Book was not issued due to error",
      error: error.message,
    });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { issueId } = req.params;

    const issueRecord = await issueBookModel.findById(issueId);

    if (!issueRecord) {
      return res.status(404).json({
        success: false,
        message: "issue Record not found",
      });
    }

    issueRecord.status = "returned";
    issueRecord.returnDate = Date.now();

    await issueRecord.save();

    const existBook = await BookModel.findById(issueRecord.bookId);

    existBook.quantity++;

    await existBook.save();

    res.status(200).json({
      success: true,
      message: "Book Returned Data is successfully Updated",
      issueRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Book not Returned due to error",
      error: error.message,
    });
  }
};


exports.getAllIssueBookToMe = async (req, res) => {
  try {

    if (req.user.role !== "student") {
      return res.status(400).json({
        success: false,
        message: "You are not Student",
      });
    }

    const listOfBook = await issueBookModel.find({
      schoolId: req.user.schoolId,
      studentId: req.user._id,
      status: "issued"
    })

    res.status(200).json({
      success: true,
      message: "List of Books issued is successfully fetched",
      listOfBook
    })
  }
  catch(error) {
    res.status(500).json({
      success: false,
      message: "Not Fetch of list of issue book",
      error: error.message,
    });
  }
}

exports.getAllIssuedBookStudent = async (req, res) => {
  try {
    const { bookId } = req.query;

    const filter = {
      ...(bookId ? { bookId: bookId } : {}),
    };

    const allStudent = await issueBookModel.find({
      status: "issued",
      schoolID: req.user.schoolID,
      ...filter,
    });

    res.status(200).json({
      success: true,
      message: "Issued Book Student data is successfully fetch",
      allStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Issued Book Student data is not get due to error",
      error: error.message,
    });
  }
};

exports.getMyKids = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(400).json({
        success: false,
        message: "You are not Parent",
      });
    }

    const kids = await NewStudentModel.find({ parentId: req.user._id });

    res.status(200).json({
      success: true,
      message: "Kids details is successfully get",
      data: kids,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Kid Details is not get due to error",
      error: error.message,
    });
  }
};
