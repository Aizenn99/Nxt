const Plunk = require("@plunk/node").default;

/**
 * Sends a premium email notification for a generated video.
 * @param {string} email - Recipient email
 * @param {object} video - Video details { title, videoUrl, thumbnailUrl, format }
 */
async function sendVideoReadyEmail(email, video) {
  const apiKey = (process.env.PLUNK_API_KEY || "").trim();
  if (!apiKey) {
    console.warn("⚠️ PLUNK_API_KEY not found in .env, skipping email notification.");
    return;
  }

  const plunk = new Plunk(apiKey);

  const { title, videoUrl, thumbnailUrl, format } = video;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          background-color: #000000;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 24px;
          overflow: hidden;
          margin-top: 40px;
          margin-bottom: 40px;
        }
        .header {
          padding: 32px 24px;
          text-align: center;
          background: linear-gradient(to right, #60a5fa, #a855f7, #fb923c);
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          text-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .content {
          padding: 32px 24px;
          text-align: center;
        }
        .video-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 24px;
          color: #f4f4f5;
        }
        .thumbnail-container {
          position: relative;
          margin: 0 auto 32px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #3f3f46;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
          width: fit-content;
        }
        .thumbnail {
          display: block;
          max-width: 100%;
          height: auto;
          filter: brightness(0.8);
        }
        .play-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border-radius: 50%;
          padding: 20px;
        }
        .button-group {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .btn {
          display: inline-block;
          padding: 14px 28px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.2s;
        }
        .btn-primary {
          background: #ffffff;
          color: #000000;
        }
        .btn-secondary {
          background: transparent;
          color: #a1a1aa;
          border: 1px solid #27272a;
        }
        .footer {
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #52525b;
          border-top: 1px solid #27272a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NxtAi</h1>
        </div>
        <div class="content">
          <h2 class="video-title">Your Video is Ready!</h2>
          <p style="color: #a1a1aa; margin-bottom: 32px;">We've finished generating "<strong>${title}</strong>". It's waiting for you.</p>
          
          <div class="thumbnail-container">
            <img src="${thumbnailUrl}" width="400" alt="Video Thumbnail" class="thumbnail" />
          </div>

          <div class="button-group">
            <a href="${videoUrl}" target="_blank" class="btn btn-primary">Watch Now</a>
            <a href="${videoUrl}" download class="btn btn-secondary">Download Video</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2026 NxtAi Video Orchestrator. All rights reserved.</p>
          <p>This is an automated notification. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const success = await plunk.emails.send({
      to: email,
      subject: `✨ Your NxtAi Video is Ready: ${title}`,
      body: html,
    });
    console.log(`📧 Email sent to ${email} via Plunk.`);
    return success;
  } catch (error) {
    console.error("❌ Plunk email error:", error.message);
    throw error;
  }
}

module.exports = {
  sendVideoReadyEmail,
};
