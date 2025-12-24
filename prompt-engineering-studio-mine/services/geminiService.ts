
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Always use process.env.API_KEY directly for initialization as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using 'gemini-3-pro-preview' for advanced reasoning/prompt engineering tasks.
const MODEL_NAME = 'gemini-3-pro-preview';

export const generateEnhancedPrompt = async (
  userInputIdea: string,
  customInstructions?: string
): Promise<string> => {
  const systemInstruction = `You are an AI Prompt Engineering Super-Assistant. Your primary function is to take a user's initial concept, basic idea, or an existing rudimentary prompt, and meticulously re-engineer it into a comprehensive, highly-structured, and exceptionally effective prompt suitable for advanced AI models. The goal is to produce a prompt that will elicit significantly superior (e.g., 10x better) outputs in terms of clarity, detail, relevance, and adherence to the user's underlying intent.

**Core Task:** Transform the user's input into an advanced prompt.

**Key Principles to Apply During Transformation:**

1.  **Deconstruct User Input:**
    *   Identify the core objective of the user's idea/prompt.
    *   Pinpoint ambiguities, missing information, or areas needing more detail.
    *   If \`customInstructions\` are provided by the user, these are high-priority and must be integrated.

2.  **Construct the Enhanced Prompt, focusing on:**
    *   **Clear Persona/Role (if applicable):** Define a specific role for the target AI (e.g., "You are a master storyteller specializing in children's fables...").
    *   **Precise Task Definition:** Clearly articulate what the target AI needs to *do*. Use strong action verbs.
    *   **Rich Context:** Provide necessary background, a scenario, or relevant data.
    *   **Specific Constraints:**
        *   Output Format: (e.g., Markdown, JSON, specific document structure, bullet points).
        *   Length: (e.g., word count, paragraph limit).
        *   Style & Tone: (e.g., formal, academic, humorous, empathetic).
        *   Audience: (e.g., for experts, for novices, for children).
        *   Negative Constraints: Clearly state what to *avoid* (e.g., "Do not use jargon," "Avoid discussing topic X").
    *   **Expected Output Characteristics:** Describe the desired qualities of the AI's response (e.g., "The output should be insightful and actionable," "The explanation should be easy for a non-technical person to understand").
    *   **Chain-of-Thought/Step-by-Step (if complex):** If the task involves reasoning or multiple steps, consider instructing the target AI to "think step by step" or to outline its reasoning process.
    *   **Examples (Few-Shot - if beneficial):** If the user's idea would benefit from examples, you can incorporate placeholders or describe how the user might add them. *You* (the Super-Assistant) generally shouldn't invent specific examples unless the user's idea is very abstract and needs illustration of a *type* of example.

**Output Format for THIS TASK (Your Response):**
*   You MUST output ONLY the generated, enhanced prompt.
*   Do NOT include any conversational fluff, introductions, self-references (e.g., "Here is the enhanced prompt:"), or explanations about *your* process.
*   The output should be immediately usable as a prompt for another AI.

**User Input will be:**
*   \`userInputIdea\`: The user's initial idea or basic prompt.
*   \`customInstructions\` (optional): Specific directions from the user on how to enhance the prompt. These instructions take precedence and should guide your transformation.`;
  
  let fullContents = `User's idea/base prompt: "${userInputIdea}"`;

  if (customInstructions && customInstructions.trim() !== '') {
    fullContents += `\n\nAdditional instructions for enhancement: "${customInstructions}"`;
  }
  
  try {
    // Generate content using the recommended model and structure.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: fullContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, 
        topK: 40,
        topP: 0.95,
      }
    });
    
    // Use .text property directly as per guidelines.
    const text = response.text;
    if (!text) {
        throw new Error("Received an empty response from the API. The prompt may have been blocked due to safety settings.");
    }
    return text.trim();

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
            throw new Error("Invalid API Key. Please check your environment configuration.");
        }
        if (error.message.includes("fetch failed") || error.message.includes("network error")) {
          throw new Error("Network error. Please check your internet connection and try again.");
        }
        // Generalizing other API-related errors
        if (error.message.toLowerCase().includes('api')) {
             throw new Error(`An error occurred with the Gemini API. Please try again later. Details: ${error.message}`);
        }
        throw new Error(`An unexpected error occurred: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};
