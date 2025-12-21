export const FRIEND_REQUEST_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Friend Request</title>
  <style>
    /* Reset styles for email clients */
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0F172A; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; display: block; }
    a { text-decoration: none; }
    
    /* Responsive styling */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px !important; }
      .card { padding: 32px !important; border-radius: 24px !important; }
      .logo-img { width: 80px !important; height: auto !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC;">

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="width: 600px; margin: 0 auto;">
          
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="#" target="_blank" style="text-decoration: none;">
                <img 
                  src="https://res.cloudinary.com/do1f9qqik/image/upload/v1765724538/BackgroundEraser_20251214_202719717_zhsfnu.png" 
                  alt="pAIse Logo" 
                  width="100" 
                  class="logo-img"
                  style="display: block; width: 100px; max-width: 100%; height: auto; border: 0; margin-bottom: 12px;" 
                />
                <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 800; color: #7C5CFF; letter-spacing: -0.5px; text-decoration: none;">
                  pAIse
                </span>
              </a>
            </td>
          </tr>

          <tr>
            <td class="card" style="background-color: #FFFFFF; border-radius: 32px; padding: 48px; border: 1px solid #E2E8F0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.03);">
              
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 72px; height: 72px; background-color: #F3F0FF; border-radius: 24px; text-align: center; line-height: 72px;">
                      <span style="font-size: 32px;">👋</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td align="center">
                    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #1E293B; letter-spacing: -0.025em;">New Friend Request</h1>
                    
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #64748B;">
                      <strong style="color: #1E293B;">{{requesterName}}</strong> wants to be friends with you on pAIse.
                    </p>
                    
                    <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #64748B; max-width: 420px;">
                      Connect to start splitting expenses, tracking balances, and managing group finances together seamlessly.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="{{magicLink}}" target="_blank" style="display: inline-block; background-color: #7C5CFF; color: #FFFFFF; padding: 16px 36px; font-size: 16px; font-weight: 700; border-radius: 16px; text-decoration: none; box-shadow: 0 4px 12px rgba(124, 92, 255, 0.25); transition: background-color 0.2s;">
                      Accept Request
                    </a>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="border-top: 1px solid #F1F5F9; padding-top: 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #94A3B8;">
                      Button not working? Copy and paste this link:
                    </p>
                    <a href="{{magicLink}}" style="font-size: 12px; color: #7C5CFF; text-decoration: none; word-break: break-all; font-weight: 500;">
                      {{magicLink}}
                    </a>
                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #94A3B8;">pAIse App paiseapesp@gmail.com</p>
              <p style="margin: 0; font-size: 12px; color: #CBD5E1;">
                &copy; {{year}} All rights reserved.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #E2E8F0;">
                If you didn't expect this request, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
