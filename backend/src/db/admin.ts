import { sql } from './client'

export interface AdminStats {
    totalUsers: number;
    totalMarkets: number;
    totalVolume: number;
    totalBets: number;
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    balance: number;
    is_banned: boolean;
    registration_ip: string | null;
    last_ip: string | null;
    created_at: string;
}

export async function getAdminStats(): Promise<AdminStats> {
    const [usersCount, marketsCount, volumeResult, betsCount] = await Promise.all([
        sql`SELECT count(*) as c FROM users`,
        sql`SELECT count(*) as c FROM markets`,
        sql`SELECT sum(total_volume) as v FROM markets`,
        sql`SELECT count(*) as c FROM bets`
    ])

    return {
        totalUsers: parseInt(usersCount[0]?.c || '0', 10),
        totalMarkets: parseInt(marketsCount[0]?.c || '0', 10),
        totalVolume: parseInt(volumeResult[0]?.v || '0', 10) / 100, // cents to real
        totalBets: parseInt(betsCount[0]?.c || '0', 10)
    }
}

export async function getAdminUsers(limit = 50, offset = 0, search = ''): Promise<AdminUser[]> {
    const query = search
        ? sql`
        SELECT u.id, u.name, u.email, u.is_banned, u.registration_ip, u.last_ip, u.created_at, b.balance
        FROM users u
        LEFT JOIN user_balances b ON u.id = b.user_id
        WHERE u.name ILIKE ${'%' + search + '%'} OR u.email ILIKE ${'%' + search + '%'}
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
        : sql`
        SELECT u.id, u.name, u.email, u.is_banned, u.registration_ip, u.last_ip, u.created_at, b.balance
        FROM users u
        LEFT JOIN user_balances b ON u.id = b.user_id
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

    const rows = await query;

    return rows.map(r => ({
        ...r,
        balance: parseInt(r.balance || '0', 10) / 100 // cents to real
    })) as AdminUser[];
}

export async function toggleUserBan(userId: string): Promise<boolean> {
    const rows = await sql`
    UPDATE users 
    SET is_banned = NOT is_banned 
    WHERE id = ${userId}
    RETURNING is_banned
  `
    return rows[0]?.is_banned ?? false;
}

export async function adhocTransaction(userId: string, amountCents: number, description: string): Promise<number> {
    // 1. Get current balance
    const userRows = await sql`SELECT balance FROM user_balances WHERE user_id = ${userId} LIMIT 1`
    if (!userRows[0]) throw new Error('User balance not found')

    const currentBalance = Number(userRows[0].balance)
    const newBalance = currentBalance + amountCents

    // 2. Update balance
    await sql`UPDATE user_balances SET balance = ${newBalance} WHERE user_id = ${userId}`

    // 3. Record transaction
    await sql`
    INSERT INTO transactions (user_id, type, amount, balance_after, description)
    VALUES (${userId}, 'bonus', ${amountCents}, ${newBalance}, ${description})
  `

    return newBalance
}
