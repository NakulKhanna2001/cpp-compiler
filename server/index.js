require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const axios   = require("axios");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const LANGUAGE_MAP = {
  cpp17:  { language: "cpp17",  versionIndex: "0" },
  c:      { language: "c",      versionIndex: "5" },
  python: { language: "python3", versionIndex: "4" },
  java:   { language: "java",   versionIndex: "4" },
  js:     { language: "nodejs", versionIndex: "4" },
};

app.post("/run", async (req, res) => {
  const { code, stdin = "", language = "cpp17" } = req.body;

  if (!code) return res.status(400).json({ error: "No code provided" });

  const lang = LANGUAGE_MAP[language] || LANGUAGE_MAP["cpp17"];

  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      clientId:     process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script:       code,
      stdin:        stdin,
      language:     lang.language,
      versionIndex: lang.versionIndex,
    });

    const data = response.data;

    res.json({
      output:    data.output || "",
      memory:    data.memory,
      cpuTime:   data.cpuTime,
      isSuccess: data.isExecutionSuccess,
      isCompiled: data.isCompiled,
    });
  } catch (err) {
    res.status(500).json({ error: "Execution failed: " + err.message });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
