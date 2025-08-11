// const mongoose = require("mongoose");
// const md5 = require("md5");
// const moment = require("moment");
// const humanize = require("string-humanize");
// const Admin = require("../models/AdminModel");
// const MailTemplates = require("../models/MailTemplatesModel");
// mongoose.set("strictQuery", true);
// const connectDb = async () => {
//   try {
//     const connect = await mongoose.connect(process.env.CONNECTION_STRING);
//     console.log(
//       "Database connected: ",
//       connect.connection.host,
//       connect.connection.name
//     );

//     const checkAdmin = await Admin.countDocuments({});
//     if (!checkAdmin) {
//       await Admin.create({
//         firstName: humanize("admin"),
//         lastName: humanize("HireUte"),
//         email: "wd59stpl@gmail.com",
//         password: md5("Admin@123"),
//         roles: "superAdmin",
//         phone: "+911111111111",
//         dob: moment(new Date("01/01/1998")).format(
//           "YYYY-MM-DD[T00:00:00.000Z]"
//         ),
//       });
//     }
//     const template = await MailTemplates.countDocuments({});
//     if (!template) {
//       await MailTemplates.insertMany([
//         {
//           templateEvent: "register-otp-verify",
//           subject: "HireUte OTP Verification",
//           mailVariables: "%otp%",
//           htmlBody: `<!DOCTYPE html>
//             <html lang="en">
//             <head>
//               <meta charset="UTF-8" />
//               <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//               <title>OTP Verification</title>
//             </head>
//             <body
//               style="
//                 font-family: Arial, sans-serif;
//                 background-color: #f4f7fc;
//                 margin: 0;
//                 padding: 0;
//               "
//             >
//               <div
//                 style="
//                   width: 100%;
//                   max-width: 600px;
//                   margin: 40px auto;
//                   background-color: #ffffff;
//                   padding: 30px 0px;
//                   border-radius: 10px;
//                   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//                   text-align: center;
//                 "
//               >
//                 <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 20px">
//                   Verify Your Identity
//                 </h1>

//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">Hello,</p>
//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
//                Your One-Time Password (OTP) for verification is:
//                 </p>

//                 <div
//                   style="
//                     font-size: 40px;
//                     font-weight: bold;
//                     color: #7F0284;
//                     margin: 30px 0;
//                     background-color: #f1f8ff;
//                     padding: 10px 30px;
//                     border-radius: 5px;
//                     display: inline-block;
//                   "
//                 >
//                   %otp%
//                 </div>

//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
//                Please use this OTP to complete your verification.
//                 </p>

//                 <div
//                   style="
//                     margin-top: 40px;
//                     font-size: 14px;
//                     color: #bdc3c7;
//                     border-top: 1px solid #f1f1f1;
//                     padding-top: 20px;
//                   "
//                 >
//                 <p style="margin: 0">© HireUte. All rights reserved.</p>
//                 </div>
//               </div>
//             </body>
//           </html>`,
//           textBody: "Your Help Request Information.",
//         },
//         {
//           templateEvent: "admin-otp-verify",
//           subject: "HireUte OTP Verification",
//           mailVariables: "%otp%",
//           htmlBody: `<!DOCTYPE html>
//             <html lang="en">
//             <head>
//               <meta charset="UTF-8" />
//               <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//               <title>OTP Verification</title>
//             </head>
//             <body
//               style="
//                 font-family: Arial, sans-serif;
//                 background-color: #f4f7fc;
//                 margin: 0;
//                 padding: 0;
//               "
//             >
//               <div
//                 style="
//                   width: 100%;
//                   max-width: 600px;
//                   margin: 40px auto;
//                   background-color: #ffffff;
//                   padding: 30px 0px;
//                   border-radius: 10px;
//                   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//                   text-align: center;
//                 "
//               >
//                 <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 20px">
//                   Verify Your Identity
//                 </h1>

//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">Hello,</p>
//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
//                Your One-Time Password (OTP) for verification is:
//                 </p>

//                 <div
//                   style="
//                     font-size: 40px;
//                     font-weight: bold;
//                     color: #7F0284;
//                     margin: 30px 0;
//                     background-color: #f1f8ff;
//                     padding: 10px 30px;
//                     border-radius: 5px;
//                     display: inline-block;
//                   "
//                 >
//                   %otp%
//                 </div>

//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
//                Please use this OTP to complete your verification.
//                 </p>

