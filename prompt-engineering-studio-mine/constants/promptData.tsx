
import React from 'react';
import type { ContentBlock } from '../types';

export const introductionContent: ContentBlock = {
  id: 'intro',
  title: 'Welcome to the Prompt Engineering Studio!',
  description: (
    <>
      <p className="mb-4">
        Welcome! This Studio is your comprehensive toolkit for mastering Prompt Engineering – the art and science of crafting highly effective inputs (prompts) to guide Artificial Intelligence (AI) models, like Large Language Models (LLMs), towards precisely the outputs you desire. Whether you're new to AI or looking to refine your skills, understanding how to structure your requests is crucial for unlocking AI's full potential.
      </p>
      <p className="mb-4">
        Effective prompt engineering isn't just about asking questions; it's about providing clear instructions, relevant context, and specific constraints. It involves thinking strategically about how an AI processes information and how you can guide that process. This studio will walk you through foundational principles, diverse prompt types, common use cases, and advanced strategies to help you achieve significantly better results in your AI interactions.
      </p>
      <p className="mb-4">
        Below, you'll find an example of a sophisticated "meta-prompt" similar to what powers our Playground section. This illustrates the level of detail and structure that can transform a simple idea into a powerful instruction for an AI:
      </p>
      <p className="mb-4">
        <em className="text-gray-400">"You are the AI Prompt Engineering Genius Toolkit. Your sole purpose is to transform a user-provided basic idea or simple prompt into a comprehensive, highly structured, and exceptionally specific prompt designed to yield outputs from another AI that are significantly (ideally 10x) more effective, insightful, accurate, and targeted than the original input would achieve.</em>

        <strong className="text-blue-300 block mt-2">Your Task:</strong>
        <em className="text-gray-400">Receive the user's simple idea or base prompt. Analyze its core intent. Identify areas lacking detail, context, structure, or constraints. Then, meticulously rewrite and expand it into a sophisticated prompt using the following principles:</em>

        1.  <strong className="text-blue-300">Define Clear Role/Persona:</strong> <em className="text-gray-400">Assign a specific, relevant role or persona to the target AI if appropriate for the task.</em>
        2.  <strong className="text-blue-300">Specify the Task with Detail:</strong> <em className="text-gray-400">Break down the task into clear steps or components if necessary. Use strong, unambiguous action verbs.</em>
        3.  <strong className="text-blue-300">Add Essential Context:</strong> <em className="text-gray-400">Include relevant background information, parameters, or scenario details required for an accurate and useful response.</em>
        4.  <strong className="text-blue-300">Incorporate Specific Constraints:</strong> <em className="text-gray-400">Define limitations or requirements such as: Length, Format, Style, Tone, Negative Constraints.</em>
        5.  <strong className="text-blue-300">Define Desired Output:</strong> <em className="text-gray-400">Describe the expected outcome in detail.</em>
        6.  <strong className="text-blue-300">Suggest Chain-of-Thought/Examples (If Applicable):</strong> <em className="text-gray-400">Include instructions for the AI to show its work or provide examples.</em>
        7.  <strong className="text-blue-300">Ensure Clarity and Unambiguity:</strong> <em className="text-gray-400">Every instruction should be easy to understand.</em>

        <strong className="text-blue-300 block mt-2">Input:</strong> <em className="text-gray-400">The user will provide a simple statement or short prompt.</em>
        <strong className="text-blue-300 block mt-2">Output:</strong> <em className="text-gray-400">Provide *only* the generated, enhanced, highly detailed, and structured prompt."</em>
      </p>
      <h4 className="text-lg font-semibold text-blue-300 mt-6 mb-2">Why is Prompt Engineering Important?</h4>
      <ul className="list-disc list-inside space-y-1 text-gray-300">
        <li><span className="font-medium text-blue-400">Improved Model Performance:</span> Well-crafted prompts lead to more accurate, relevant, and informative outputs.</li>
        <li><span className="font-medium text-blue-400">Reduced Bias & Harmful Responses:</span> Careful prompting helps mitigate bias and minimize undesirable content.</li>
        <li><span className="font-medium text-blue-400">Increased Control & Predictability:</span> Gain better control over AI behavior for consistent and desired outcomes.</li>
        <li><span className="font-medium text-blue-400">Enhanced User Experience:</span> Clear prompts make AI interactions more intuitive and satisfying.</li>
      </ul>
    </>
  ),
};

