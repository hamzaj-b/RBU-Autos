function passwordSetupTemplate(fullName, link) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Set Your Password</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table role="presentation" style="width:100%; border-collapse:collapse; background:#f4f6f8; padding:30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" style="max-width:600px; width:100%; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#2d89ef,#1a5dbf); padding:30px; text-align:center; color:#ffffff;">
                <h1 style="margin:0; font-size:24px;">RBU Autos Garage CRM</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px; color:#333333;">
                <h2 style="margin-top:0; font-size:20px; color:#2d89ef;">Welcome, ${fullName} 👋</h2>
                <p style="font-size:16px; line-height:1.6;">
                  Your account has been created in <b>RBU Autos Garage CRM</b>.  
                  To get started, please set your password using the button below.
                </p>
                <p style="text-align:center; margin:30px 0;">
                  <a href="${link}" 
                     style="display:inline-block; padding:14px 24px; background:#2d89ef; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px;">
                    Set Password
                  </a>
                </p>
                <p style="font-size:14px; color:#666;">
                  ⚠️ For security reasons, this link will expire in <b>15 minutes</b>.  
                  If you didn’t request this, please ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f4f6f8; padding:20px; text-align:center; font-size:12px; color:#999999;">
                © ${new Date().getFullYear()} RBU Autos Garage CRM. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

module.exports = passwordSetupTemplate;