//                 <div
//                   style="
//                     margin-top: 40px;
//                     font-size: 14px;
//                     color: #bdc3c7;
//                     border-top: 1px solid #f1f1f1;
//                     padding-top: 20px;
//                   "
//                 >
//                 <p style="margin: 0">© HireUte. All rights reserved.</p>
//                 </div>
//               </div>
//             </body>
//           </html>`,
//           textBody: "Your Help Request Information.",
//         },
//         {
//           templateEvent: "forget-password-otp",
//           subject: "HireUte OTP Verification",
//           mailVariables: "%otp%",
//           htmlBody: `<!DOCTYPE html>
//             <html lang="en">
//             <head>
//               <meta charset="UTF-8" />
//               <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//               <title>OTP Verification</title>
//             </head>
//             <body
//               style="
//                 font-family: Arial, sans-serif;
//                 background-color: #f4f7fc;
//                 margin: 0;
//                 padding: 0;
//               "
//             >
//               <div
//                 style="
//                   width: 100%;
//                   max-width: 600px;
//                   margin: 40px auto;
//                   background-color: #ffffff;
//                   padding: 30px 0px;
//                   border-radius: 10px;
//                   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//                   text-align: center;
//                 "
//               >
//                 <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 20px">
//                   Verify Your Identity
//                 </h1>

//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">Hello,</p>
//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
//                Your One-Time Password (OTP) for verification is:
//                 </p>

//                 <div
//                   style="
//                     font-size: 40px;
//                     font-weight: bold;
//                     color: #7F0284;
//                     margin: 30px 0;
//                     background-color: #f1f8ff;
//                     padding: 10px 30px;
//                     border-radius: 5px;
//                     display: inline-block;
//                   "
//                 >
//                   %otp%
//                 </div>

//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
//                Please use this OTP to complete your verification.
//                 </p>

//                 <div
//                   style="
//                     margin-top: 40px;
//                     font-size: 14px;
//                     color: #bdc3c7;
//                     border-top: 1px solid #f1f1f1;
//                     padding-top: 20px;
//                   "
//                 >
//                 <p style="margin: 0">© HireUte. All rights reserved.</p>
//                 </div>
//               </div>
//             </body>
//           </html>`,
//           textBody: "Your Otp Verfication Information.",
//         },
//         {
//           templateEvent: "query-reply-notification",
//           subject: "HireUte: Response to Your Query #%queryId%",
//           mailVariables: "%queryId%,%reply%,%originalQuery%",
//           htmlBody: `<!DOCTYPE html>
//             <html lang="en">
//             <head>
//               <meta charset="UTF-8" />
//               <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//               <title>Your Query Response</title>
//             </head>
//             <body
//               style="
//                 font-family: Arial, sans-serif;
//                 background-color: #f4f7fc;
//                 margin: 0;
//                 padding: 0;
//               "
//             >
//               <div
//                 style="
//                   width: 100%;
//                   max-width: 600px;
//                   margin: 40px auto;
//                   background-color: #ffffff;
//                   padding: 30px;
//                   border-radius: 10px;
//                   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//                   text-align: center;
//                 "
//               >
//                 <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 20px">
//                   Your Query Has Been Answered
//                 </h1>

//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
//                   Hello,
//                 </p>
//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
//                   We've responded to your query (ID: %queryId%). Here's our reply:
//                 </p>

//                 <div
//                   style="
//                     font-size: 18px;
//                     color: #2c3e50;
//                     margin: 30px 0;
//                     background-color: #f1f8ff;
//                     padding: 20px;
//                     border-radius: 5px;
//                     text-align: left;
//                   "
//                 >
//                   %reply%
//                 </div>

//                 <!-- Optional: Include original query if available -->
//                 <div
//                   style="
//                     font-size: 14px;
//                     color: #7f8c8d;
//                     margin: 20px 0;
//                     padding: 15px;
//                     background-color: #f9f9f9;
//                     border-left: 4px solid #7F0284;
//                     text-align: left;
//                   "
//                 >
//                   <strong>Your Original Query:</strong><br />
//                   %originalQuery%
//                 </div>

//                 <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
//                   We hope this resolves your inquiry. Feel free to reply if you need further assistance!
//                 </p>

