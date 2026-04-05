const { Inngest } = require("inngest");

// Create a client to send and receive events
const inngest = new Inngest({ 
  id: "nxt-ai-server",
  env: process.env.INNGEST_DEV === "1" ? "development" : undefined
});

module.exports = { inngest };
