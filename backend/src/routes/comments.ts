/**
 * Comments Routes
 *
 * GET    /comments/:marketId           — list comments for a market (public)
 * POST   /comments/:marketId           — post a comment (auth required)
 * DELETE /comments/:commentId          — delete own comment (auth required)
 */

import { Hono } from 'hono'
import { getComments, addComment, deleteComment } from '../db/comments'
import { verifyAuth } from '../middleware/auth'
import type { ErrorResponse } from '../mappers'

const app = new Hono()

/** Map DB row to frontend shape */
function mapComment(c: {
  id: string
  body: string
  author_name: string
  parent_id: string | null
  created_at: string
}) {
  return {
    id: c.id,
    body: c.body,
    authorName: c.author_name,
    parentId: c.parent_id,
    createdAt: c.created_at,
  }
}

/**
 * GET /comments/:marketId
 * Returns all comments for a market, oldest first.
 */
app.get('/:marketId', async (c) => {
  try {
    const marketId = c.req.param('marketId')
    const limit = Math.min(parseInt(c.req.query('limit') || '100'), 200)
    const rows = await getComments(marketId, limit)
    return c.json(rows.map(mapComment))
  } catch (err) {
    console.error('GET /comments/:marketId error:', err)
    return c.json({ error: 'Failed to fetch comments' } as ErrorResponse, 500)
  }
})

/**
 * POST /comments/:marketId
 * Body: { body: string, parentId?: string }
 */
app.post('/:marketId', async (c) => {
  try {
    const userId = await verifyAuth(c)
    const marketId = c.req.param('marketId')
    const body = await c.req.json<{ body?: string; parentId?: string }>()

    if (!body.body?.trim()) {
      return c.json({ error: 'Comment body is required' } as ErrorResponse, 400)
    }
    if (body.body.length > 2000) {
      return c.json({ error: 'Comment too long (max 2000 characters)' } as ErrorResponse, 400)
    }

    const comment = await addComment({
      marketId,
      userId,
      body: body.body.trim(),
      parentId: body.parentId,
    })

    return c.json(mapComment(comment), 201)
  } catch (err) {
    console.error('POST /comments/:marketId error:', err)
    return c.json({ error: 'Failed to post comment' } as ErrorResponse, 500)
  }
})

/**
 * DELETE /comments/:commentId
 * Deletes own comment only.
 */
app.delete('/:commentId', async (c) => {
  try {
    const userId = await verifyAuth(c)
    const commentId = c.req.param('commentId')
    const deleted = await deleteComment(commentId, userId)
    if (!deleted) {
      return c.json({ error: 'Comment not found or unauthorized' } as ErrorResponse, 404)
    }
    return c.json({ success: true })
  } catch (err) {
    console.error('DELETE /comments/:commentId error:', err)
    return c.json({ error: 'Failed to delete comment' } as ErrorResponse, 500)
  }
})

export default app
