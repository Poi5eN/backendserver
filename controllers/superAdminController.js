// const Collection = require('../models/adminModel')
// const getDataUri = require('../utils/dataUri')
// const { hashPassword } = require('./authController')
// const cloudinary = require('cloudinary')
// const { v4: uuidv4 } = require('uuid');
// const sendEmail = require('../utils/email')

// exports.createAdmin = async (req, res) => {
//   try {
//     const { email, password, ...userFields } = req.body;
//     const file = req.file;

//     if (!email || !password) {
//       res.status(400).json({
//         success: false,
//         message: 'Please fill the required fields',
//       });
//     } else {
//       const userExist = await Collection.findOne({ email });

//       if (userExist) {
//         res.send({
//           success: false,
//           message: 'User already exists with this email',
//         });
//       } else {
//         const hashedPassword = await hashPassword(password);
//         let imageObj = {}

//         if (req.file) {
//           const fileUri = getDataUri(file);
//           const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
//           imageObj.public_id =  mycloud.public_id,
//           imageObj.url = mycloud.secure_url
//         }

//         const schoolId = uuidv4();

//         let data = await Collection.create({
//           schoolId: schoolId,
//           email: email,
//           password: hashedPassword,
//           image: imageObj,
//           ...userFields,
//         });

//         if (data) {
//           const emailContent = `
//           <p>Your EmailID: ${data.email}</p>
//           <p>Your Password: ${password}</p>
//           `;

//           sendEmail(data.email, 'Your Login Credentials', emailContent)
//             .then(() => {
//               res.status(201).send({ success: true, message: 'Admin created Successfully' });
//             })
//             .catch((error) => {
//               console.error('Error sending email:', error);
//               res.status(500).send({ success: false, message: error.message });
//             });

//         } else {
//           res.send({ success: false, message: 'Admin is not created' });
//         }
//       }
//     }
//   } catch (err) {
//     console.log(err);
//     res.status(500).send({ message: err.message });
//   }
// };

const Collection = require('../models/adminModel');
const getDataUri = require('../utils/dataUri');
const { hashPassword } = require('./authController');
const cloudinary = require('cloudinary');
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('../utils/email');

exports.createAdmin = async (req, res) => {
  try {
    const { email, password, ...userFields } = req.body;
    const file = req.file;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill the required fields',
      });
    }

    // Check if the user already exists
    const userExist = await Collection.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Upload image to Cloudinary if a file is provided
    let imageObj = {};
    if (file) {
      const fileUri = getDataUri(file);
      const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
      imageObj = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      };
    }

    // Generate a unique schoolId
    const schoolId = uuidv4();

    // Create the admin in the database
    const data = await Collection.create({
      schoolId,
      email,
      password: hashedPassword,
      image: imageObj,
      ...userFields,
    });

    // Send email with credentials
    const emailContent = `
      <p>Your EmailID: ${data.email}</p>
      <p>Your Password: ${password}</p>
    `;
    await sendEmail(data.email, 'Your Login Credentials', emailContent);

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully',
    });
  } catch (err) {
    console.error('Error creating admin:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
