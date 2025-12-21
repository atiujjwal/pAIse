import nodemailer from "nodemailer";
import axios from "axios";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { Twilio } from "twilio";
import { NotificationData, NotificationService } from "./notificationService";
import { WELCOME_USER_TEMPLATE } from "./templates/welcomeUser";
import { LOGIN_OTP_TEMPLATE } from "./templates/loginOtp";
import { FORGOT_PASSWORD_TEMPLATE } from "./templates/forgotPassword";
import { EXPENSE_ADDED_TEMPLATE } from "./templates/expenseCreated";
import { FRIENDLY_REMINDER_TEMPLATE } from "./templates/friendlyReminder";
import { FRIEND_REQUEST_TEMPLATE } from "./templates/friendRequest";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURITY,
  SMTP_USER,
  SMTP_PASS,
  BREVO_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_PHONE_NUMBER,
} = process.env;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Initialize Twilio Client
const twilioClient = new Twilio(
  TWILIO_ACCOUNT_SID as string,
  TWILIO_AUTH_TOKEN as string
);

interface SendTemplateOptions {
  to: string;
  templateId: number;
  data: Record<string, any>;
  subject?: string;
}

interface SendSmsParams {
  mobile: string;
  body: string;
}

interface SendTemplateOptions {
  to: string;
  templateId: number;
  data: Record<string, any>;
  subject?: string;
  notificationData?: NotificationData;
}

/**
 * Helper to fetch template details from Brevo
 */
const getTemplateDetails = async (templateId: number) => {
  try {
    const response = await axios.get(
      `https://api.brevo.com/v3/smtp/templates/${templateId}`,
      {
        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY!,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error getting Template details:",
      error?.response?.data || error.message
    );
    return null;
  }
};

/**
 * Main function to compile and send the email
 */
export const sendEmail = async ({
  to,
  templateId,
  data,
  subject: subjectOverride,
  notificationData,
}: SendTemplateOptions): Promise<boolean> => {
  try {
    // const source = await getTemplateDetails(templateId);
    // if (!source?.htmlContent) {
    //   console.log(`No template content found for templateId: ${templateId}`);
    //   return false;
    // }

    // const template = Handlebars.compile(source.htmlContent);
    // const htmlContent = template(data);

    // const subjectTemplate = Handlebars.compile(
    //   subjectOverride || source.subject
    // );
    // const subject = subjectTemplate(data);

    let htmlContent = "";
    let source = "";
    let defaultSubject = "";

    switch (Number(templateId)) {
      case 2:
        source = WELCOME_USER_TEMPLATE;
        defaultSubject = "Welcome to pAIse!";
        break;
      case 9:
        source = LOGIN_OTP_TEMPLATE;
        defaultSubject = "OTP for login to pAIse";
        break;
      case 3:
        source = FORGOT_PASSWORD_TEMPLATE;
        defaultSubject = "Forgot Password OTP for pAIse";
        break;
      case 7:
        source = EXPENSE_ADDED_TEMPLATE;
        defaultSubject = "New Expense Added on pAIse";
        break;
      case 6:
        source = FRIEND_REQUEST_TEMPLATE;
        defaultSubject = "Friend request received on pAIse";
        break;
      default:
        console.error("Invalid templateId:", templateId);
        return false;
    }

    try {
      const template = Handlebars.compile(source);
      htmlContent = template(data);
    } catch (error) {
      console.error("Error compiling Handlebars template:", error);
      return false;
    }

    const mailOptions = {
      from: `"pAIse App" <paise-apesp.vercel.app>`,
      to,
      subject: subjectOverride || defaultSubject,
      html: htmlContent,
    };

    let info: any;
    if (notificationData) {
      const notificationType = notificationData.type;
      if (
        [
          "FRIEND_REQUEST",
          "FRIEND_ACCEPTED",
          "EXPENSE_ADDED",
          "REMINDER",
        ].includes(notificationType)
      ) {
        info = await transporter.sendMail(mailOptions);
        NotificationService.create(notificationData);
      }
    } else {
      info = await transporter.sendMail(mailOptions);
    }

    console.log(`Email sent to ${to}: ${info.messageId}`);
    return !!info;
  } catch (error: any) {
    console.error("Error sending email:", error);
    return false;
  }
};

/**
 * Function to send SMS using Twilio
 */
export const sendSms = async (data: SendSmsParams): Promise<boolean> => {
  try {
    const response = await twilioClient.messages.create({
      from: TWILIO_FROM_PHONE_NUMBER as string,
      to: data.mobile,
      body: data.body,
    });

    if (response?.sid) {
      console.log(`SMS sent successfully with messageId: ${response.sid}`);
      return true;
    }

    console.log(`Failed to send message to: ${data.mobile}`);
    return false;
  } catch (error) {
    console.error("Error sending SMS: ", error);
    return false;
  }
};
