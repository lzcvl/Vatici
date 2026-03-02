import { calculateCpmmPurchase, getCpmmProbability } from '../src/lib/cpmm'

function formatCentsToBRL(cents: number) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function simulateScenario(name: string, anteCents: number, betCents: number) {
    console.log(`\n===========================================`)
    console.log(`CENÁRIO: ${name}`)
    console.log(`===========================================`)
    console.log(`Liquidez Inicial (Ante): ${formatCentsToBRL(anteCents)} de cada lado`)
    console.log(`Aposta: ${formatCentsToBRL(betCents)} no "SIM"`)

    const pool = { YES: anteCents, NO: anteCents }
    const state = { pool, p: 0.5, collectedFees: { creator: 0, liquidity: 0 } }

    const initialProb = getCpmmProbability(pool, 0.5)
    console.log(`Probabilidade Inicial "SIM": ${(initialProb * 100).toFixed(2)}%`)

    console.log(`\n-> Executando Aposta...`)
    const result = calculateCpmmPurchase(state, betCents, 'YES')

    const finalProb = getCpmmProbability(result.newPool, 0.5)

    const paidFees = result.fees
    const receivedShares = result.shares
    const avgPricePaid = receivedShares > 0 ? (betCents - paidFees) / receivedShares * 100 : 0

    console.log(`-> Resultado:`)
    console.log(`Cotas "SIM" recebidas: ${(receivedShares / 100).toFixed(2)}`)
    console.log(`Taxas Pagas: ${formatCentsToBRL(paidFees)}`)
    console.log(`Preço Médio Pago por cota (esperado: próximo da prob inicial de ~R$0,50): ${formatCentsToBRL(avgPricePaid)}`)
    console.log(`\nEstado Final do Mercado:`)
    console.log(`Pool Final: YES: ${formatCentsToBRL(result.newPool.YES)}, NO: ${formatCentsToBRL(result.newPool.NO)}`)
    console.log(`Probabilidade Final "SIM": ${(finalProb * 100).toFixed(2)}%`)
    console.log(`Slippage (Distorção de Preço): ${((finalProb - initialProb) * 100).toFixed(2)}%`)
}

function runSimulations() {
    console.log(`INICIANDO SIMULAÇÕES CPMM VATICI...\n`)

    // Cenário 1: Pool R$ 10 (Muito fraco, aposta de 100 arrasta o mercado todo)
    simulateScenario('1. Liquidez Fraca (R$ 10)', 1000, 10000)

    // Cenário 2: Pool R$ 100 (Semente Atual que implementamos, aposta de 100 deve balançar um pouco, aposta de 1000 muito)
    simulateScenario('2A. Liquidez Atual do Vatici (R$ 100) vs Aposta Normal (R$ 50)', 10000, 5000)
    simulateScenario('2B. Liquidez Atual do Vatici (R$ 100) vs Grande Aposta/Whale (R$ 1.000)', 10000, 100000)

    // Cenário 3: Pool Profundo (R$ 5.000, aposta de 100 quase nao afeta)
    simulateScenario('3. Mercado de Alta Liquidez (R$ 5.000)', 500000, 10000)
}

runSimulations()
