/**
 * Marketing Email Template (Reusable)
 * Usage:
 *   const marketingTemplate = require("./marketingTemplate");
 *   const html = marketingTemplate({
 *     fullName: "Jawad",
 *     headline: "New Winter Collection is Live",
 *     message: "We’ve launched premium hoodies & sweatpants...",
 *     ctaText: "Explore Collection",
 *     ctaLink: "https://yourdomain.com/collection",
 *     footerNote: "Limited stock available.",
 *     unsubscribeLink: "https://yourdomain.com/unsubscribe?token=xxx"
 *   });
 */

function marketingTemplate({
  fullName = "Customer",
  headline = "Big Update Just for You 🎉",
  message = "We’ve got something exciting to share with you. Click below to learn more.",
  ctaText = "View Details",
  ctaLink = "#",
  footerNote = "",
  unsubscribeLink = "#",
  brandName = "RBU Autos Garage CRM",
}) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${headline}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table role="presentation" style="width:100%; border-collapse:collapse; background:#f4f6f8; padding:30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" style="max-width:600px; width:100%; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#2d89ef,#1a5dbf); padding:30px; text-align:center; color:#ffffff;">
                <h1 style="margin:0; font-size:24px;">${brandName}</h1>
                <p style="margin:10px 0 0; font-size:14px; opacity:0.95;">
                  ${headline}
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px; color:#333333;">
                <h2 style="margin-top:0; font-size:20px; color:#2d89ef;">
                  Hello, ${fullName} 👋
                </h2>

                <p style="font-size:16px; line-height:1.7; margin:0 0 14px;">
                  ${message}
                </p>


                ${
                  footerNote
                    ? `<p style="font-size:14px; color:#666; margin:18px 0 0;">
                        ${footerNote}
                      </p>`
                    : ""
                }

                <hr style="border:none; border-top:1px solid #eee; margin:26px 0;" />

                <p style="font-size:12px; color:#888; line-height:1.6; margin:0;">
                  You’re receiving this email because you’re a customer of <b>${brandName}</b>.
                  If you’d rather not receive marketing emails, you can unsubscribe anytime:
                  <a href="${unsubscribeLink}" style="color:#2d89ef; text-decoration:none; font-weight:600;">
                    Unsubscribe
                  </a>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f4f6f8; padding:20px; text-align:center; font-size:12px; color:#999999;">
                © ${new Date().getFullYear()} ${brandName}. All rights reserved.
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

module.exports = marketingTemplate;
