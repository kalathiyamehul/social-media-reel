import type { Video } from "./types";

export async function mixVideoConcepts(videos: Video[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

  const videoContexts = videos.map((v, i) => `
### VIDEO ${i + 1} (@${v.creator})
---
# ANALYSIS
${v.analysis}

# CONCEPTS
${v.newConcepts}
---
`).join("\n");

  const prompt = `# ROLE
You're a Creative Director for a high-end Instagram Reels agency. You specialize in "Concept Synthesis" – merging successful viral patterns into new, hybrid strategies.

# OBJECTIVE
You are given ${videos.length} successful video analyses and their associated concepts. 
Your goal is to "Mix" these concepts to create ONE superior "Hybrid Viral Concept".

# RULES FOR MIXING
1. **HOOK FUSION**: Combine the most disruptive hook element from the videos (e.g., Video 1's visual mystery + Video 2's direct text-on-screen).
2. **RETENTION BLEND**: Use the best management of flow/pacing from the source videos.
3. **STRATEGY SYNERGY**: Create a concept that feels like a natural evolution of all input styles.
4. **BRAND ALIGNMENT**: Keep the focus on high-end, premium aesthetics (Diorin/Palmonas context).

# INPUT VIDEOS
${videoContexts}

# OUTPUT FORMAT
Generate a single, detailed concept following this structure:

# HYBRID CONCEPT: [Catchy Title]
General description of why this specific mix works.

## HOOK
- **VISUAL**: What happens in the first 2 seconds.
- **TEXT**: The on-screen hook text.
- **AUDIO**: Music/SFX choice.
- **RATIONALE**: Why this fused hook is superior.

## STRUCTURE & RETENTION
Step-by-step flow of the reel, mixing the strategies.

## THE PAYOFF (REWARD)
What the viewer gets at the end.

## SCRIPT
Detailed, cinematic script for this hybrid reel.

# BEGIN SYNTHESIS`;

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
        temperature: 0.8,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini synthesis error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}
