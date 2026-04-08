const nodemailer = require("nodemailer");

// Create transporter ONCE and reuse it
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    console.log("Creating email transporter...");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
    
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
};

const sendWelcomeEmail = async (email, name, password, role) => {
  console.log("Preparing welcome email for:", email);
  
  const loginUrl = process.env.FRONTEND_URL || "http://localhost:3000/login";
  
  const roleDisplay = {
    admin: "Administrator - Full system access",
    officer: "Government Officer - Can upload and manage documents",
    viewer: "Viewer - Can only view and download documents"
  };

  const mailOptions = {
    from: `"Confidential Document System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to Confidential Document System - Your Account Credentials",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a3c34; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Confidential Document System</h1>
          <p style="color: #cbd5e1; margin: 5px 0 0;">Government of India | Secure Portal</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a3c34; margin-top: 0;">Welcome, ${name}!</h2>
          
          <p>Your account has been created in the Confidential Document System.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1a3c34; margin-top: 0;">Account Details</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${roleDisplay[role] || role}</p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${loginUrl}" 
               style="background-color: #1a5f7a; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold;">
              Click Here to Login
            </a>
          </div>
          
          <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Important Security Instructions:</strong>
            </p>
            <ul style="margin: 8px 0 0 20px; color: #92400e; font-size: 13px;">
              <li>Change your password immediately after first login</li>
              <li>Do not share your credentials with anyone</li>
              <li>Contact system administrator if you did not request this account</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          
          <p style="color: #64748b; font-size: 12px; text-align: center;">
            This is an automated message from the Confidential Document System.<br>
            For security concerns, please contact your system administrator.
          </p>
        </div>
      </div>
    `
  };

  try {
    const transporterInstance = getTransporter();
    const info = await transporterInstance.sendMail(mailOptions);
    console.log("Welcome email sent to:", email, "Message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("Welcome email failed:", error.message);
    return false;
  }
};

const sendPasswordResetEmail = async (email, name, newPassword) => {
  console.log("Preparing password reset email for:", email);
  
  const loginUrl = process.env.FRONTEND_URL || "http://localhost:3000/login";

  const mailOptions = {
    from: `"Confidential Document System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Password Has Been Reset",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a3c34; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Password Reset Notification</h1>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a3c34;">Hello ${name},</h2>
          
          <p>Your password has been reset by the system administrator.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1a3c34; margin-top: 0;">New Login Credentials</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>New Password:</strong> ${newPassword}</p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${loginUrl}" 
               style="background-color: #1a5f7a; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold;">
              Login to Your Account
            </a>
          </div>
          
          <div style="background-color: #fee2e2; padding: 12px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              For security reasons, we strongly recommend changing this password after login.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const transporterInstance = getTransporter();
    const info = await transporterInstance.sendMail(mailOptions);
    console.log("Password reset email sent to:", email, "Message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("Password reset email failed:", error.message);
    return false;
  }
};

const sendPasswordResetLink = async (email, name, resetUrl) => {
  console.log("Preparing reset link email for:", email);
  console.log("Reset URL:", resetUrl);
  
  const mailOptions = {
    from: `"Confidential Document System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password - Confidential Document System",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a3c34; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Reset Your Password</h1>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a3c34;">Hello ${name},</h2>
          
          <p>We received a request to reset your password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #1a5f7a; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: bold;">
              Reset Your Password
            </a>
          </div>
          
          <p>This link will expire in <strong>1 hour</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
          
          <hr style="margin: 20px 0;">
          <p style="color: #64748b; font-size: 12px; text-align: center;">
            Confidential Document System<br>
            Government of India | Secure Portal
          </p>
        </div>
      </div>
    `
  };

  try {
    const transporterInstance = getTransporter();
    const info = await transporterInstance.sendMail(mailOptions);
    console.log("Reset link email sent to:", email, "Message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("Reset link email failed:", error.message);
    return false;
  }
};

module.exports = { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetLink };