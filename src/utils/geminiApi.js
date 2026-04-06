/**
 * Gemini API helpers for IELTS Writing AI features.
 * Replace GEMINI_API_KEY with your actual key.
 */

const GEMINI_API_KEY = "";
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Generic fetch wrapper with exponential-backoff retry.
 */
const fetchWithRetry = async (payload, retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No text in response");
      return text;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};

/** Extracts mimeType and base64 data from a data-URL string. */
const parseDataUrl = (dataUrl) => ({
  mimeType: dataUrl.split(";")[0].split(":")[1],
  data: dataUrl.split(",")[1],
});

/**
 * Brainstorm ideas for an IELTS writing task.
 * @param {string} topic
 * @param {'Task 1'|'Task 2'} taskType
 * @param {string|null} imageDataUrl  Base64 data-URL of the graph image (Task 1 only)
 * @returns {Promise<string>}
 */
export const brainstormIdeas = async (topic, taskType, imageDataUrl = null) => {
  const systemInstruction = `You are an expert IELTS tutor helping a student brainstorm for Writing ${taskType}.
Provide a highly structured, concise brainstorming sheet for the provided topic${imageDataUrl ? " and attached image" : ""}.
Include:
1. Key Angles/Arguments (Pros/Cons, Causes/Solutions, or Main Trends/Features for Task 1).
2. A suggested paragraph outline.
3. 5-8 useful advanced vocabulary words or collocations specific to this topic.
Keep it concise and format it clearly.`;

  const parts = [{ text: `Task Type: ${taskType}\nTopic: ${topic}` }];
  if (imageDataUrl) {
    const { mimeType, data } = parseDataUrl(imageDataUrl);
    parts.push({ inlineData: { mimeType, data } });
  }

  return fetchWithRetry({
    contents: [{ role: "user", parts }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
  });
};

/**
 * Grade an IELTS writing essay and return structured feedback.
 * @param {string} topic
 * @param {string} essay
 * @param {'Task 1'|'Task 2'} taskType
 * @param {string|null} imageDataUrl
 * @returns {Promise<{score: number, feedback: string, improvedEssay: string, improvedScore: number}>}
 */
export const evaluateEssay = async (topic, essay, taskType, imageDataUrl = null) => {
  const systemInstruction = `You are an expert IELTS examiner specializing in Writing ${taskType}.
Grade the following essay based on the provided topic${imageDataUrl ? " and the attached image" : ""}.
For ${taskType}, use the specific official criteria:
- ${taskType === "Task 1" ? "Task Achievement" : "Task Response"}
- Coherence & Cohesion
- Lexical Resource
- Grammatical Range & Accuracy.

Provide an estimated IELTS band score (in 0.5 increments).
Provide detailed feedback for each of the 4 criteria.
Finally, provide a polished, improved version of the essay that is realistic and scores exactly 0.5 or 1.0 band higher than the original.`;

  const parts = [{ text: `Task Type: ${taskType}\nTopic: ${topic}\n\nEssay: ${essay}` }];
  if (imageDataUrl) {
    const { mimeType, data } = parseDataUrl(imageDataUrl);
    parts.push({ inlineData: { mimeType, data } });
  }

  const responseSchema = {
    type: "OBJECT",
    properties: {
      score: { type: "NUMBER", description: "Estimated IELTS band score (e.g. 6.0, 6.5)" },
      feedback: { type: "STRING", description: "Detailed feedback on the 4 criteria." },
      improvedEssay: { type: "STRING", description: "A polished version of the essay." },
      improvedScore: { type: "NUMBER", description: "The score of the improved essay." },
    },
    required: ["score", "feedback", "improvedEssay", "improvedScore"],
  };

  const text = await fetchWithRetry({
    contents: [{ role: "user", parts }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  return JSON.parse(text);
};