export const understandingPromptsContent: ContentBlock = {
    id: 'understanding',
    title: 'Crafting Effective Prompts',
    description: 'Understanding the model\'s capabilities and preferred format is essential. Here are key elements:',
    subItems: [
        {
            id: 'clarity-specificity',
            title: 'Clarity and Specificity',
            details: (
              <>
                <p>The cornerstone of any good prompt is absolute clarity and a high degree of specificity. Avoid ambiguity at all costs. Vague language, undefined terms, or implicit assumptions will often lead the AI to generate generic, irrelevant, or incorrect responses.</p>
                <p className="mt-2">
                  <span className="font-semibold text-blue-400">Clarity</span> means using precise vocabulary and structuring your sentences so there's only one likely interpretation. Clearly state what you want the AI to *do* (the task) and *what* the output should be.
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-blue-400">Specificity</span> involves providing sufficient detail, context, constraints (like format, length, tone, style), and even examples if necessary. The more specific your prompt, the better the AI can understand your exact needs and tailor its output accordingly. Think of it as providing a detailed blueprint rather than a vague sketch.
                </p>
              </>
            )
        },
        {
            id: 'context-examples',
            title: 'Context and Examples',
            details: 'Providing context and relevant examples helps the AI understand the task and generate more accurate outputs. For instance, if you\'re looking for a creative story, including a few sentences describing the desired tone or theme can significantly improve results.'
        },
        {
            id: 'fine-tuning',
            title: 'Fine-tuning and Adapting',
            details: 'Fine-tuning the AI model on specific tasks or domains using tailored prompts can enhance its performance. Adapting prompts based on user feedback or model outputs can further improve responses over time.'
        },
        {
            id: 'multi-turn',
            title: 'Multi-turn Conversations',
            details: 'Designing prompts for multi-turn conversations allows users to engage in continuous and context-aware interactions with the AI, enhancing the overall user experience by building upon previous exchanges.'
        }
    ]
};

export const promptTypesContent: ContentBlock[] = [
  {
    id: 'direct-zero-shot',
    title: 'Direct Prompts (Zero-shot)',
    description: 'Zero-shot prompting involves providing the model with a direct instruction or question without any additional context or examples specific to the immediate task.',
    details: (
      <>
        <p>This relies on the model's pre-trained knowledge to understand and execute the task.</p>
        <p className="mt-2"><span className="font-semibold text-blue-400">Examples:</span> Idea generation (e.g., "Generate creative ideas for a sustainable product"), summarization ("Summarize this article about renewable energy"), or translation ("Translate 'Hello, world' to French").</p>
      </>
    ),
  },
  {
    id: 'few-shot',
    title: 'One-, Few-, and Multi-shot Prompts',
    description: 'This method involves providing the model with one or more examples (shots) of the desired input-output pairs before presenting the actual prompt.',
    details: (
        <>
            <p>This helps the model better understand the task, expected format, and style, leading to more accurate responses.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
                <li><span className="font-semibold text-blue-400">One-shot:</span> One example.</li>
                <li><span className="font-semibold text-blue-400">Few-shot:</span> A small number of examples (typically 2-5).</li>
                <li><span className="font-semibold text-blue-400">Multi-shot:</span> Many examples, often used for fine-tuning.</li>
            </ul>
        </>
    )
  },
  {
    id: 'cot',
    title: 'Chain of Thought (CoT) Prompts',
    description: 'CoT prompting encourages the model to break down complex reasoning into a series of intermediate steps, leading to a more comprehensive and well-structured final output.',
    details: 'Instead of just asking for the answer, you ask the model to "think step by step" or show its reasoning process. This is particularly useful for arithmetic, commonsense reasoning, and symbolic reasoning tasks.'
  },
  {
    id: 'zero-shot-cot',
    title: 'Zero-shot CoT Prompts',
    description: 'Combines Chain of Thought prompting with Zero-shot prompting by simply appending "Let\'s think step by step" or a similar phrase to the original zero-shot prompt.',
    details: 'This simple addition can surprisingly improve the model\'s reasoning ability without needing explicit examples of the thought process.'
  },
];

