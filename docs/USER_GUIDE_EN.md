# 📖 Comprehensive User Guide - Prompt Studio 4

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Main Interface](#main-interface)
4. [Seven-Stage Workflow](#seven-stage-workflow)
5. [Tri-Agent System](#tri-agent-system)
6. [Templates & Techniques Management](#templates--techniques-management)
7. [Live Collaboration](#live-collaboration)
8. [SDK Generation](#sdk-generation)
9. [Semantic Caching](#semantic-caching)
10. [Cloud Deployment](#cloud-deployment)
11. [Settings](#settings)
12. [Practical Examples](#practical-examples)
13. [Troubleshooting](#troubleshooting)
14. [FAQ](#faq)

---

## Introduction

**Prompt Studio 4** is an advanced prompt engineering platform that helps you design, optimize, and manage prompts in a professional and organized manner.

### Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **Tri-Agent System** | Automatic prompt optimization using three AI agents |
| 📊 **Organized Workflow** | 7 clear stages from idea to organization |
| 👥 **Live Collaboration** | Real-time teamwork with your team |
| 🔧 **SDK Generation** | Generate ready-to-use code in 5 programming languages |
| 💾 **Semantic Storage** | Cost savings through intelligent caching |
| ☁️ **Cloud Deployment** | Direct deployment to AWS, GCP, Vercel, Cloudflare |

---

## Quick Start

### Prerequisites

```bash
# Node.js 18 or later
node --version  # v18.0.0+

# PostgreSQL 14 or later
psql --version  # 14.0+

# Redis (optional for caching)
redis-server --version
```

### Installation

```bash
# Clone the project
git clone https://github.com/your-org/prompt-studio4.git
cd prompt-studio4

# Install dependencies
npm install

# Setup database
npm run db:push

# Run the application
npm run dev
```

### Accessing the Application

After running, open your browser at:
- **Frontend**: `http://localhost:5000`
- **API**: `http://localhost:5000/api`

---

## Main Interface

### Navigation Bar

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Home  │  🎨 Studio  │  📚 Templates  │  🔧 Techniques  │
│  📊 Runs  │  👥 Collaboration  │  ⚙️ Settings              │
└─────────────────────────────────────────────────────────────┘
```

### Main Pages

| Page | Path | Function |
|------|------|----------|
| Home | `/` | Dashboard and statistics |
| Studio | `/studio` | Create and edit prompts |
| Templates | `/templates` | Manage prompt templates |
| Techniques | `/techniques` | Prompt improvement techniques |
| Runs | `/runs` | Prompt execution history |
| Collaboration | `/collaboration` | Live collaboration sessions |
| Settings | `/settings` | Application settings |

---

## Seven-Stage Workflow

Prompt Studio follows an organized workflow of 7 stages to ensure prompt quality:

### 📋 Overview

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Stage 0  │───▶│ Stage 1  │───▶│ Stage 2  │───▶│ Stage 3  │
│   Idea   │    │ Compose  │    │  Review  │    │   Edit   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
┌──────────┐    ┌──────────┐    ┌──────────┐         │
│ Stage 6  │◀───│ Stage 5  │◀───│ Stage 4  │◀────────┘
│ Organize │    │ Execute  │    │ Analyze  │
└──────────┘    └──────────┘    └──────────┘
```

### Stage 0: Raw Idea 💡

**Goal**: Enter the initial prompt idea

**How to use**:
1. Write your idea freely in the text box
2. Don't worry about formatting or structure
3. Click "Next" to proceed to the next stage

**Example**:
```
I want a prompt that helps me write executive summaries
for financial reports in a professional and concise manner
```

---

### Stage 1: Tri-Agent Composition 🤖

**Goal**: Transform the idea into a structured prompt using 3 agents

**Process**:
```
Your Idea ──▶ [Agent 1: Transformer] ──▶ Structured Prompt
                                              │
                ◀── [Agent 2: Critic] ◀──────┘
                          │
                ──▶ [Agent 3: Judge] ──▶ Final Prompt
```

**Result**: A prompt divided into 4 sections:
- **System Prompt**: Model role definition
- **Developer Instructions**: Developer guidelines
- **User Message**: User's message
- **Context**: Context and additional information

---

### Stage 2: Review ✅

**Goal**: Review agent results and choose the best

**Available options**:
- ✅ **Accept**: Approve current result
- 🔄 **Regenerate**: Request a new result
- ✏️ **Manual Edit**: Proceed to editing stage

---

### Stage 3: Advanced Editing ✏️

**Goal**: Precise editing of each prompt section

**Editing Interface**:
```
┌─────────────────────────────────────────────────┐
│ System Prompt                                    │
├─────────────────────────────────────────────────┤
│ You are an expert financial analyst specialized │
│ in writing executive summaries. You excel at    │
│ precision and brevity...                        │
│                                                  │
│ [📝 Edit] [🔄 Regenerate] [📋 Copy]             │
└─────────────────────────────────────────────────┘
```

**Editing Tools**:
- Direct text editing
- Insert variables `{{variable_name}}`
- Use ready-made templates
- Apply improvement techniques

---

### Stage 4: Quality Analysis 📊

**Goal**: Get objective evaluation of the prompt

**Evaluation Criteria**:

| Criterion | Description | Range |
|-----------|-------------|-------|
| Clarity | How clear the instructions are | 1-10 |
| Completeness | Prompt comprehensiveness | 1-10 |
| Structure | Organization quality | 1-10 |
| Effectiveness | Expected result quality | 1-10 |

**Evaluation Example**:
```json
{
  "overall_score": 8.5,
  "clarity": 9,
  "completeness": 8,
  "structure": 9,
  "effectiveness": 8,
  "suggestions": [
    "Add examples of the required format",
    "Specify expected summary length"
  ]
}
```

---

### Stage 5: Execution ▶️

**Goal**: Run the prompt on an LLM model

**Execution Options**:
```
┌─────────────────────────────────┐
│ Select Model                    │
│ ○ Llama 3.3 70B (default)      │
│ ○ GPT-4                         │
│ ○ Claude 3                      │
├─────────────────────────────────┤
│ Execution Settings              │
│ Temperature: [0.7    ▼]         │
│ Max Tokens: [2048   ▼]          │
├─────────────────────────────────┤
│      [▶️ Execute Prompt]        │
└─────────────────────────────────┘
```

**Result**: Display model response with:
- Response time
- Tokens used
- Estimated cost
- Save to history option

---

### Stage 6: Organize 📁

**Goal**: Save the prompt for future use

**Save Options**:

1. **Save as New Template**:
   ```
   Name: Financial Executive Summary
   Description: Template for creating executive summaries for financial reports
   Category: Business > Reports
   ```

2. **Update Existing Template**:
   - Select template from list
   - Save as new version

3. **Save as Technique**:
   - Extract the technique used
   - Add to techniques library

---

## Tri-Agent System

### Agent 1: The Transformer 🔄

**Role**: Transform raw idea into structured prompt

**Inputs**:
```
User's raw idea
```

**Outputs**:
```json
{
  "systemPrompt": "...",
  "developerInstructions": "...",
  "userMessage": "...",
  "context": "..."
}
```

**Practical Example**:

*Input*:
```
I want to write marketing emails
```

*Output*:
```json
{
  "systemPrompt": "You are a professional marketing expert specializing in writing marketing emails. You have an engaging and persuasive style that achieves high conversion rates.",
  "developerInstructions": "- Use catchy subject lines\n- Keep the message concise\n- Include a clear call to action",
  "userMessage": "Write a marketing email for {{product}} targeting {{target_audience}}",
  "context": "Product type: {{product_type}}\nOffer: {{offer}}"
}
```

---

### Agent 2: The Critic 🔍

**Role**: Analyze and critique the prompt and provide improvements

**Evaluation includes**:
- Strengths
- Weaknesses
- Specific suggestions
- Improved alternative prompt

**Critique Example**:
```markdown
## Strengths
- Clear role definition
- Use of variables for customization

## Weaknesses
- Missing style examples
- Message length not specified

## Suggestions
1. Add examples section
2. Specify 150-250 word range
3. Add brand tone
```

---

### Agent 3: The Judge ⚖️

**Role**: Merge opinions and make final decision

**Process**:
1. Review original prompt
2. Analyze Agent 2's critique
3. Apply appropriate improvements
4. Produce final prompt

**Outputs**:
```json
{
  "finalPrompt": {
    "systemPrompt": "...",
    "developerInstructions": "...",
    "userMessage": "...",
    "context": "..."
  },
  "appliedFixes": [
    "Added style examples",
    "Specified message length",
    "Clarified brand tone"
  ],
  "finalVariables": ["product", "target_audience", "product_type", "offer", "brand_tone"]
}
```

---

## Templates & Techniques Management

### Templates 📚

**Create New Template**:
1. Go to `/templates`
2. Click "New Template"
3. Fill in the data:

```
┌─────────────────────────────────────────────────┐
│ Create New Template                              │
├─────────────────────────────────────────────────┤
│ Name: [____________________________]            │
│ Description: [____________________________]     │
│ Category: [Business              ▼]             │
│                                                  │
│ System Prompt:                                  │
│ ┌───────────────────────────────────────────┐  │
│ │                                           │  │
│ └───────────────────────────────────────────┘  │
│                                                  │
│ Variables: {{var1}}, {{var2}}                   │
│                                                  │
│        [Save Template]    [Cancel]              │
└─────────────────────────────────────────────────┘
```

**Use Template**:
1. Select template from list
2. Fill in variable values
3. Click "Use in Studio"

---

### Techniques 🔧

**Available Techniques**:

| Technique | Description | Example |
|-----------|-------------|---------|
| Chain of Thought | Step-by-step thinking | "Think step by step..." |
| Few-Shot | Provide examples | "Example 1:... Example 2:..." |
| Role Play | Assign specific role | "You are an expert in..." |
| Structured Output | Specify format | "Respond in JSON format..." |
| Self-Consistency | Self-verification | "Review your answer and ensure..." |

**Apply Technique**:
1. Go to Stage 3 (Editing)
2. Select "Apply Technique"
3. Choose desired technique
4. Technique will be automatically integrated into the prompt

---

## Live Collaboration

### Create Collaboration Session 👥

```bash
# Steps:
1. Go to /collaboration
2. Click "New Session"
3. Share session link with your team
4. Start editing together!
```

### Collaboration Interface

```
┌─────────────────────────────────────────────────────────────┐
│ 🟢 Session: Improve Marketing Prompt  [👥 3 online] [🔗 Share]│
├─────────────────────────────────────────────────────────────┤
│ Participants:                                               │
│ 🟢 Ahmed (you) - editing System Prompt                     │
│ 🟢 Sarah - viewing                                          │
│ 🟢 Mohammed - editing Context                               │
├─────────────────────────────────────────────────────────────┤
│ [Shared editor with presence cursors]                       │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ You are a marketing expert... |Ahmed                  │  │
│ │                               |Sarah                  │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Collaboration Features

- **Concurrent Editing**: Multiple users edit the same document
- **Presence Indicators**: See each user's cursor location
- **Distinctive Colors**: Each user has a different color
- **Edit History**: Track all changes
- **Conflict Resolution**: CRDT system prevents conflicts

---

## SDK Generation

### Supported Languages 💻

```
┌────────────────────────────────────────────────────────────┐
│ Select Required Language:                                   │
├────────────────────────────────────────────────────────────┤
│ ○ TypeScript  - with Async/Await and strong types         │
│ ○ Python      - with Type Hints and Requests              │
│ ○ JavaScript  - with Axios and Promises                   │
│ ○ Go          - with HTTP Client                          │
│ ○ cURL/Bash   - Shell scripts                             │
└────────────────────────────────────────────────────────────┘
```

### Example: Generate TypeScript SDK

**Steps**:
1. Go to `/sdk-generator`
2. Select prompt or template
3. Choose "TypeScript"
4. Click "Generate"

**Result**:

```typescript
// prompt-studio-sdk.ts

interface PromptVariables {
  product: string;
  targetAudience: string;
  productType: string;
  offer: string;
}

interface PromptResponse {
  content: string;
  tokens: number;
  latency: number;
}

export async function generateMarketingEmail(
  variables: PromptVariables
): Promise<PromptResponse> {
  const response = await fetch('/api/ai/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemPrompt: `You are a professional marketing expert...`,
      userMessage: `Write a marketing email for ${variables.product}...`,
      context: `Product type: ${variables.productType}...`,
    }),
  });

  return response.json();
}

// Using the SDK
const result = await generateMarketingEmail({
  product: 'Task Management App',
  targetAudience: 'Entrepreneurs',
  productType: 'SaaS',
  offer: '50% off for first 3 months',
});

console.log(result.content);
```

### Example: Generate Python SDK

```python
# prompt_studio_sdk.py

from typing import TypedDict
import requests

class PromptVariables(TypedDict):
    product: str
    target_audience: str
    product_type: str
    offer: str

class PromptResponse(TypedDict):
    content: str
    tokens: int
    latency: float

def generate_marketing_email(variables: PromptVariables) -> PromptResponse:
    """Generate a marketing email"""
    response = requests.post(
        'http://localhost:5000/api/ai/run',
        json={
            'systemPrompt': 'You are a professional marketing expert...',
            'userMessage': f'Write a marketing email for {variables["product"]}...',
            'context': f'Product type: {variables["product_type"]}...',
        }
    )
    return response.json()

# Using the SDK
if __name__ == '__main__':
    result = generate_marketing_email({
        'product': 'Task Management App',
        'target_audience': 'Entrepreneurs',
        'product_type': 'SaaS',
        'offer': '50% off for first 3 months',
    })
    print(result['content'])
```

---

## Semantic Caching

### How It Works 🧠

```
┌─────────────────────────────────────────────────────────────┐
│                    New Prompt                               │
│                      │                                      │
│                      ▼                                      │
│           ┌─────────────────────┐                          │
│           │  Semantic Search    │                          │
│           │ (Cosine Similarity) │                          │
│           └─────────────────────┘                          │
│                      │                                      │
│         ┌───────────┴───────────┐                          │
│         │                       │                          │
│   Similarity > 85%        Similarity < 85%                 │
│         │                       │                          │
│         ▼                       ▼                          │
│   ┌──────────┐           ┌──────────┐                      │
│   │   Use    │           │  Execute │                      │
│   │  Cached  │           │   New    │                      │
│   │  Result  │           │ and Save │                      │
│   └──────────┘           └──────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Cache Statistics

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Cache Statistics                                         │
├─────────────────────────────────────────────────────────────┤
│ Total Requests:     1,234                                   │
│ Hits:               892 (72.3%)                            │
│ Misses:             342 (27.7%)                            │
│                                                             │
│ Estimated Savings:  $45.67                                 │
│ Response Time:      ~50ms (vs ~2000ms without caching)     │
│                                                             │
│ [🗑️ Clear Cache]  [⚙️ Settings]  [📈 Detailed Report]      │
└─────────────────────────────────────────────────────────────┘
```

### Cache Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Similarity Threshold | 85% | Minimum similarity match |
| TTL | 7 days | Result validity period |
| Max Size | 10,000 | Number of stored results |
| Auto Cleanup | Every 24 hours | Cleanup schedule |

---

## Cloud Deployment

### Supported Platforms ☁️

#### AWS (Amazon Web Services)

```yaml
# Deployment steps for AWS
1. Go to /cloud-deployment
2. Select AWS
3. Enter credentials:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Region (e.g., us-east-1)
4. Choose service type:
   - EC2 (for full control)
   - ECS (for containers)
   - Lambda (serverless)
5. Click "Deploy"
```

#### Google Cloud Platform

```yaml
# Deployment steps for GCP
1. Select Google Cloud
2. Upload Service Account JSON file
3. Select project
4. Choose service type:
   - Cloud Run (recommended)
   - Compute Engine
   - App Engine
5. Click "Deploy"
```

#### Vercel

```yaml
# Deployment steps for Vercel
1. Select Vercel
2. Enter Vercel Token
3. Specify project name
4. Select region
5. Click "Deploy"

# Automatic deployment
- Automatically triggered on every push to main
```

#### Cloudflare

```yaml
# Deployment steps for Cloudflare
1. Select Cloudflare
2. Enter API Token
3. Specify Account ID
4. Choose service type:
   - Workers
   - Pages
5. Click "Deploy"
```

### Deployment Monitoring

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Deployment Status                                        │
├─────────────────────────────────────────────────────────────┤
│ Platform: AWS ECS                                           │
│ Status: 🟢 Running                                          │
│ URL: https://prompt-studio.aws.example.com                 │
│                                                             │
│ Metrics:                                                    │
│ ├─ Uptime: 99.9%                                           │
│ ├─ Response Time: 120ms                                    │
│ ├─ Requests/sec: 45                                        │
│ └─ Memory Usage: 65%                                       │
│                                                             │
│ [📋 Logs]  [🔄 Redeploy]  [⏹️ Stop]                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Settings

### General Settings ⚙️

```
┌─────────────────────────────────────────────────────────────┐
│ General Settings                                            │
├─────────────────────────────────────────────────────────────┤
│ Language: [English         ▼]                               │
│ Theme: [Dark              ▼]                                │
│ Font Size: [Medium        ▼]                                │
│                                                             │
│ ☑️ Enable Notifications                                     │
│ ☑️ Auto Save                                                │
│ ☐ Developer Mode                                            │
└─────────────────────────────────────────────────────────────┘
```

### API Settings

```
┌─────────────────────────────────────────────────────────────┐
│ API Key Settings                                            │
├─────────────────────────────────────────────────────────────┤
│ Groq API Key:                                               │
│ [••••••••••••••••••••••••••••••••]  [👁️] [✏️]              │
│                                                             │
│ OpenAI API Key (for semantic caching):                      │
│ [••••••••••••••••••••••••••••••••]  [👁️] [✏️]              │
│                                                             │
│ [Test Connection]  [Save]                                   │
└─────────────────────────────────────────────────────────────┘
```

### Model Settings

```
┌─────────────────────────────────────────────────────────────┐
│ Default Model Settings                                      │
├─────────────────────────────────────────────────────────────┤
│ Model: [Llama 3.3 70B  ▼]                                  │
│ Temperature: [0.7       ═══════●═══]                        │
│ Max Tokens: [2048      ▼]                                   │
│ Top P: [0.9            ═══════●═══]                         │
│                                                             │
│ ☑️ Streaming                                                │
│ ☐ Log All Requests                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Practical Examples

### Example 1: Create Article Writing Prompt 📝

**Initial Idea**:
```
I want to write professional tech articles
```

**Result After Agent Processing**:

```markdown
## System Prompt
You are a professional tech content writer with 10 years of experience writing for major tech websites.
You excel at a clear and easy style that explains complex concepts simply. You adhere to SEO standards
and use practical examples.

## Developer Instructions
- Start with a catchy title containing the keyword
- Use short paragraphs (3-4 sentences)
- Add subheadings every 200-300 words
- Use bullet lists for sequential information
- End with a summary and engagement question

## User Message
Write an article about {{topic}} targeting {{audience}} with {{word_count}} words.
Keywords: {{keywords}}

## Context
Platform: {{platform}}
Writing tone: {{tone}}
Goal: {{goal}}
```

**Using Variables**:
```json
{
  "topic": "AI in Education",
  "audience": "Teachers and Parents",
  "word_count": "1500",
  "keywords": "AI, education, technology",
  "platform": "Educational Blog",
  "tone": "Friendly and informative",
  "goal": "Awareness and education"
}
```

---

### Example 2: Create Data Analysis Prompt 📊

**Initial Idea**:
```
Analyze sales data and extract insights
```

**Final Result**:

```markdown
## System Prompt
You are an expert data analyst specialized in sales and business data analysis.
You use scientific methodology in analysis and provide actionable insights.

## Developer Instructions
1. Start with an executive summary (3-5 key points)
2. Provide detailed analysis with numbers
3. Identify trends and patterns
4. Compare with previous periods if available
5. Provide specific and measurable recommendations
6. Use tables to display data

## User Message
Analyze the following sales data and extract key insights:
{{sales_data}}

Period: {{period}}
Compare with: {{comparison_period}}

## Context
Business type: {{business_type}}
Main products: {{main_products}}
Targets: {{targets}}
```

**Usage Example**:
```json
{
  "sales_data": "| Month | Sales | Growth |\n|-------|-------|--------|\n| January | 50,000 | +10% |",
  "period": "Q1 2024",
  "comparison_period": "Q1 2023",
  "business_type": "E-commerce",
  "main_products": "Electronics, Clothing",
  "targets": "20% annual growth"
}
```

---

### Example 3: Create Professional Translation Prompt 🌍

**Final Result**:

```markdown
## System Prompt
You are a certified professional translator specialized in English-Arabic translation.
You preserve the original meaning, style, and tone while considering cultural context.

## Developer Instructions
- Maintain original text structure
- Use correct specialized terminology
- Consider cultural differences
- Add notes for idiomatic expressions
- Avoid literal translation

## User Message
Translate the following text from {{source_lang}} to {{target_lang}}:

{{text}}

## Context
Domain: {{domain}}
Target audience: {{target_audience}}
Formality level: {{formality}}
```

---

### Example 4: Collaborating on Prompt with Team 👥

**Scenario**: Marketing team working on improving an advertising content prompt.

**Steps**:

1. **Manager** creates new collaboration session
2. **Shares link** with team: `https://app/collaboration/abc123`
3. **Team members** join the session
4. **Joint editing**:
   - Ahmed edits System Prompt
   - Sarah adds examples
   - Mohammed reviews variables
5. **Save** as shared template

```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Edit History                                             │
├─────────────────────────────────────────────────────────────┤
│ 10:30 - Ahmed: Modified System Prompt                       │
│ 10:32 - Sarah: Added advertisement example                  │
│ 10:35 - Mohammed: Added brand_voice variable                │
│ 10:38 - Ahmed: Modified Developer Instructions              │
│ 10:40 - Everyone: Saved as "Marketing Ads v2" template      │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Common Problems and Solutions

#### 1. API Connection Error

```
❌ Error: Failed to connect to API
```

**Solutions**:
```bash
# Verify API key
1. Go to Settings > API
2. Ensure key is correct
3. Click "Test Connection"

# Check internet connection
ping api.groq.com

# Check logs
npm run logs
```

#### 2. Slow Response

```
⚠️ Warning: High response time
```

**Solutions**:
```bash
# Enable caching
1. Go to Settings > Caching
2. Enable "Semantic Caching"
3. Set similarity threshold to 80%

# Reduce request size
- Lower Max Tokens
- Use smaller model for simple tasks
```

#### 3. Live Collaboration Error

```
❌ Error: Session connection lost
```

**Solutions**:
```bash
# Reconnect
1. Click "Reconnect"
2. If failed, close and reopen page

# Check WebSocket
- Ensure WebSocket not blocked by firewall
- Try another browser
```

#### 4. Cloud Deployment Failure

```
❌ Error: AWS deployment failed
```

**Solutions**:
```bash
# Check permissions
1. Ensure sufficient IAM permissions
2. Review access policies

# Check quotas
- Ensure service quotas not exceeded
- Review region limits
```

---

## FAQ

### General

**Q: Can I use Prompt Studio without internet connection?**

A: No, the application requires internet connection to access AI models. However, you can work on editing templates locally.

---

**Q: What models are supported?**

A: Currently we support:
- Llama 3.3 70B (via Groq)
- GPT-4 (via OpenAI)
- Claude 3 (via Anthropic)

---

**Q: How is cost calculated?**

A: Cost depends on:
- Number of tokens in request and response
- Model used
- Caching significantly reduces cost

---

### Technical

**Q: How do I add a new LLM model?**

A:
1. Add new provider in `server/llm-provider.ts`
2. Define provider interface
3. Add settings in UI

---

**Q: How do I extend the agent system?**

A:
1. Add new agent in `server/agents.ts`
2. Define role, inputs, and outputs
3. Integrate into workflow

---

**Q: How do I customize the UI?**

A:
1. Components in `client/src/components`
2. Styles in `tailwind.config.js`
3. Themes in `client/src/styles`

---

### Security

**Q: How are API keys protected?**

A:
- Stored encrypted in database
- Not shown in logs
- Sent via HTTPS only

---

**Q: Is my data safe in live collaboration?**

A:
- Connection encrypted via WSS
- Sessions expire automatically
- Session content not stored

---

## Support and Contact

### Getting Help

- 📖 **Documentation**: `/docs`
- 💬 **Community**: Discord/Slack
- 🐛 **Report Issue**: GitHub Issues
- 📧 **Technical Support**: support@prompt-studio.com

### Contributing

```bash
# Clone project
git clone https://github.com/your-org/prompt-studio4.git

# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
npm test

# Submit Pull Request
git push origin feature/my-feature
```

---

## Appendices

### Appendix A: Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `Ctrl + S` | Save |
| `Ctrl + Enter` | Execute prompt |
| `Ctrl + /` | Toggle comment |
| `Ctrl + Z` | Undo |
| `Ctrl + Shift + Z` | Redo |
| `Ctrl + D` | Duplicate line |
| `Ctrl + F` | Find |
| `Ctrl + H` | Replace |
| `F1` | Help |

### Appendix B: Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/prompt_studio

# Redis
REDIS_URL=redis://localhost:6379

# API Keys
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key

# Server Settings
PORT=5000
NODE_ENV=production

# Security Settings
SESSION_SECRET=your_secret
JWT_SECRET=your_jwt_secret
```

### Appendix C: Database Schema

```sql
-- Main tables
templates          -- Templates
techniques         -- Techniques
prompts           -- Prompts
runs              -- Execution history
users             -- Users
collaboration_sessions -- Collaboration sessions
semantic_cache    -- Semantic cache
```

---

<div align="center">

**Prompt Studio 4** - Advanced Prompt Engineering Platform

Version 4.0.0 | © 2024

</div>
