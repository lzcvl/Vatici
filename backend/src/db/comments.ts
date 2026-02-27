/**
 * Comments Database Queries
 */

import { sql } from './client'

export interface CommentRow {
  id: string
  market_id: string
  user_id: string
  body: string
  parent_id: string | null
  author_name: string
  created_at: string
}

/**
 * List comments for a market, newest last.
 */
export async function getComments(marketId: string, limit = 100): Promise<CommentRow[]> {
  const rows = (await sql`
    SELECT c.id, c.market_id, c.user_id, c.body, c.parent_id, c.created_at,
           u.name AS author_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.market_id = ${marketId}
    ORDER BY c.created_at ASC
    LIMIT ${limit}
  `) as CommentRow[]
  return rows
}

/**
 * Insert a new comment and return it with the author name.
 */
export async function addComment(data: {
  marketId: string
  userId: string
  body: string
  parentId?: string
}): Promise<CommentRow> {
  const parentId = data.parentId ?? null

  const rows = (await sql`
    INSERT INTO comments (market_id, user_id, body, parent_id)
    VALUES (${data.marketId}, ${data.userId}, ${data.body}, ${parentId})
    RETURNING id, market_id, user_id, body, parent_id, created_at
  `) as Omit<CommentRow, 'author_name'>[]

  const comment = rows[0]
  if (!comment) throw new Error('Failed to create comment')

  const userRows = (await sql`
    SELECT name FROM users WHERE id = ${data.userId} LIMIT 1
  `) as { name: string }[]

  return { ...comment, author_name: userRows[0]?.name ?? 'Usuário' }
}

/**
 * Delete a comment. Returns true if deleted, false if not found / not owner.
 */
export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM comments
    WHERE id = ${commentId} AND user_id = ${userId}
    RETURNING id
  `) as { id: string }[]
  return rows.length > 0
}