export const useCasesContent: ContentBlock[] = [
  {
    id: 'text-generation',
    title: 'Language and Text Generation',
    description: 'Crafting prompts for various text-based tasks.',
    subItems: [
      { id: 'creative-writing', title: 'Creative Writing', details: 'Specify genre, tone, style, and plot points.', examplePrompt: "Write a short, suspenseful story (around 300 words) about a young woman who discovers a magical, glowing portal in her attic during a thunderstorm. The tone should be mysterious and slightly ominous." },
      { id: 'summarization', title: 'Summarization', details: 'Instruct the AI to generate concise summaries capturing key information.', examplePrompt: "Summarize the main arguments and key findings of the following news article on recent advancements in AI ethics in three bullet points." },
      { id: 'translation', title: 'Translation', details: 'Specify source and target languages, ensuring meaning and context are preserved.', examplePrompt: "Translate the following business email from English to professional German, maintaining a formal tone: 'Dear Mr. Schmidt, We are pleased to confirm our meeting for next Tuesday at 10 AM. Please let us know if this time still works for you. Best regards, Jane Doe.'" },
      { id: 'dialogue', title: 'Dialogue Generation', details: 'Design prompts that simulate conversations, maintaining context.', examplePrompt: "You are 'TechHelper', a friendly and patient AI chatbot assisting users with software issues. A user says: 'My photo editing app keeps crashing when I try to open large files.' Respond empathetically and ask for more details to help troubleshoot." },
    ],
  },
  {
    id: 'qa',
    title: 'Question Answering',
    description: 'Formulating prompts for different types of questions.',
    subItems: [
      { id: 'open-ended-qa', title: 'Open-Ended Questions', details: 'Encourage comprehensive answers based on AI\'s knowledge.', examplePrompt: "Explain the concept of blockchain technology, its key components, and its potential impact on various industries beyond cryptocurrency. Provide at least three distinct examples." },
      { id: 'specific-qa', title: 'Specific Questions', details: 'Target specific information from provided context or internal knowledge.', examplePrompt: "According to the provided scientific paper (imagine paper is attached), what were the primary limitations acknowledged by the researchers in their study on X?" },
      { id: 'mcq-qa', title: 'Multiple Choice Questions', details: 'Prompt AI to analyze options and select the most appropriate answer.', examplePrompt: "Which of the following is NOT a primary greenhouse gas? A) Carbon Dioxide, B) Methane, C) Oxygen, D) Nitrous Oxide. Explain your choice." },
      { id: 'hypothetical-qa', title: 'Hypothetical Questions', details: 'Explore hypothetical situations, allowing AI to reason and speculate.', examplePrompt: "Imagine a scenario where universal basic income (UBI) is implemented globally. What are three potential positive and three potential negative socio-economic consequences? Provide brief reasoning for each." },
      { id: 'opinion-qa', title: 'Opinion-Based Questions (with caveats)', details: 'Elicit AI\'s "perspective" (as a simulation) with reasoning. Note: AIs don\'t have personal opinions but can synthesize information to form a reasoned stance.', examplePrompt: "Discuss the ethical considerations of using AI in hiring processes. Present arguments for and against, and conclude with a balanced perspective on responsible implementation." },
    ],
  },
  {
    id: 'code-generation',
    title: 'Code Generation',
    description: 'Guiding AI in various coding tasks.',
    subItems: [
      { id: 'code-completion', title: 'Code Completion', details: 'Provide partial code and prompt AI to complete it.', examplePrompt: "Complete the following Python function that takes a list of numbers and returns a new list containing only the even numbers:\n```python\ndef get_even_numbers(numbers):\n  # Your code here\n```" },
      { id: 'code-translation', title: 'Code Translation', details: 'Specify source and target languages, preserving functionality.', examplePrompt: "Translate the following Python code snippet to JavaScript, ensuring equivalent functionality. The Python code calculates the sum of an array:\n```python\ndef sum_array(arr):\n  total = 0\n  for x in arr:\n    total += x\n  return total\n```" },
      { id: 'code-optimization', title: 'Code Optimization', details: 'Prompt AI to analyze code and suggest improvements.', examplePrompt: "Analyze the following Python code for calculating Fibonacci numbers recursively. Identify potential performance bottlenecks and suggest an optimized version, explaining the improvements.\n```python\ndef fib_recursive(n):\n  if n <= 1:\n    return n\n  else:\n    return fib_recursive(n-1) + fib_recursive(n-2)\n```" },
      { id: 'code-debugging', title: 'Code Debugging', details: 'Provide code with errors and prompt AI to identify and suggest solutions.', examplePrompt: "The following Java code is supposed to read a file line by line, but it throws a NullPointerException. Identify the bug, explain its cause, and provide the corrected code.\n[Paste buggy Java code here]" },
    ],
  },
  {
    id: 'image-generation',
    title: 'Image Generation',
    description: 'Crafting prompts for AI image generators.',
    subItems: [
      { id: 'photorealistic-img', title: 'Photorealistic Images', details: 'Describe desired image in detail (objects, scenery, lighting, style).', examplePrompt: "A highly detailed, photorealistic image of a majestic snow leopard resting on a rocky outcrop in the Himalayas during a golden hour sunset. The lighting should be warm and dramatic, highlighting the texture of its fur. Shot with a telephoto lens, shallow depth of field." },
      { id: 'artistic-img', title: 'Artistic Images', details: 'Specify art styles, techniques, and subject matter.', examplePrompt: "An impressionist painting capturing the vibrant chaos of a bustling Parisian street market on a rainy afternoon. Focus on reflections on wet cobblestones and blurred figures with colorful umbrellas. Style of Monet." },
      { id: 'abstract-img', title: 'Abstract Images', details: 'Encourage AI to generate images open to interpretation using shapes, colors, textures.', examplePrompt: "An abstract digital artwork representing the concept of 'serendipity'. Use flowing, interconnected lines in shades of teal and gold, with soft, glowing light sources. Evoke a feeling of unexpected discovery." },
      { id: 'image-editing-img', title: 'Image Editing', details: 'Provide an image and specify desired modifications.', examplePrompt: "(Assuming an image is provided) \"For the uploaded image of a cat sitting on a chair: Change the background to a lush, green forest. Add a whimsical, small butterfly resting on the cat's nose. Ensure the lighting on the cat matches the new forest background.\"" },
    ],
  },
];

