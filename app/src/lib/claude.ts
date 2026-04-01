export async function generateNewConcepts(
  videoAnalysis: string,
  newConceptsPrompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

  const prompt = `# ROLE
You're an expert in creating viral Reels on Instagram.

# OBJECTIVE
Take as input viral video from my competitor and based on it generate new concepts for me. Adapt this reference for me.

# REFERENCE VIDEO DESCRIPTION
------
${videoAnalysis}
------

# MY INSTRUCTIONS FOR NEW CONCEPTS
------
${newConceptsPrompt}
------

# BEGIN YOUR WORK`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini concepts generation error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}