//                 <div
//                   style="
//                     margin-top: 40px;
//                     font-size: 14px;
//                     color: #bdc3c7;
//                     border-top: 1px solid #f1f1f1;
//                     padding-top: 20px;
//                   "
//                 >
//                   <p style="margin: 0">© HireUte. All rights reserved.</p>
//                   <p style="margin: 5px 0">Need more help? Contact us at hireute61@gmail.com</p>
//                 </div>
//               </div>
//             </body>
//             </html>`,
//           textBody:
//             "HireUte Query Response\n\nQuery ID: %queryId%\n\nOur Reply: %reply%\n\nOriginal Query: %originalQuery%\n\n© HireUte. All rights reserved.",
//         },
//         {
//           templateEvent: "user-job-ute-status",
//           subject: "%model% Request Status",
//           mailVariables: "%status%,%title% , %model%",
//           htmlBody: `<!DOCTYPE html>
//                    <html>
//                   <head>
//                   <meta charset="UTF-8">
//                   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                   <title>%model% Request %status%</title>
//                   </head>
//                   <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
//                       <div style="max-width: 600px; background: #ffffff; margin: 20px auto; padding: 20px; border-radius: 8px; ">
//                           <div style="text-align: center; padding-bottom: 20px;">
//                               <h2>%model% Request %status%</h2>
//                           </div>
//                           <div style="font-size: 16px; line-height: 1.5; color: #333;">
//                               <p>Hello,</p>
//                               <p>We are pleased to inform you that your %model% request has been <strong style="color:#7F0284", font-weight:800> %status%</strong> !</p>
//                               <p>The %model% is: <strong style="color:#7F0284",>%title%</strong>.</p>

//                           </div>
//                           <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #777;">
//                           <p >Need more help? Contact us at hireute61@gmail.com</p>
//                           </div>
//                       </div>
//                   </body>
//                   </html>`,
//           textBody: "Your Job Status"
//         },
//         {
//           templateEvent: "user-status",
//           subject: "Account Status",
//           mailVariables: "%status%,%firstName% , %lastName%,%email%",
//           htmlBody: `<!DOCTYPE html>
//                    <html>
//                   <head>
//                   <meta charset="UTF-8">
//                   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                   </head>
//                   <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
//                       <div style="max-width: 600px; background: #ffffff; margin: 20px auto; padding: 20px; border-radius: 8px; ">

//                           <div style="font-size: 16px; line-height: 1.5; color: #333;">
//                               <p>Hello %firstName% %lastName% , </p>
//                               <p>We are pleased to inform you that your account %email% has been <strong style="color:#7F0284", font-weight:800> %status%</strong> !</p>
//                           </div>
//                           <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #777;">
//                           <p >Need more help? Contact us at hireute61@gmail.com</p>
//                           </div>
//                       </div>
//                   </body>
//                   </html>`,
//           textBody: "Your Account Status"
//         },
//         {
//           "templateEvent": "requested-job",
//           "subject": "Requested for the Job",
//           "mailVariables": "%fullName% %toName% %jobName% %link%",
//           "htmlBody": "<html> <head> <body> <p>Hello %fullName%</p><br> <p>UTE Owner %toName% has been requested to your job %jobName%</p><br> <p>Here is the link of the list of your UTE Booking <a href=%link%>%link%</a></p> </body> </head> </html>",
//           "textBody": "requested for job",
//         },
//         {
//           "templateEvent": "payment-succeeded",
//           "subject": "Payment success",
//           "mailVariables": "%fullName% %amount%",
//           "htmlBody": "<html> <head> <body> <p>Hello %fullName%</p><br> <p>Your payment has been successed of the amount of %amount%</p> </body> </head> </html>",
//           "textBody": "payment success of the amount of %amount%"
//         },
//         {
//           "templateEvent": "booked-ute",
//           "subject": "Booked UTE",
//           "mailVariables": "%fullName% %uteName%",
//           "htmlBody": "<html> <head> <body> <p>Hello %fullName%</p><br> <p>Your UTE <b>%uteName%</b> has been booked sucessfully</p> </body> </head> </html>",
//           "textBody": " %uteName% UTE booked successfully"
//         },
//         {
//           "templateEvent": "ute-booking-by-user",
//           "subject": "Request for UTE",
//           "mailVariables": "%fullName% %toName% %jobName%",
//           "htmlBody": "<html> <head> <body> <p>Hello %fullName%</p><br> <p>%toName% has been requested to your UTE.</p><br></body> </head> </html>",
//           "textBody": "request for ute",
//         },
//         {
//           "templateEvent": "accept-by-ute-owner",
//           "subject": "Accepted UTE",
//           "mailVariables": "%fullName% %toName% %uteName%",
//           "htmlBody": "<html> <head> <body> <p>Hello %fullName%</p><br> <p>%toName% has been accepted UTE <b>%uteName%</b>.</p><br> <p>Please pay amount to booked the UTE</p> </body> </head> </html>",
//           "textBody": "%toName% has been accepted UTE %uteName%",
//         },
//         {
//           "templateEvent": "ute-dispatch-notification",
//           "subject": "UTE Dispatch",
//           "mailVariables": "%firstName% %lastName% %uteName%",
//           "htmlBody": "<html> <head> <body> <p>Hello %firstName% %lastName%</p><br> <p>UTE <b>%uteName%</b> has been dispatched, soon it will be come to your pickup point </p> </body> </head> </html>",
//           "textBody": "UTE %uteName% has been dispatched successfully",
//         }
//       ]);
//     }
//   } catch (err) {
//     console.error("Database connection error:", err);
//     process.exit(1);
//   }
// };

