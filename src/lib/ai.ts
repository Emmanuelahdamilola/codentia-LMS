// PATH: src/lib/ai.ts
// Uses Groq SDK with fallback chain
// Env: GROQ_API_KEY

import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// ── Groq model IDs — update if deprecated: https://console.groq.com/docs/models
const MODELS = [
  'llama-3.1-8b-instant',
  'llama3-8b-8192',
  'llama3-70b-8192',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
]

// ── Core completion helper ────────────────────────────────────────────────────

type Message = Groq.Chat.ChatCompletionMessageParam

async function createCompletion(
  messages:  Message[],
  maxTokens = 800,
  jsonMode  = false
): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set')

  for (const model of MODELS) {
    try {
      const res = await groq.chat.completions.create({
        model,
        messages,
        max_tokens:  maxTokens,
        temperature: 0.7,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      })

      const content = res.choices[0]?.message?.content?.trim()
      if (content) return content

      console.warn(`[AI] Model ${model} returned empty content`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn(`[AI] Model ${model} failed: ${msg}`)
    }
  }

  throw new Error('All Groq models failed')
}

// ── AI Coding Tutor ───────────────────────────────────────────────────────────

export async function askAITutor(
  question:       string,
  lessonContext?: string
): Promise<string> {
  const systemPrompt = `You are Codentia AI, an expert coding tutor for web development students.
Your role is to:
- Explain coding concepts clearly and simply
- Debug code and identify errors
- Suggest improvements and best practices
- Generate practice examples
- Explain error messages with fix suggestions

Keep responses concise, practical, and beginner-friendly.
${lessonContext ? `\nCurrent lesson context:\n${lessonContext}` : ''}`

  return createCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: question },
  ], 800)
}

// ── AI Assignment Feedback ────────────────────────────────────────────────────

export async function generateAssignmentFeedback(
  assignmentTitle:       string,
  assignmentDescription: string,
  submissionNotes?:      string,
  githubUrl?:            string
): Promise<string> {
  const prompt = `You are reviewing a student's coding assignment submission.

Assignment: ${assignmentTitle}
Requirements: ${assignmentDescription}
${submissionNotes ? `Student notes: ${submissionNotes}` : ''}
${githubUrl ? `GitHub: ${githubUrl}` : ''}

Provide structured feedback with:
1. What the student did well (2-3 points)
2. Specific improvement suggestions (2-3 points)
3. One key learning recommendation

Be encouraging but specific. Format as a short bulleted list.`

  return createCompletion([{ role: 'user', content: prompt }], 500)
}

// ── AI Quiz Generator ─────────────────────────────────────────────────────────

interface GeneratedQuestion {
  question:     string
  options:      string[]
  correctIndex: number
  explanation:  string
}

export async function generateQuiz(
  prompt: string,
  count   = 5
): Promise<GeneratedQuestion[]> {
  const systemPrompt = `You are a quiz generator for a coding bootcamp. Generate multiple choice questions.
Return ONLY valid JSON — no markdown, no code fences, no extra text — in this exact format:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}`

  const raw = await createCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: `Generate ${count} questions about: ${prompt}` },
  ], 2000, true)

  try {
    const clean  = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return parsed.questions ?? []
  } catch {
    console.error('[AI] Failed to parse quiz JSON:', raw.slice(0, 200))
    return []
  }
}

// ── AI Study Recommendations ──────────────────────────────────────────────────

export async function generateStudyRecommendations(
  studentName: string,
  weakTopics:  Array<{ topic: string; score: number }>
): Promise<string> {
  const topicsList = weakTopics
    .map(t => `- ${t.topic} (score: ${t.score}%)`)
    .join('\n')

  const prompt = `A student named ${studentName} is struggling with these topics:
${topicsList}

Generate 3 specific, actionable study recommendations to improve their understanding.
Be encouraging and practical. Keep it under 150 words.`

  return createCompletion([{ role: 'user', content: prompt }], 300)
}