export const FRIENDLY_REMINDER_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Payment Reminder - pAIse</title>
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
    a { text-decoration: none; }
    
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .card { padding: 32px 24px !important; }
      .title { font-size: 28px !important; }
      .amount { font-size: 40px !important; }
      .button { padding: 14px 32px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img 
                src="https://res.cloudinary.com/do1f9qqik/image/upload/v1765724538/BackgroundEraser_20251214_202719717_zhsfnu.png" 
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
                    <div style="width: 64px; height: 64px; background-color: #fef3c7; border-radius: 16px; line-height: 64px; text-align: center; margin: 0 auto;">
                      <span style="font-size: 32px;">🔔</span>
                    </div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center">
                    <h1 class="title" style="margin: 0 0 12px 0; font-size: 32px; font-weight: 700; color: #0f172a;">
                      Friendly Reminder
                    </h1>
                    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                      Hi <strong style="color: #0f172a;">{{recipientName}}</strong>, just a quick nudge from <strong style="color: #0f172a;">{{friendName}}</strong> regarding the balance below.
                    </p>
                  </td>
                </tr>

                <!-- Amount Section -->
                <tr>
                  <td align="center">
                    <div style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #92400e;">
                        Total Pending
                      </p>
                      <h2 class="amount" style="margin: 0; font-size: 48px; font-weight: 800; color: #d97706; letter-spacing: -1px;">
                        {{amount}}
                      </h2>
                    </div>
                  </td>
                </tr>

                <!-- Custom Message -->
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 8px; padding: 20px; text-align: left;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; font-style: italic; color: #475569; line-height: 1.6;">
                        "{{customMessage}}"
                      </p>
                      <p style="margin: 0; font-size: 12px; font-weight: 600; color: #94a3b8;">
                        - {{friendName}}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="{{dashboardLink}}" class="button" target="_blank" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 16px 40px; font-size: 16px; font-weight: 700; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                      Settle Up Now
                    </a>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 24px 0;">
                    <div style="height: 1px; background-color: #e2e8f0;"></div>
                  </td>
                </tr>

                <!-- Footer Note -->
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                      You can view the full details of this expense<br>and others on your dashboard.
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
