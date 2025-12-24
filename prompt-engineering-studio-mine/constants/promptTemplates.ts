import type { TemplateCategory } from '../types';

export const promptTemplateCategories: TemplateCategory[] = [
  {
    id: 'content-creation',
    name: 'Content Creation',
    templates: [
      {
        title: 'SEO-Optimized Blog Post Generator',
        useCase: 'To generate a comprehensive, well-structured, and SEO-friendly blog post from a core topic.',
        description: 'This template guides the AI to act as an expert content creator and SEO specialist. It breaks down the task into clear sections, ensuring the final output includes a compelling title, introduction, structured body, and conclusion. By specifying the target audience and keywords, you ensure the content is both engaging and discoverable.',
        variables: [
            { name: '[Topic]', description: 'The primary subject of the blog post.' },
            { name: '[Target_Audience]', description: 'The specific group of people you are writing for (e.g., "Beginner gardeners," "Expert software developers").' },
            { name: '[Primary_Keyword]', description: 'The main SEO keyword to focus on.' },
            { name: '[Secondary_Keywords]', description: '2-3 related keywords to include naturally.' },
            { name: '[Tone_of_Voice]', description: 'The desired style of writing (e.g., "Informative and professional," "Casual and humorous," "Empathetic and supportive").' },
            { name: '[Desired_Length]', description: 'The target word count for the article (e.g., "approximately 1200 words").' },
        ],
        template: `Act as an expert SEO content strategist and writer. Your task is to write a comprehensive, engaging, and SEO-optimized blog post.

**Topic:** [Topic]
**Target Audience:** [Target_Audience]
**Primary Keyword:** [Primary_Keyword]
**Secondary Keywords:** [Secondary_Keywords]
**Tone of Voice:** [Tone_of_Voice]
**Desired Length:** [Desired_Length]

Please structure the article as follows:
1.  **Catchy Title:** Create 5 title options that are engaging and include the [Primary_Keyword].
2.  **Introduction:** A compelling opening (approx. 100-150 words) that hooks the reader, addresses a pain point related to the [Topic], and states what they will learn.
3.  **Main Body:**
    *   Create 3-5 main sections with clear H2 headings.
    *   Each section should cover a key aspect of the [Topic].
    *   Naturally integrate the [Primary_Keyword] and [Secondary_Keywords] throughout the body, without keyword stuffing.
    *   Use bullet points or numbered lists where appropriate to improve readability.
4.  **Conclusion:** A concise summary (approx. 100 words) of the key takeaways and a call-to-action or a final thought-provoking question for the reader.

Ensure the final output is well-written, factually accurate (where applicable), and perfectly aligned with the specified tone and audience.`
      },
      {
        title: 'Compelling Social Media Campaign',
        useCase: 'To generate a multi-platform social media campaign plan for a product, event, or announcement.',
        description: 'This template helps you create a cohesive social media strategy. It prompts the AI to act as a social media manager, generating tailored content for different platforms, complete with hashtags and post schedules, ensuring a consistent message that resonates with your audience.',
        variables: [
            { name: '[Product/Event/Announcement]', description: 'The subject of the campaign.' },
            { name: '[Target_Audience]', description: 'The demographic and interests of your audience (e.g., "Tech-savvy millennials aged 25-35").' },
            { name: '[Campaign_Goal]', description: 'The primary objective (e.g., "Drive traffic to our website," "Increase brand awareness," "Generate ticket sales").' },
            { name: '[Key_Message]', description: 'The single most important takeaway for the audience.' },
            { name: '[Campaign_Duration]', description: 'The length of the campaign (e.g., "1 week," "1 month").' },
        ],
        template: `Act as a senior social media marketing manager. Your task is to develop a comprehensive social media campaign plan.

**Campaign Subject:** [Product/Event/Announcement]
**Target Audience:** [Target_Audience]
**Primary Goal:** [Campaign_Goal]
**Core Message:** [Key_Message]
**Campaign Duration:** [Campaign_Duration]

Please generate the following campaign assets:

1.  **Campaign Slogan/Tagline:** Create 3 catchy and memorable taglines for the campaign.
2.  **Content Plan by Platform:**
    *   **Twitter/X (3 posts):** Write three concise and engaging tweets. Include relevant hashtags and a clear call-to-action.
    *   **Instagram (2 posts):** Describe two visually compelling post ideas (e.g., a carousel, a Reel). Write the caption for each, including engaging questions and relevant hashtags.
    *   **LinkedIn (1 post):** Write one professional post that highlights the value proposition or significance of the campaign subject for a business-oriented audience.
3.  **Hashtag Strategy:** Provide a list of 5 primary and 5 secondary hashtags to use across all platforms.
4.  **Posting Schedule:** Suggest a simple posting schedule for the first week of the campaign (e.g., "Monday: Announce on all platforms. Wednesday: Post Instagram Reel. Friday: Share Twitter thread.").`
      }
    ]
  },
  {
    id: 'summarization-analysis',
    name: 'Summarization & Analysis',
    templates: [
      {
        title: 'Meeting Notes Summarizer & Action Item Extractor',
        useCase: 'To distill long meeting transcripts or notes into a concise summary with clear action items.',
        description: 'This template is perfect for improving productivity. It instructs the AI to process a block of text, identify the key decisions made, and clearly list out the action items, assigning them to the correct individuals. This saves time and ensures accountability.',
        variables: [
            { name: '[Meeting_Topic]', description: 'The subject of the meeting (e.g., "Q3 Marketing Strategy Review").' },
            { name: '[Attendees]', description: 'A list of people present in the meeting.' },
            { name: '[Transcript_or_Notes]', description: 'The full, unedited text from the meeting.' },
        ],
        template: `Act as a highly efficient executive assistant. Your task is to summarize the following meeting notes and extract all action items.

**Meeting Topic:** [Meeting_Topic]
**Attendees:** [Attendees]

**Raw Meeting Notes / Transcript:**
"""
[Transcript_or_Notes]
"""

Please provide the output in the following format:

**1. Executive Summary:**
A brief, one-paragraph summary of the key discussion points, decisions made, and overall outcome of the meeting.

**2. Key Decisions:**
A bulleted list of the most important decisions finalized during the meeting.
- [Decision 1]
- [Decision 2]
- [...]

**3. Action Items:**
A table with three columns: "Action Item," "Owner(s)," and "Deadline." List all tasks that were assigned. If a deadline was not mentioned, write "Not specified."

| Action Item | Owner(s) | Deadline |
|---|---|---|
| | | |
| | | |`
      },
      {
        title: 'Customer Feedback Sentiment Analysis',
        useCase: 'To analyze customer feedback and categorize it by sentiment, identifying key themes.',
        description: 'This powerful template helps you quickly gauge customer opinion. The AI analyzes reviews, support tickets, or survey responses, determines the sentiment (Positive, Negative, Neutral), and extracts the core reasons for that sentiment, providing actionable insights.',
        variables: [
            { name: '[Product/Service_Name]', description: 'The product or service the feedback is about.' },
            { name: '[Customer_Feedback_List]', description: 'A list of customer comments, reviews, or feedback entries, separated by new lines.' },
        ],
        template: `Act as a data analyst specializing in customer experience. Your task is to perform a sentiment analysis on the provided customer feedback for [Product/Service_Name] and identify key themes.

**Instructions:**
For each piece of feedback provided below, please categorize its sentiment as "Positive," "Negative," or "Neutral." Then, provide a one-sentence summary of the main reason for the user's sentiment. After analyzing all feedback, provide an overall summary of the most common positive and negative themes.

**Customer Feedback:**
"""
[Customer_Feedback_List]
"""

**Analysis Output:**

**Individual Feedback Analysis:**
- **Feedback 1:**
  - **Sentiment:** [Positive/Negative/Neutral]
  - **Reason:** [One-sentence summary]
- **Feedback 2:**
  - **Sentiment:** [Positive/Negative/Neutral]
  - **Reason:** [One-sentence summary]
- **[Continue for all feedback items]**

**Overall Summary:**
*   **Top Positive Themes:** [List 2-3 common points of praise]
*   **Top Negative Themes:** [List 2-3 common points of criticism or areas for improvement]`
      }
    ]
  },
  {
    id: 'code-generation-debugging',
    name: 'Code Generation & Debugging',
    templates: [
      {
        title: 'Versatile Code Function Generator',
        useCase: 'To generate a well-documented and robust function in a specified programming language.',
        description: 'This template streamlines the process of writing code. It asks the AI to act as a senior software engineer, ensuring the generated code is not only functional but also includes clear comments, docstrings, and error handling. It\'s a great way to produce high-quality, reusable code snippets.',
        variables: [
            { name: '[Programming_Language]', description: 'The language for the function (e.g., "Python," "JavaScript," "Java").' },
            { name: '[Function_Purpose]', description: 'A clear description of what the function should do.' },
            { name: '[Input_Parameters]', description: 'The inputs the function will take, including their expected data types.' },
            { name: '[Return_Value]', description: 'The output the function should return, including its data type.' },
            { name: '[Specific_Requirements]', description: 'Any special constraints or libraries to use (e.g., "Must be recursive," "Use the Pandas library," "Handle edge case of an empty list").' },
        ],
        template: `Act as a senior software engineer with expertise in writing clean, efficient, and well-documented code. Your task is to generate a function based on the following specifications.

**Programming Language:** [Programming_Language]
**Function Purpose:** [Function_Purpose]
**Input Parameters:** [Input_Parameters]
**Expected Return Value:** [Return_Value]
**Specific Requirements or Edge Cases to Handle:** [Specific_Requirements]

Please provide the following:
1.  **The complete code for the function.**
2.  **A comprehensive docstring or comment block** that explains what the function does, its parameters, and what it returns, following the best practices for the specified language.
3.  **Inline comments** for any complex or non-obvious lines of code.
4.  **A simple example** demonstrating how to use the function.`
      },
      {
        title: 'Code Explainer & Debugger',
        useCase: 'To understand, get an explanation for, or debug a piece of provided code.',
        description: 'This template is an invaluable tool for both learning and problem-solving. It instructs the AI to analyze a code snippet, explain its functionality in plain English, and identify any potential bugs or areas for optimization. It can turn complex code into an understandable lesson.',
        variables: [
            { name: '[Programming_Language]', description: 'The language of the code snippet.' },
            { name: '[Code_Snippet]', description: 'The block of code you want to be analyzed.' },
            { name: '[Specific_Question_or_Error]', description: 'Your specific question (e.g., "What does this do?", "Why am I getting a NullPointerException?", "How can I make this faster?").' },
        ],
        template: `Act as an expert code reviewer and debugger. I will provide you with a code snippet and a specific question or error message. Your task is to analyze the code and provide a clear, helpful response.

**Programming Language:** [Programming_Language]

**Code Snippet:**
\`\`\`[Programming_Language]
[Code_Snippet]
\`\`\`

**My Question / Error Message:** "[Specific_Question_or_Error]"

Please provide your analysis in the following structured format:

1.  **High-Level Explanation:** In simple terms, what is the purpose of this code? What is it trying to achieve?

2.  **Step-by-Step Breakdown:** Go through the code line-by-line or block-by-block and explain what each part does.

3.  **Bug Identification / Answer to Question:**
    *   Directly address my question or explain the cause of the error.
    *   If there is a bug, identify the exact line(s) causing the issue and explain *why* it is a bug.

4.  **Suggested Correction / Improvement (if applicable):**
    *   Provide the corrected code snippet.
    *   If the code can be optimized for performance or readability, provide the improved version and explain the benefits of the changes.`
      }
    ]
  },
  {
    id: 'business-productivity',
    name: 'Business & Productivity',
    templates: [
      {
        title: 'Professional Email Drafter',
        useCase: 'To draft a clear, professional, and effective email for a specific purpose.',
        description: 'This template helps you craft the perfect email for any situation. By defining the goal, recipient, and key points, you can generate a well-structured email with the appropriate tone, saving time and ensuring your message is communicated effectively.',
        variables: [
            { name: '[Goal_of_the_Email]', description: 'The primary purpose of the email (e.g., "To request a project extension," "To follow up on a sales lead," "To formally apologize for a service outage").' },
            { name: '[Recipient_Info]', description: 'Who the email is for and their role (e.g., "My direct manager," "A potential new client," "Our entire customer base").' },
            { name: '[Key_Points_to_Include]', description: 'A bulleted list of the essential information or questions that must be in the email.' },
            { name: '[Tone_of_Voice]', description: 'The desired tone (e.g., "Formal and respectful," "Friendly and collaborative," "Urgent and direct," "Empathetic and apologetic").' },
            { name: '[Call_to_Action]', description: 'What you want the recipient to do after reading the email (e.g., "Please approve this request by EOD," "Let me know your availability for a call next week").' },
        ],
        template: `Act as a professional communications expert. Your task is to draft a clear and effective email based on the following requirements.

**Primary Goal of the Email:** [Goal_of_the_Email]
**Recipient(s):** [Recipient_Info]
**Tone of Voice:** [Tone_of_Voice]
**Key Points to Include:**
- [Point 1]
- [Point 2]
- [Point 3]

**Desired Call to Action:** [Call_to_Action]

Please draft the email, including a concise and professional subject line. Ensure the email is well-structured, easy to read, and achieves the stated goal while maintaining the specified tone.`
      },
      {
        title: 'Comprehensive SWOT Analysis',
        useCase: 'To conduct a SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis for a business, product, or project.',
        description: 'This template provides a structured framework for strategic planning. The AI acts as a business analyst, using the information you provide to generate a detailed SWOT analysis, helping you identify key internal and external factors critical to your success.',
        variables: [
            { name: '[Company/Product/Project_Name]', description: 'The subject of the analysis.' },
            { name: '[Brief_Description]', description: 'A short paragraph describing the subject and its market/purpose.' },
            { name: '[Known_Strengths]', description: 'Internal positive factors (e.g., "Strong brand recognition," "Experienced team," "Proprietary technology").' },
            { name: '[Known_Weaknesses]', description: 'Internal negative factors (e.g., "High operational costs," "Lack of marketing budget," "Limited distribution channels").' },
            { name: '[Market_Context]', description: 'Information about the industry, competitors, and market trends.' },
        ],
        template: `Act as a senior business strategist. Your task is to perform a comprehensive SWOT analysis based on the information provided below.

**Subject of Analysis:** [Company/Product/Project_Name]
**Description:** [Brief_Description]
**Known Internal Strengths:** [Known_Strengths]
**Known Internal Weaknesses:** [Known_Weaknesses]
**Market and Competitor Context:** [Market_Context]

Based on the information above and your general business knowledge, please generate a detailed SWOT analysis. For each of the four quadrants (Strengths, Weaknesses, Opportunities, Threats), provide at least 3-4 distinct and insightful bullet points.

**Strengths (Internal, Positive):**
*   [Based on known strengths and description]

**Weaknesses (Internal, Negative):**
*   [Based on known weaknesses and description]

**Opportunities (External, Positive):**
*   [Based on market context, trends, and potential gaps]

**Threats (External, Negative):**
*   [Based on market context, competitors, and potential risks]`
      }
    ]
  },
  {
    id: 'learning-education',
    name: 'Learning & Education',
    templates: [
      {
        title: 'Complex Concept Explainer (ELI5)',
        useCase: 'To break down a complex topic into a simple, easy-to-understand explanation using analogies.',
        description: 'This template is perfect for learning. It instructs the AI to act as a skilled teacher, explaining a difficult concept as if talking to a five-year-old (ELI5), then providing a slightly more detailed explanation for an adult beginner. This dual approach makes any subject accessible.',
        variables: [
            { name: '[Complex_Topic]', description: 'The concept you want to be explained (e.g., "Quantum Computing," "Blockchain," "General Relativity," "Machine Learning").' },
            { name: '[Key_Aspect_to_Focus_On]', description: 'A specific part of the topic to emphasize, if any (e.g., "Focus on quantum superposition").' },
        ],
        template: `Act as an expert educator with a talent for simplifying complex topics. Your task is to explain [Complex_Topic] in two different ways.

**Topic:** [Complex_Topic]
**Specific Focus (if any):** [Key_Aspect_to_Focus_On]

Please provide the following two explanations:

**1. Explain Like I'm 5 (ELI5):**
Use simple language and a creative analogy to explain the core idea of the topic. The explanation should be very short and easy for a young child to grasp.

**2. Explanation for a Beginner Adult:**
Provide a more detailed explanation suitable for an intelligent adult who has no prior knowledge of this subject. Avoid jargon where possible, or explain it clearly if you must use it. Use a different, more detailed analogy if it helps. Structure the explanation with clear headings for key components of the topic.`
      },
      {
        title: 'Personalized Study Guide Creator',
        useCase: 'To create a structured study guide on a specific subject from notes or a block of text.',
        description: 'This template transforms raw text or messy notes into a powerful learning tool. The AI organizes the information into key concepts, important definitions, and thought-provoking questions, creating a tailored study guide to help with revision and deepen understanding.',
        variables: [
            { name: '[Subject/Topic]', description: 'The main subject the study guide is for (e.g., "World War II," "Cellular Biology," "Introduction to Python").' },
            { name: '[Source_Text_or_Notes]', description: 'The block of text from an article, lecture, or your personal notes to be converted into a study guide.' },
            { name: '[Number_of_Questions]', description: 'The number of summary questions you want to be generated.' },
        ],
        template: `Act as an academic tutor. Your task is to create a concise and effective study guide from the source material provided below.

**Subject:** [Subject/Topic]

**Source Material:**
"""
[Source_Text_or_Notes]
"""

Please structure the study guide as follows:

**1. Key Concepts (3-5 points):**
A bulleted list summarizing the most critical ideas, themes, or takeaways from the text.

**2. Important Vocabulary/Definitions:**
A list of key terms mentioned in the text, each with a clear and concise definition.
- **[Term 1]:** [Definition]
- **[Term 2]:** [Definition]

**3. Summary Questions ([Number_of_Questions] questions):**
A numbered list of open-ended questions that test understanding of the material. These questions should encourage critical thinking, not just rote memorization.
1.  ?
2.  ?`
      }
    ]
  },
  {
    id: 'creative-writing',
    name: 'Creative Writing',
    templates: [
      {
        title: 'Dynamic Story Idea Generator',
        useCase: 'To generate unique and compelling story ideas based on a set of creative constraints.',
        description: 'This template helps break through writer\'s block by combining different creative elements. The AI acts as a muse, generating several distinct story synopses that weave together your specified genre, character archetype, setting, and a plot twist, providing a solid foundation for a new story.',
        variables: [
            { name: '[Genre]', description: 'The genre of the story (e.g., "Science Fiction," "Fantasy," "Mystery," "Horror").' },
            { name: '[Character_Archetype]', description: 'The type of protagonist (e.g., "A cynical detective," "A reluctant hero," "A brilliant but disgraced scientist").' },
            { name: '[Setting]', description: 'The time and place of the story (e.g., "A cyberpunk city in 2099," "A magical library that contains every book never written").' },
            { name: '[Mandatory_Object_or_Theme]', description: 'An object or theme that must be central to the plot (e.g., "A broken compass," "The theme of betrayal").' },
        ],
        template: `Act as a master storyteller and creative muse. Your task is to generate three unique and intriguing story ideas based on the following elements.

**Genre:** [Genre]
**Character Archetype:** [Character_Archetype]
**Setting:** [Setting]
**Mandatory Object or Theme:** [Mandatory_Object_or_Theme]

For each of the three ideas, please provide:
a) A catchy, one-sentence logline.
b) A one-paragraph synopsis (3-5 sentences) that outlines the main plot, the central conflict, and a potential hook or twist.

**Story Idea 1:**
- **Logline:**
- **Synopsis:**

**Story Idea 2:**
- **Logline:**
- **Synopsis:**

**Story Idea 3:**
- **Logline:**
- **Synopsis:**`
      },
      {
        title: 'Detailed Character Profile Builder',
        useCase: 'To create a deep and multi-dimensional character profile for a story.',
        description: 'This template helps writers develop rich, believable characters. By providing a basic concept, the AI fleshes out the character\'s backstory, motivations, flaws, and quirks, creating a comprehensive profile that can be used as a reference throughout the writing process.',
        variables: [
            { name: '[Character_Name]', description: 'The name of the character.' },
            { name: '[Basic_Concept]', description: 'A one-sentence idea for the character (e.g., "A space pirate who secretly writes poetry," "An elderly librarian who discovers she has magic powers").' },
            { name: '[Role_in_Story]', description: 'The character\'s role (e.g., "Protagonist," "Antagonist," "Mentor," "Sidekick").' },
        ],
        template: `Act as a world-class character developer for fiction. Your task is to create a detailed character profile based on the core concept provided.

**Character Name:** [Character_Name]
**Basic Concept:** [Basic_Concept]
**Role in Story:** [Role_in_Story]

Please flesh out this character by providing details for the following sections:

1.  **Physical Appearance:** A brief but evocative description of how they look, dress, and carry themselves.
2.  **Personality:** Describe their key personality traits (e.g., introverted, courageous, arrogant). What are their defining mannerisms or quirks?
3.  **Backstory:** A summary of their history. What key events in their past have shaped who they are today?
4.  **Motivations & Goals:**
    *   **Primary Goal:** What is the one thing they want to achieve more than anything else in the story?
    *   **Internal Motivation:** *Why* do they want to achieve this goal? What deep-seated need or desire drives them?
5.  **Flaws & Fears:**
    *   **Major Flaw:** What is their single biggest character flaw that gets in their way?
    *   **Greatest Fear:** What are they most afraid of?
6.  **Internal Conflict:** Describe the central internal struggle the character faces (e.g., "Duty vs. Desire," "Fear vs. Courage").`
      }
    ]
  }
];
