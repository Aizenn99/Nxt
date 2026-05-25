const { StreamClient } = require("@stream-io/node-sdk");
const Groq = require("groq-sdk");

const streamClient = new StreamClient(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

const automateTasks = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const systemPrompt = `You are an AI Agent Controller.

Your job is to analyze the user's query and decide which actions (tools) must be executed.

You DO NOT generate final answers.
You ONLY return a structured execution plan in JSON.

----------------------------------

AVAILABLE ACTIONS:

1. explain_text
- Use when user wants explanation, learning, or answers.

2. generate_image
- Use when user asks for visual, diagram, illustration, or "show me".

3. generate_video
- Use when user asks for video, animation, demo, or storytelling.

4. start_live_agent
- Use when user wants help, guidance, step-by-step assistance, screen sharing, or seems confused.

----------------------------------

RULES:

- A single query can trigger MULTIPLE actions.
- Always keep outputs beginner-friendly unless specified otherwise.
- Extract the main topic.
- Improve prompts for image/video generation (make them descriptive).
- Only trigger start_live_agent if:
  - user asks for help
  - OR user seems confused
  - OR user explicitly mentions live / screen / guide

- MANDATORY: Every action MUST include a "links" array containing 1-3 related resources.
- For "links", provide a "label" (user-friendly name) and "url" (valid reference URL).
- If no specific site is known, use a high-quality Google Search or YouTube Search URL.

- DO NOT add explanations.
- DO NOT add extra text.
- ONLY return valid JSON.

----------------------------------

OUTPUT FORMAT:

{
  "topic": "string",
  "level": "beginner | intermediate | advanced",
  "actions": [
    {
      "type": "explain_text",
      "input": "...",
      "links": [
        { "label": "Google Search: Topic", "url": "https://www.google.com/search?q=topic" }
      ]
    },
    {
      "type": "start_live_agent",
      "reason": "...",
      "links": [
        { "label": "YouTube: Topic Tutorial", "url": "https://www.youtube.com/results?search_query=topic+tutorial" }
      ]
    }
  ]
}

----------------------------------

EXAMPLE:

User:
"help me understand quantum physics"

Output:
{
  "topic": "quantum physics",
  "level": "intermediate",
  "actions": [
    {
      "type": "explain_text",
      "input": "Explain the fundamental principles of quantum physics like superposition and entanglement simply",
      "links": [
        { "label": "Quantum Physics Wiki", "url": "https://en.wikipedia.org/wiki/Quantum_mechanics" },
        { "label": "Veritasium: Quantum Mechanics", "url": "https://www.youtube.com/results?search_query=veritasium+quantum+physics" }
      ]
    },
    {
      "type": "start_live_agent",
      "reason": "Topic is complex, user might need a guided session",
      "links": [
        { "label": "Google Search: Quantum Physics for Beginners", "url": "https://www.google.com/search?q=quantum+physics+for+beginners" }
      ]
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
    res.json(result);
  } catch (error) {
    console.error("Automation error:", error);
    res.status(500).json({ error: "Failed to automate tasks" });
  }
};

module.exports = { getStreamToken, startAgent, automateTasks };