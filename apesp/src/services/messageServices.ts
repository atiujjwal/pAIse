import nodemailer from "nodemailer";
import axios from "axios";
import Handlebars from "handlebars";
import { Twilio } from "twilio";

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
}: SendTemplateOptions): Promise<boolean> => {
  try {
    const source = await getTemplateDetails(templateId);
    if (!source?.htmlContent) {
      console.log(`No template content found for templateId: ${templateId}`);
      return false;
    }

    const template = Handlebars.compile(source.htmlContent);
    const htmlContent = template(data);

    const subjectTemplate = Handlebars.compile(
      subjectOverride || source.subject
    );
    const subject = subjectTemplate(data);

    const mailOptions = {
      from: `"pAIse App" <${SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
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
