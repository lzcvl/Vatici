/**
 * AI Market Resolution
 *
 * Two independent AI models (GROQ + Gemini) evaluate the market question
 * and propose the correct outcome. Consensus requires both models to agree
 * with confidence > 70%.
 */

import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { sql } from '../db/client'

export interface AiResolutionResult {
  result: string      // 'YES', 'NO', or option letter ('A', 'B', 'C'...) for multi-choice
  confidence: number  // 0–100
  reasoning: string   // Brief explanation (max ~150 chars)
}

export interface AiConsensus {
  agreed: boolean
  agreedResult?: string
  groq: AiResolutionResult
  gemini: AiResolutionResult
}

interface MarketForAi {
  id: string
  question: string
  description: string | null
  market_type: string
  closes_at: string
  answers?: Array<{ id: string; text: string; index: number }>
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function buildPrompt(market: MarketForAi): string {
  const closingDate = new Date(market.closes_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const isMulti = market.market_type === 'multi' && market.answers && market.answers.length > 0

  const optionsText = isMulti
    ? '\n\nOptions:\n' +
      (market.answers || [])
        .map((a, i) => `${OPTION_LETTERS[i]}) ${a.text}`)
        .join('\n')
    : ''

  const resultFormat = isMulti
    ? `one of: ${(market.answers || []).map((_, i) => `"${OPTION_LETTERS[i]}"`).join(', ')}`
    : '"YES" or "NO"'

  return `You are resolving a prediction market that closed on ${closingDate}.

Market question: ${market.question}
${market.description ? `Context: ${market.description}` : ''}${optionsText}

Based on publicly known facts as of ${closingDate}, what was the correct outcome?

Respond ONLY with valid JSON (no markdown, no explanation outside JSON):
{
  "result": ${resultFormat},
  "confidence": <integer 0-100>,
  "reasoning": "<one sentence, max 120 chars>"
}

If you are not certain, set confidence below 70. Do not guess.`
}

async function parseAiJson(raw: string): Promise<AiResolutionResult> {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned) as { result: string; confidence: number; reasoning: string }
  return {
    result: String(parsed.result).trim().toUpperCase(),
    confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
    reasoning: String(parsed.reasoning || '').slice(0, 150),
  }
}

async function queryGroq(market: MarketForAi): Promise<AiResolutionResult> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')

  const groq = new Groq({ apiKey })
  const prompt = buildPrompt(market)

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0,
  })

  const raw = completion.choices[0]?.message?.content || ''
  return parseAiJson(raw)
}

async function queryGemini(market: MarketForAi): Promise<AiResolutionResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const prompt = buildPrompt(market)

  const res = await model.generateContent(prompt)
  const raw = res.response.text()
  return parseAiJson(raw)
}

/**
 * Fetch market data for AI resolution (includes answers for multi-choice)
 */
async function getMarketForAi(marketId: string): Promise<MarketForAi | null> {
  const markets = (await sql`
    SELECT id, question, description, market_type, closes_at
    FROM markets
    WHERE id = ${marketId}
    LIMIT 1
  `) as MarketForAi[]

  const market = markets[0]
  if (!market) return null

  if (market.market_type === 'multi') {
    const answers = (await sql`
      SELECT id, text, index
      FROM answers
      WHERE market_id = ${marketId}
      ORDER BY index ASC
    `) as Array<{ id: string; text: string; index: number }>
    market.answers = answers
  }

  return market
}

/**
 * Run AI resolution with both models and determine consensus.
 *
 * Returns agreed=true only when both models agree AND both have confidence > 70.
 * For multi-choice, maps the agreed letter back to answer ID.
 */
export async function resolveWithAi(marketId: string): Promise<AiConsensus> {
  const market = await getMarketForAi(marketId)
  if (!market) throw new Error(`Market ${marketId} not found`)

  const [groqResult, geminiResult] = await Promise.all([
    queryGroq(market),
    queryGemini(market),
  ])

  const agreed =
    groqResult.result === geminiResult.result &&
    groqResult.confidence >= 70 &&
    geminiResult.confidence >= 70

  let agreedResult: string | undefined
  if (agreed) {
    if (market.market_type === 'multi' && market.answers) {
      // Map letter (A, B, C...) → answer UUID
      const idx = OPTION_LETTERS.indexOf(groqResult.result)
      agreedResult = market.answers[idx]?.id ?? groqResult.result
    } else {
      agreedResult = groqResult.result // 'YES' or 'NO'
    }
  }

  return { agreed, agreedResult, groq: groqResult, gemini: geminiResult }
}
