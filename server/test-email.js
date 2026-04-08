require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("Testing email configuration...");
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log("Email configuration is CORRECT!");
    
    const result = await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Email",
      text: "If you receive this, email is working!"
    });
    
    console.log("Test email sent! Message ID:", result.messageId);
    
  } catch (error) {
    console.error("Email ERROR:", error.message);
  }
}

testEmail();