// module.exports = connectDb;

const mongoose = require("mongoose");
const md5 = require("md5");
const moment = require("moment");
const humanize = require("string-humanize");
const Admin = require("../models/AdminModel");
const MailTemplates = require("../models/MailTemplatesModel");
mongoose.set("strictQuery", true);
const connectDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.CONNECTION_STRING);
    console.log(
      "Database connected: ",
      connect.connection.host,
      connect.connection.name
    );

    const checkAdmin = await Admin.countDocuments({});
    if (!checkAdmin) {
      await Admin.create({
        firstName: humanize("admin"),
        lastName: humanize("HireUte"),
        email: "wd59stpl@gmail.com",
        password: md5("Admin@123"),
        roles: "superAdmin",
        phone: "+911111111111",
        dob: moment(new Date("01/01/1998")).format(
          "YYYY-MM-DD[T00:00:00.000Z]"
        ),
      });
    }
    const template = await MailTemplates.countDocuments({});
    if (!template) {
      await MailTemplates.insertMany([
        {
          templateEvent: "register-otp-verify",
          subject: "HireUte OTP Verification",
          mailVariables: "%otp%",
          htmlBody: `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>OTP Verification</title>
            </head>
            <body
              style="
                font-family: Arial, sans-serif;
                background-color: #f4f7fc;
                margin: 0;
                padding: 0;
              "
            >
              <div
                style="
                  width: 100%;
                  max-width: 600px;
                  margin: 40px auto;
                  background-color: #ffffff;
                  padding: 30px 0px;
                  border-radius: 10px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                  text-align: center;
                "
              >
                <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 20px">
                  Verify Your Identity
                </h1>

                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">Hello,</p>
                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
               Your One-Time Password (OTP) for verification is:
                </p>

                <div
                  style="
                    font-size: 40px;
                    font-weight: bold;
                    color: #7F0284;
                    margin: 30px 0;
                    background-color: #f1f8ff;
                    padding: 10px 30px;
                    border-radius: 5px;
                    display: inline-block;
                  "
                >
                  %otp%
                </div>

                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
               Please use this OTP to complete your verification.
                </p>

                <div
                  style="
                    margin-top: 40px;
                    font-size: 14px;
                    color: #bdc3c7;
                    border-top: 1px solid #f1f1f1;
                    padding-top: 20px;
                  "
                >
                <p style="margin: 0">© HireUte. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>`,
          textBody: "Your Help Request Information.",
        },
        {
          templateEvent: "admin-otp-verify",
          subject: "HireUte OTP Verification",
          mailVariables: "%otp%",
          htmlBody: `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>OTP Verification</title>
            </head>
            <body
              style="
                font-family: Arial, sans-serif;
                background-color: #f4f7fc;
                margin: 0;
                padding: 0;
              "
            >
              <div
                style="
                  width: 100%;
                  max-width: 600px;
                  margin: 40px auto;
                  background-color: #ffffff;
                  padding: 30px 0px;
                  border-radius: 10px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                  text-align: center;
                "
              >
                <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 20px">
                  Verify Your Identity
                </h1>

                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">Hello,</p>
                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
               Your One-Time Password (OTP) for verification is:
                </p>

                <div
                  style="
                    font-size: 40px;
                    font-weight: bold;
                    color: #7F0284;
                    margin: 30px 0;
                    background-color: #f1f8ff;
                    padding: 10px 30px;
                    border-radius: 5px;
                    display: inline-block;
                  "
                >
                  %otp%
                </div>

                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
               Please use this OTP to complete your verification.
                </p>

                <div
                  style="
                    margin-top: 40px;
                    font-size: 14px;
                    color: #bdc3c7;
                    border-top: 1px solid #f1f1f1;
                    padding-top: 20px;
                  "
                >
                <p style="margin: 0">© HireUte. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>`,
          textBody: "Your Help Request Information.",
        },
        {
          templateEvent: "forget-password-otp",
          subject: "HireUte OTP Verification",
          mailVariables: "%otp%",
          htmlBody: `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>OTP Verification</title>
            </head>
            <body
              style="
                font-family: Arial, sans-serif;
                background-color: #f4f7fc;
                margin: 0;
                padding: 0;
              "
            >
              <div
                style="
                  width: 100%;
                  max-width: 600px;
                  margin: 40px auto;
                  background-color: #ffffff;
                  padding: 30px 0px;
                  border-radius: 10px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                  text-align: center;
                "
              >
                <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 20px">
                  Verify Your Identity
                </h1>

                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">Hello,</p>
                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
               Your One-Time Password (OTP) for verification is:
                </p>

                <div
                  style="
                    font-size: 40px;
                    font-weight: bold;
                    color: #7F0284;
                    margin: 30px 0;
                    background-color: #f1f8ff;
                    padding: 10px 30px;
                    border-radius: 5px;
                    display: inline-block;
                  "
                >
                  %otp%
                </div>

                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
               Please use this OTP to complete your verification.
                </p>

                <div
                  style="
                    margin-top: 40px;
                    font-size: 14px;
                    color: #bdc3c7;
                    border-top: 1px solid #f1f1f1;
                    padding-top: 20px;
                  "
                >
                <p style="margin: 0">© HireUte. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>`,
          textBody: "Your Otp Verfication Information.",
        },
        {
          templateEvent: "query-reply-notification",
          subject: "HireUte: Response to Your Query #%queryId%",
          mailVariables: "%queryId%,%reply%,%originalQuery%",
          htmlBody: `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Your Query Response</title>
            </head>
            <body
              style="
                font-family: Arial, sans-serif;
                background-color: #f4f7fc;
                margin: 0;
                padding: 0;
              "
            >
              <div
                style="
                  width: 100%;
                  max-width: 600px;
                  margin: 40px auto;
                  background-color: #ffffff;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                  text-align: center;
                "
              >
                <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 20px">
                  Your Query Has Been Answered
                </h1>
        
                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
                  Hello,
                </p>
                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
                  We've responded to your query (ID: %queryId%). Here's our reply:
                </p>
        
                <div
                  style="
                    font-size: 18px;
                    color: #2c3e50;
                    margin: 30px 0;
                    background-color: #f1f8ff;
                    padding: 20px;
                    border-radius: 5px;
                    text-align: left;
                  "
                >
                  %reply%
                </div>
        
                <!-- Optional: Include original query if available -->
                <div
                  style="
                    font-size: 14px;
                    color: #7f8c8d;
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #f9f9f9;
                    border-left: 4px solid #7F0284;
                    text-align: left;
                  "
                >
                  <strong>Your Original Query:</strong><br />
                  %originalQuery%
                </div>
        
                <p style="font-size: 16px; color: #7f8c8d; line-height: 1.8">
                  We hope this resolves your inquiry. Feel free to reply if you need further assistance!
                </p>
        
                <div
                  style="
                    margin-top: 40px;
                    font-size: 14px;
                    color: #bdc3c7;
                    border-top: 1px solid #f1f1f1;
                    padding-top: 20px;
                  "
                >
                  <p style="margin: 0">© HireUte. All rights reserved.</p>
                  <p style="margin: 5px 0">Need more help? Contact us at hireute61@gmail.com</p>
                </div>
              </div>
            </body>
            </html>`,
          textBody:
            "HireUte Query Response\n\nQuery ID: %queryId%\n\nOur Reply: %reply%\n\nOriginal Query: %originalQuery%\n\n© HireUte. All rights reserved.",
        },
        {
          templateEvent: "user-job-ute-status",
          subject: "%model% Request Status",
          mailVariables: "%status%,%title% , %model%",
          htmlBody: `<!DOCTYPE html>
                   <html>
                  <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>%model% Request %status%</title>
                  </head>
                  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                      <div style="max-width: 600px; background: #ffffff; margin: 20px auto; padding: 20px; border-radius: 8px; ">
                          <div style="text-align: center; padding-bottom: 20px;">
                              <h2>%model% Request %status%</h2>
                          </div>
                          <div style="font-size: 16px; line-height: 1.5; color: #333;">
                              <p>Hello,</p>
                              <p>We are pleased to inform you that your %model% request has been <strong style="color:#7F0284", font-weight:800> %status%</strong> !</p>
                              <p>The %model% is: <strong style="color:#7F0284",>%title%</strong>.</p>
                           </div>
                          <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #777;">
                              <p>Need more help? Contact us at hireute61@gmail.com</p>
                          </div>
                      </div>
                  </body>
                  </html>`,
          textBody: "Your Job Status",
        },
        {
          templateEvent: "user-status",
          subject: "Account Status",
          mailVariables: "%status%,%firstName% , %lastName%,%email%",
          htmlBody: `<!DOCTYPE html>
                   <html>
                  <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                      <div style="max-width: 600px; background: #ffffff; margin: 20px auto; padding: 20px; border-radius: 8px; ">
                      <div style="font-size: 16px; line-height: 1.5; color: #333;">
                        <p>Hello %firstName% %lastName% , </p>
                        <p>We are pleased to inform you that your account %email% has been <strong style="color:#7F0284", font-weight:800> %status%</strong> !</p>
                      </div>
                      <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #777;">
                        <p >Need more help? Contact us at hireute61@gmail.com</p>
                      </div>
                      </div>
                  </body>
                  </html>`,
          textBody: "Your Account Status",
        },
        {
          templateEvent: "requested-job",
          subject: "Requested for the Job",
          mailVariables: "%fullName% %toName% %jobName% %link%",
          htmlBody: `<html>  
                     <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>Payment Successful</title>
                    </head>
              <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
                <div style="max-width: 600px; background: #ffffff; margin: 20px auto; padding: 20px; border-radius: 8px; ">
                  <div style="font-size: 16px; line-height: 1.5; color: #333;">
                    <p>
                      Hello
                      <strong>
                        %fullName%
                      </strong>
                      ,
                    </p>
                    <p style="margin-bottom:2px">
                      UTE Owner
                      <strong style="color: #7F0284;">
                        %toName%
                      </strong>
                      has requested your Job ,
                      <strong style="color: #7F0284;">
                        "%jobName%"
                      </strong>
                      .
                    </p>
                    <br>
                    <p>
                      You can view your UTE bookings by clicking the link below:
                    </p>
                    <p>
                      <a href="%link%" style="color: #007BFF;">
                        %link%
                      </a>
                    </p>
                  </div>
                  <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #777;">
                    <p>
                      Need more help? Contact us at
                      <a href="hireute61@gmail.com" style="color: #7F0284;">
                        hireute61@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
              </body>
          </html>`,
          textBody: "requested for job",
        },
        {
          templateEvent: "payment-succeeded",
          subject: "Payment success",
          mailVariables: "%fullName% %amount%",
          htmlBody: `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>Payment Successful</title>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
                     <div style="max-width: 600px; background-color: #ffffff; margin: 30px auto; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                     <h2 style="color: #7F0284; text-align: center; margin-bottom: 20px;">Payment Confirmation</h2>
                    <div style="font-size: 16px; line-height: 1.6; color: #333;">
                      <p>Hello <strong>%fullName%</strong>,</p> 
                      <p> Your payment has been Successful of the amount <strong style="color: #7F0284;">$%amount%</strong> including GST.</p>
                      <p>Thank you for your payment!</p>
                   </div>
                    <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #888;">
                      <p>Need help? Contact us at <a href="hireute61@gmail.com" style="color: #7F0284; text-decoration: none;">hireute61@gmail.com</a></p>
                    </div>
                    </div>
                    </body>
                    </html>`,
          textBody: "payment success of the amount of %amount%",
        },
        {
          templateEvent: "booked-ute",
          subject: "Booked UTE",
          mailVariables: "%fullName% %uteName%",
          htmlBody: `<!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>UTE Booking Confirmation</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #7F0284; text-align: center; margin-bottom: 20px;">Booking Confirmed</h2>
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Hello <strong>%fullName%</strong>,
                    </p>
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        Your UTE <strong style="color: #7F0284;">%uteName%</strong> has been booked successfully.
                    </p>
                    <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #888;">
                    <p>Need more help? Contact us at <a href="hireute61@gmail.com" style="color: #7F0284; text-decoration: none;">hireute61@gmail.com</a></p>
                    </div>
                    </div>
                  </body>
                </html>`,
          textBody: " %uteName% UTE booked successfully",
        },
        {
          templateEvent: "ute-booking-by-user",
          subject: "Request for UTE",
          mailVariables: "%fullName% %toName% %jobName%",
          htmlBody: `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>UTE Request Notification</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
                     <div style="max-width: 600px; background-color: #ffffff; margin: 0 auto; padding: 30px; border-radius: 10px; ">
              
                    <div style="font-size: 16px; line-height: 1.6; color: #333;">
                          <p>Hello <strong>%fullName%</strong>,</p>
                          <p><strong style="color: #7F0284;">%toName%</strong> has requested to use your UTE.</p>
                          <p>Please review and respond at your earliest convenience.</p>
                    </div>
                    <div style="text-align: center; margin-top: 40px; font-size: 14px; color: #777;">
                          <p>Need more help? Contact us at <a href="hireute61@gmail.com" style="color: #7F0284; text-decoration: none;">hireute61@gmail.com</a></p>
                    </div>
                    </div>
                    </body>
                    </html>`,
          textBody: "request for ute",
        },
        {
          templateEvent: "accept-by-ute-owner",
          subject: "Accepted UTE",
          mailVariables: "%fullName% %toName% %uteName%",
          htmlBody: `<html lang="en">
                    <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>UTE Booking Accepted</title>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
                    <div style="max-width: 600px; background-color: #ffffff; margin: 30px auto; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
                    <div style="text-align: center; margin-bottom: 25px;">
                          <h2 style="color: #7F0284; margin: 0;">UTE Booking Accepted</h2>
                    </div>
                    <div style="font-size: 16px; line-height: 1.6; color: #333;">
                          <p>Hello <strong>%fullName%</strong>,</p>
                          <p><strong style="color: #7F0284;">%toName%</strong> has accepted your UTE request for <strong style="color: #7F0284;">"%uteName%"</strong>.</p>
                          <p>Please proceed with the payment to confirm and book the UTE.</p>
                    </div>
                          <p>Please pay amount to booked the UTE .</p>
                    <div style="text-align: center; margin-top: 40px; font-size: 14px; color: #888;">
                          <p>Need help? Contact us at <a href="hireute61@gmail.com" style="color: #7F0284; text-decoration: none;">hireute61@gmail.com</a></p>
                    </div>
                    </div>
                    </body>
                    </html>
`,
          textBody: "%toName% has been accepted UTE %uteName%",
        },
        {
          templateEvent: "ute-dispatch-notification",
          subject: "UTE Dispatch",
          mailVariables: "%firstName% %lastName% %uteName%",
          htmlBody: `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>UTE Dispatch Notification</title>
                    </head>
                    <body style="font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
                      <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); padding: 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                          <h2 style="color: #7F0284; margin: 0;">UTE Dispatch Notification</h2>
                        </div>
                        <div style="font-size: 16px; line-height: 1.6; color: #333;">
                          <p style="margin-bottom: 2px;">Hello <strong>%firstName% %lastName%</strong>,</p>
                          <p style="margin-bottom: 2px;">We’re excited to inform you that your UTE <strong style="color: #7F0284;">%uteName%</strong> payment is successful, Driver on its way or as agreed .</p>
                          <p style="margin-bottom: 2px;">Thank you for choosing our service!</p>
                        </div>
                        <div style="margin-top: 40px; text-align: center; font-size: 14px; color: #888;">
                          <p>Need more help? Contact us at <a href="hireute61@gmail.com" style="color: #7F0284; text-decoration: none;">hireute61@gmail.com</a></p>
                        </div>
                      </div>
                    </body>
                    </html>
`,
          textBody: "UTE %uteName% has been dispatched successf c ully",
        },
        {
          templateEvent: "ute-dispatch-notification",
          subject: "UTE Dispatch",
          mailVariables: "%firstName% %lastName% %uteName%",
          htmlBody: `<html> <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    </head> <body> <p>Hello %firstName% %lastName%</p><br> <p>UTE <b>%uteName%</b> has been dispatched, soon it will be come to your pickup point </p> </body> </html>`,
          textBody: "UTE %uteName% has been dispatched successfully",
        },
      ]);
    }
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDb;
