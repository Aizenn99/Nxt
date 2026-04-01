const { StreamClient } = require("@stream-io/node-sdk");

const streamClient = new StreamClient(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

const getStreamToken = (req, res) => {
  const { userId } = req.body;
  const token = streamClient.generateUserToken({ user_id: userId });
  res.json({ token, apiKey: process.env.STREAM_API_KEY });
};

const startAgent = async (req, res) => {
  try {
    const { callId, instructions } = req.body;
    const response = await fetch(
      `${process.env.PYTHON_AGENT_URL}/start-agent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_id: callId, instructions }),
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Failed to start agent:", error);
    res.status(500).json({ error: "Failed to start agent" });
  }
};

module.exports = { getStreamToken, startAgent };