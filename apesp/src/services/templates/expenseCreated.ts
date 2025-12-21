export const EXPENSE_ADDED_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Expense Added</title>
  <style>
    body { margin: 0; padding: 0; width: 100% !important; background-color: #F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0F172A; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    a { text-decoration: none; }
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
                <img src="https://res.cloudinary.com/do1f9qqik/image/upload/v1765724538/BackgroundEraser_20251214_202719717_zhsfnu.png" alt="pAIse Logo" width="100" class="logo-img" style="display: block; width: 100px; height: auto; border: 0; margin-bottom: 12px;" />
                <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 800; color: #7C5CFF; letter-spacing: -0.5px;">pAIse</span>
              </a>
            </td>
          </tr>
          <tr>
            <td class="card" style="background-color: #FFFFFF; border-radius: 32px; padding: 48px; border: 1px solid #E2E8F0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.03);">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 72px; height: 72px; background-color: #ECFDF5; border-radius: 24px; text-align: center; line-height: 72px;">
                      <span style="font-size: 32px;">🧾</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #1E293B;">New Expense Added</h1>
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #64748B;">
                      <strong>{{creatorName}}</strong> added a new expense <strong>{{groupName}}</strong>.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 20px; padding: 24px;">
                          <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">{{description}}</p>
                          <h2 style="margin: 0; font-size: 42px; font-weight: 800; color: #10B981; letter-spacing: -1px;">
                            {{totalAmount}}
                          </h2>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="{{dashboardLink}}" target="_blank" style="display: inline-block; background-color: #10B981; color: #FFFFFF; padding: 16px 36px; font-size: 16px; font-weight: 700; border-radius: 16px; text-decoration: none; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
                      View Expense
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top: 32px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #94A3B8;">pAIse App</p>
              <p style="margin: 0; font-size: 12px; color: #CBD5E1;">&copy; {{year}} All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
