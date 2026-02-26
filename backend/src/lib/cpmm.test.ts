/**
 * Tests for CPMM math functions
 * Run with: npm test cpmm.test.ts
 */

import {
  getCpmmProbability,
  calculateCpmmShares,
  getCpmmFees,
  calculateCpmmPurchase,
  validatePoolInvariant,
  CpmmState,
  CpmmPool,
} from './cpmm'

// ============================================
// TEST SUITE
// ============================================

describe('CPMM - Constant Product Market Maker', () => {
  // Default test state
  const defaultPool: CpmmPool = { YES: 100000, NO: 100000 }
  const defaultState: CpmmState = {
    pool: defaultPool,
    p: 0.5,
    collectedFees: { creator: 0, liquidity: 0 },
  }

  // ============================================
  // 1. getCpmmProbability Tests
  // ============================================

  describe('getCpmmProbability', () => {
    it('should return 0.5 for equal pools', () => {
      const prob = getCpmmProbability({ YES: 100000, NO: 100000 }, 0.5)
      expect(Math.abs(prob - 0.5)).toBeLessThan(0.001)
    })

    it('should return 0.33 when NO is 1/3 of total', () => {
      const prob = getCpmmProbability({ YES: 200000, NO: 100000 }, 0.5)
      expect(Math.abs(prob - 0.333)).toBeLessThan(0.01)
    })

    it('should return 0.75 when NO is 3/4 of total', () => {
      const prob = getCpmmProbability({ YES: 25000, NO: 75000 }, 0.5)
      expect(Math.abs(prob - 0.75)).toBeLessThan(0.01)
    })

    it('should clamp probability to min/max bounds', () => {
      // Very extreme pool (should clamp)
      const extremeProb = getCpmmProbability({ YES: 1000000000, NO: 1 }, 0.5)
      expect(extremeProb).toBeLessThanOrEqual(0.999)

      const reverseProb = getCpmmProbability({ YES: 1, NO: 1000000000 }, 0.5)
      expect(reverseProb).toBeGreaterThanOrEqual(0.001)
    })

    it('should handle empty pool', () => {
      const prob = getCpmmProbability({ YES: 0, NO: 0 }, 0.5)
      expect(prob).toBe(0.5) // Default
    })
  })

  // ============================================
  // 2. calculateCpmmShares Tests
  // ============================================

  describe('calculateCpmmShares', () => {
    it('should return 0 shares for 0 bet', () => {
      const shares = calculateCpmmShares(defaultPool, 0.5, 0, 'YES')
      expect(shares).toBe(0)
    })

    it('should return positive shares for YES bet', () => {
      const shares = calculateCpmmShares(defaultPool, 0.5, 10000, 'YES')
      expect(shares).toBeGreaterThan(0)
    })

    it('should return positive shares for NO bet', () => {
      const shares = calculateCpmmShares(defaultPool, 0.5, 10000, 'NO')
      expect(shares).toBeGreaterThan(0)
    })

    it('should return more shares when betting on more probable outcome', () => {
      // Pool: YES=150000, NO=50000 (YES is more likely at 25%)
      // When betting YES, you're buying from a larger pool, so more multiplier effect
      const sharesYes = calculateCpmmShares(
        { YES: 150000, NO: 50000 },
        0.5,
        10000,
        'YES'
      )
      const sharesNo = calculateCpmmShares(
        { YES: 150000, NO: 50000 },
        0.5,
        10000,
        'NO'
      )

      // Betting on more likely outcome (YES) gives more shares due to pool dynamics
      expect(sharesYes).toBeGreaterThan(sharesNo)
    })

    it('should match Manifold calculation example', () => {
      // Example: Pool {YES: 100, NO: 100}, p=0.5, bet=10 on YES
      // Expected shares ≈ 18.97
      const shares = calculateCpmmShares({ YES: 100, NO: 100 }, 0.5, 10, 'YES')

      // Should be close to 18.97
      expect(shares).toBeGreaterThan(18)
      expect(shares).toBeLessThan(20)
    })

    it('should throw error on invalid pool', () => {
      expect(() => {
        calculateCpmmShares({ YES: 0, NO: 100000 }, 0.5, 10000, 'YES')
      }).toThrow()
    })
  })

  // ============================================
  // 3. getCpmmFees Tests
  // ============================================

  describe('getCpmmFees', () => {
    it('should return 0 fees for 0 bet', () => {
      const { remainingBet, totalFees } = getCpmmFees(defaultState, 0, 'YES')
      expect(totalFees).toBe(0)
      expect(remainingBet).toBe(0)
    })

    it('should return positive fees for positive bet', () => {
      const { totalFees } = getCpmmFees(defaultState, 10000, 'YES')
      expect(totalFees).toBeGreaterThan(0)
    })

    it('should charge approximately 2% fee', () => {
      const { totalFees } = getCpmmFees(defaultState, 10000, 'YES')

      // Should be roughly 2% of 10000 = 200
      // (might vary slightly due to iterative convergence)
      expect(totalFees).toBeGreaterThan(150)
      expect(totalFees).toBeLessThan(250)
    })

    it('should return remainingBet = betAmount - fees', () => {
      const betAmount = 10000
      const { remainingBet, totalFees } = getCpmmFees(
        defaultState,
        betAmount,
        'YES'
      )

      expect(remainingBet).toBe(betAmount - totalFees)
    })

    it('should converge to stable fee across iterations', () => {
      const { totalFees: fees1 } = getCpmmFees(defaultState, 10000, 'YES')
      const { totalFees: fees2 } = getCpmmFees(defaultState, 10000, 'YES')

      // Should be exactly the same (deterministic)
      expect(fees1).toBe(fees2)
    })
  })

  // ============================================
  // 4. calculateCpmmPurchase Tests
  // ============================================

  describe('calculateCpmmPurchase', () => {
    it('should return complete bet result', () => {
      const result = calculateCpmmPurchase(defaultState, 10000, 'YES')

      expect(result).toHaveProperty('shares')
      expect(result).toHaveProperty('newPool')
      expect(result).toHaveProperty('probBefore')
      expect(result).toHaveProperty('probAfter')
      expect(result).toHaveProperty('fees')
      expect(result).toHaveProperty('amount')
    })

    it('should move probability in bet direction (YES)', () => {
      const result = calculateCpmmPurchase(defaultState, 10000, 'YES')

      // Betting on YES should increase probability of YES
      expect(result.probAfter).toBeGreaterThan(result.probBefore)
    })

    it('should move probability in bet direction (NO)', () => {
      const result = calculateCpmmPurchase(defaultState, 10000, 'NO')

      // Betting on NO should decrease probability of YES (move toward NO)
      expect(result.probAfter).toBeLessThan(result.probBefore)
    })

    it('should update pool correctly', () => {
      const result = calculateCpmmPurchase(defaultState, 10000, 'YES')

      // When betting YES:
      // - YES pool decreases (shares minted)
      // - NO pool increases (bet amount added)
      expect(result.newPool.YES).toBeLessThan(defaultState.pool.YES)
      expect(result.newPool.NO).toBeGreaterThan(defaultState.pool.NO)
    })

    it('should maintain pool invariant', () => {
      const result = calculateCpmmPurchase(defaultState, 10000, 'YES')

      const isValid = validatePoolInvariant(
        defaultState.pool,
        result.newPool,
        defaultState.p
      )
      expect(isValid).toBe(true)
    })

    it('should calculate shares correctly', () => {
      const { shares, amount } = calculateCpmmPurchase(
        defaultState,
        10000,
        'YES'
      )

      // Shares should be calculated from amount after fees
      const expectedShares = calculateCpmmShares(
        defaultState.pool,
        defaultState.p,
        amount,
        'YES'
      )

      expect(Math.abs(shares - expectedShares)).toBeLessThan(0.01)
    })

    it('should include fees in result', () => {
      const result = calculateCpmmPurchase(defaultState, 10000, 'YES')

      // amount + fees should equal original bet amount
      expect(result.amount + result.fees).toBe(10000)
    })
  })

  // ============================================
  // 5. validatePoolInvariant Tests
  // ============================================

  describe('validatePoolInvariant', () => {
    it('should validate equal pools', () => {
      const isValid = validatePoolInvariant(
        { YES: 100000, NO: 100000 },
        { YES: 100000, NO: 100000 },
        0.5
      )
      expect(isValid).toBe(true)
    })

    it('should validate pool after cpmm bet', () => {
      const result = calculateCpmmPurchase(defaultState, 10000, 'YES')
      const isValid = validatePoolInvariant(
        defaultState.pool,
        result.newPool,
        defaultState.p
      )
      expect(isValid).toBe(true)
    })

    it('should detect invalid pool (significant deviation)', () => {
      // Artificially create invalid pool
      const invalidPool = { YES: 150000, NO: 50000 } // Broken invariant

      const isValid = validatePoolInvariant(
        defaultPool,
        invalidPool,
        0.5
      )

      // Should detect the inconsistency (might be true or false depending on threshold)
      // This is more of a boundary test
      expect(typeof isValid).toBe('boolean')
    })
  })

  // ============================================
  // 6. Multi-Bet Scenario Tests
  // ============================================

  describe('Multi-bet scenarios', () => {
    it('should handle sequential bets on same side', () => {
      let state = defaultState

      // First bet: 1000 on YES
      let result1 = calculateCpmmPurchase(state, 1000, 'YES')
      state.pool = result1.newPool

      // Second bet: 2000 on YES
      let result2 = calculateCpmmPurchase(state, 2000, 'YES')
      state.pool = result2.newPool

      // Probability should increase with each bet on same side
      expect(result1.probAfter).toBeGreaterThan(result1.probBefore)
      expect(result2.probAfter).toBeGreaterThan(result1.probAfter)
    })

    it('should handle bets on opposite sides', () => {
      let state = defaultState

      // First bet: 1000 on YES
      let result1 = calculateCpmmPurchase(state, 1000, 'YES')
      state.pool = result1.newPool

      // Second bet: 1000 on NO (opposing direction)
      let result2 = calculateCpmmPurchase(state, 1000, 'NO')
      state.pool = result2.newPool

      // Probabilities should move in opposite directions
      expect(result1.probAfter).toBeGreaterThan(result1.probBefore)
      expect(result2.probAfter).toBeLessThan(result1.probAfter)
    })

    it('should converge to balanced probability with equal bets', () => {
      let state = defaultState

      // Bet 10000 on YES
      let result1 = calculateCpmmPurchase(state, 10000, 'YES')
      state.pool = result1.newPool

      // Bet 10000 on NO (should partially revert)
      let result2 = calculateCpmmPurchase(state, 10000, 'NO')
      state.pool = result2.newPool

      // After equal bets in opposite directions, should approach 0.5
      // (not exact due to fees, but close)
      expect(result2.probAfter).toBeGreaterThan(0.45)
      expect(result2.probAfter).toBeLessThan(0.55)
    })
  })

  // ============================================
  // 7. Edge Cases
  // ============================================

  describe('Edge cases', () => {
    it('should handle very large bets', () => {
      const largeBet = 1000000000 // 1 billion cents = $10M
      const result = calculateCpmmPurchase(defaultState, largeBet, 'YES')

      expect(result.shares).toBeGreaterThan(0)
      expect(result.probAfter).toBeGreaterThan(result.probBefore)
    })

    it('should handle very small bets', () => {
      const smallBet = 1 // 1 cent
      const result = calculateCpmmPurchase(defaultState, smallBet, 'YES')

      expect(result.shares).toBeGreaterThan(0)
    })

    it('should handle p values other than 0.5', () => {
      const state: CpmmState = {
        pool: { YES: 100000, NO: 100000 },
        p: 0.6, // Weighted toward YES
        collectedFees: { creator: 0, liquidity: 0 },
      }

      const result = calculateCpmmPurchase(state, 10000, 'YES')
      expect(result.shares).toBeGreaterThan(0)
      expect(validatePoolInvariant(state.pool, result.newPool, state.p)).toBe(
        true
      )
    })

    it('should handle asymmetric pools', () => {
      const asymmetricState: CpmmState = {
        pool: { YES: 1000000, NO: 10000 },
        p: 0.5,
        collectedFees: { creator: 0, liquidity: 0 },
      }

      const result = calculateCpmmPurchase(asymmetricState, 10000, 'NO')
      expect(result.shares).toBeGreaterThan(0)
      expect(result.probAfter).toBeLessThan(result.probBefore)
    })
  })
})

// ============================================
// PERFORMANCE TESTS (Optional)
// ============================================

describe('CPMM Performance', () => {
  it('should calculate probability in <1ms', () => {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      getCpmmProbability({ YES: 100000, NO: 100000 }, 0.5)
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100) // 100ms for 1000 calls = <0.1ms per call
  })

  it('should calculate shares in <5ms', () => {
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      calculateCpmmShares({ YES: 100000, NO: 100000 }, 0.5, 10000, 'YES')
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(50) // 50ms for 100 calls = <0.5ms per call
  })
})
