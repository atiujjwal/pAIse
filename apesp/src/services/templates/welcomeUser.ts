import { pAIse_LOGO } from "@/src/lib/mediaUrls";

export const WELCOME_USER_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to pAIse</title>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background-color: #f1f5f9;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
    
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .card { padding: 32px 24px !important; }
      .title { font-size: 28px !important; }
      .otp { font-size: 36px !important; letter-spacing: 8px !important; }
      .feature-cell { display: block !important; width: 100% !important; padding-bottom: 12px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  
  <div style="display: none; max-height: 0; overflow: hidden;">
    ✨ Your pAIse adventure begins now! Verify your account to unlock smart expense splitting.
  </div>
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img 
                src=${pAIse_LOGO} 
                alt="pAIse" 
                width="80"
                height="80"
                style="display: block; border-radius: 20px;"
              />
              <div style="margin-top: 12px; font-size: 24px; font-weight: 800; color: #6366f1;">
                pAIse
              </div>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td class="card" style="background-color: #ffffff; border-radius: 16px; padding: 48px 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                
                <!-- Icon -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background-color: #ddd6fe; border-radius: 16px; line-height: 64px; text-align: center; margin: 0 auto;">
                      <span style="font-size: 32px;">🎉</span>
                    </div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center">
                    <h1 class="title" style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; color: #0f172a;">
                      Welcome to pAIse!
                    </h1>
                    <p style="margin: 0 0 24px 0; font-size: 16px; color: #64748b;">
                      Hey <strong style="color: #0f172a;">{{name}}</strong> 👋
                    </p>
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                      You're just one step away from simplifying<br>
                      expense splitting with your friends.
                    </p>
                  </td>
                </tr>

                <!-- Label -->
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">
                      Verification Code
                    </p>
                  </td>
                </tr>

                <!-- OTP -->
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #f8fafc; border: 2px solid #8b5cf6; border-radius: 12px; padding: 20px 40px;">
                          <span class="otp" style="font-family: 'Courier New', monospace; font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #8b5cf6; display: block;">
                            {{otp}}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Timer -->
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 10px 20px; border-radius: 8px; display: inline-block;">
                      <span style="font-size: 14px; font-weight: 600; color: #92400e;">
                        ⚡ Expires in 90 seconds
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 32px 0;">
                    <div style="height: 1px; background-color: #e2e8f0;"></div>
                  </td>
                </tr>

                <!-- What's Next -->
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 20px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">
                      What You Can Do
                    </p>
                  </td>
                </tr>

                <!-- Features -->
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="feature-cell" width="33%" align="center" style="padding: 0 8px;">
                          <div style="background-color: #dcfce7; border-radius: 12px; padding: 20px 16px; text-align: center;">
                            <div style="font-size: 28px; margin-bottom: 8px;">📊</div>
                            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #166534;">Track Expenses</p>
                          </div>
                        </td>
                        <td class="feature-cell" width="33%" align="center" style="padding: 0 8px;">
                          <div style="background-color: #dbeafe; border-radius: 12px; padding: 20px 16px; text-align: center;">
                            <div style="font-size: 28px; margin-bottom: 8px;">👥</div>
                            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e40af;">Create Groups</p>
                          </div>
                        </td>
                        <td class="feature-cell" width="33%" align="center" style="padding: 0 8px;">
                          <div style="background-color: #fce7f3; border-radius: 12px; padding: 20px 16px; text-align: center;">
                            <div style="font-size: 28px; margin-bottom: 8px;">💸</div>
                            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #9f1239;">Settle Balances</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="height: 32px;"></td>
                </tr>

                <!-- Help Text -->
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">
                      Having trouble? Contact us at <a href="mailto:paiseapesp@gmail.com" style="color: #6366f1; text-decoration: none; font-weight: 600;">support@paise.com</a>
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #64748b;">
                pAIse
              </p>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8;">
                Split bills, not friendships ✨
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © {{year}} pAIse. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