export const strategiesContent: ContentBlock[] = [
  {
    id: 'clear-goals',
    title: '1. Set Clear Goals and Objectives',
    description: 'Define precisely what you want the AI to achieve.',
    subItems: [
        { id: 'action-verbs', title: 'Use action verbs', details: 'Specify the desired action clearly.', examplePrompt: "Generate a bulleted list summarizing the key advantages of renewable energy sources over fossil fuels."},
        { id: 'define-format', title: 'Define the desired length and format', details: 'Be explicit about output structure.', examplePrompt: "Compose a 250-word product description for a new ergonomic office chair, highlighting its three main benefits. Format as three short paragraphs."},
        { id: 'target-audience', title: 'Specify the target audience', details: 'Tailor the language and tone.', examplePrompt: "Explain the concept of photosynthesis in simple terms suitable for a 5th-grade student. Use an analogy to help understanding."}
    ]
  },
  {
    id: 'provide-context',
    title: '2. Provide Context and Background Information',
    description: 'Give the AI the necessary information to understand the request fully.',
    subItems: [
        { id: 'facts-data', title: 'Include relevant facts and data', details: 'Ground the AI with specifics.', examplePrompt: "Given that the global average internet speed is X Mbps and our target market has an average of Y Mbps, propose three strategies to optimize our web application for faster loading times in this market."},
        { id: 'reference-sources', title: 'Reference specific sources or documents', details: '(If applicable) Guide the AI to use provided materials.', examplePrompt: "Based on the attached Q3 financial report, identify the top three revenue-generating product lines and analyze their growth trends compared to Q2."},
        { id: 'define-terms', title: 'Define key terms and concepts', details: 'Ensure understanding, especially for niche topics.', examplePrompt: "Explain the concept of 'Decentralized Autonomous Organizations (DAOs)' in the context of blockchain technology. Define what a DAO is, how it typically operates, and one potential use case."}
    ]
  },
  {
    id: 'few-shot-strategy',
    title: '3. Use Few-Shot Prompting Effectively',
    description: 'Provide examples to guide the AI on style, format, and content.',
    subItems: [
        { id: 'input-output-pairs', title: 'Provide input-output pairs', details: 'Show the AI exactly what kind of transformation you expect.', examplePrompt: `Translate the following sentences from English to French:\nEnglish: "Hello, how are you?"\nFrench: "Bonjour, comment ça va?"\nEnglish: "I am learning to code."\nFrench: "J'apprends à coder."\nEnglish: "The weather is nice today."\nFrench:`},
        { id: 'demonstrate-style', title: 'Demonstrate the desired style or tone', details: 'Examples can convey nuances better than descriptions.', examplePrompt: `Rewrite the following customer complaint in a polite and empathetic tone.\nOriginal: "Your app is terrible and it never works!"\nEmpathetic Rewrite: "I understand you're experiencing some frustration with the app, and I'm sorry to hear it's not working as expected. Could you tell me more about the specific issues?"\nOriginal: "This product broke after one day, I want a refund NOW!"\nEmpathetic Rewrite:`},
        { id: 'show-detail-level', title: 'Show the desired level of detail', details: 'Illustrate how concise or expansive the output should be.', examplePrompt: `Summarize the following paragraph in one sentence.\nParagraph: [Long paragraph about a historical event]\nOne-sentence summary: [Concise summary of the event]\nParagraph: [Another long paragraph]\nOne-sentence summary:`}
    ]
  },
   {
    id: 'be-specific',
    title: '4. Be Specific and Unambiguous',
    description: 'Clarity avoids misinterpretation and leads to more accurate results.',
    subItems: [
        { id: 'precise-language', title: 'Use precise language', details: 'Avoid vague terms. Be direct.', examplePrompt: `Instead of: "Tell me about dogs."\nUse: "List five common dog breeds known for being good family pets and briefly describe the typical temperament of each."`},
        { id: 'quantify-requests', title: 'Quantify your requests', details: 'Use numbers when possible.', examplePrompt: `Instead of: "Write a short article."\nUse: "Write an article of approximately 300 words about the benefits of regular exercise."`},
        { id: 'break-down-tasks', title: 'Break down complex tasks', details: 'Divide a large request into smaller, manageable steps.', examplePrompt: `Instead of: "Create a marketing campaign."\nUse: "Develop a marketing campaign proposal for a new vegan protein bar. Include: \n1. Target audience profile (age, interests, lifestyle).\n2. Three key marketing messages.\n3. Suggested marketing channels (social media, influencers, etc.).\n4. Two unique promotional ideas."`}
    ]
  },
  {
    id: 'iterate-experiment',
    title: '5. Iterate and Experiment',
    description: 'Prompt engineering is often an iterative process.',
    details: (
        <ul className="list-disc list-inside space-y-1">
            <li><span className="font-semibold text-blue-400">Try different phrasings and keywords:</span> Rephrase your prompt using synonyms or alternative sentence structures. Small changes can have big impacts.</li>
            <li><span className="font-semibold text-blue-400">Adjust the level of detail and specificity:</span> Add or remove information to fine-tune the output.</li>
            <li><span className="font-semibold text-blue-400">Test different prompt lengths:</span> Experiment with both shorter, concise prompts and longer, more detailed ones to find the optimal balance for your task.</li>
            <li><span className="font-semibold text-blue-400">Analyze outputs and refine:</span> Pay attention to what the AI generates. If it's not what you want, revise your prompt and try again.</li>
        </ul>
    )
  },
  {
    id: 'leverage-cot',
    title: '6. Leverage Chain of Thought (CoT) Prompting for Complex Tasks',
    description: 'Encourage the AI to "think step by step" for better reasoning.',
     subItems: [
        { id: 'encourage-step-by-step', title: 'Encourage step-by-step reasoning', details: 'Explicitly ask the AI to break down its process.', examplePrompt: "Solve this word problem by showing your steps: A train leaves City A at 2:00 PM traveling at 60 mph. Another train leaves City B at 3:00 PM traveling towards City A at 80 mph. If City A and City B are 410 miles apart, at what time will they meet? Let's think step by step."},
        { id: 'ask-for-explanation', title: 'Ask the model to explain its reasoning', details: 'This helps in understanding the AI\'s "thought process" and can improve result quality.', examplePrompt: "Classify the sentiment of the following movie review as positive, negative, or neutral, and explain your reasoning: 'While the visuals were stunning, the plot felt underdeveloped and the ending was abrupt.'"},
        { id: 'guide-logical-sequence', title: 'Guide the model through a logical sequence', details: 'For complex decision-making, outline the thought process.', examplePrompt: "To determine if this research paper is relevant to my study on 'AI in healthcare diagnostics', please consider the following and explain your findings for each: 1. Does the abstract mention diagnostics or imaging? 2. Are the methodologies described related to machine learning or deep learning? 3. Is the publication date within the last 3 years? Based on this, is it highly relevant, moderately relevant, or not relevant?"}
    ]
  }
];

export const furtherGuidanceContent: ContentBlock = {
    id: 'further-guidance',
    title: 'Further Guidance',
    description: (
        <p>
            For more in-depth strategies and best practices, especially within the Google Cloud ecosystem,
            exploring resources like the "Five Best Practices for Prompt Engineering on Google Cloud"
            can provide valuable insights. (Note: This is a general reference, specific links may vary over time).
        </p>
    )
};
