// ============================================
// TIPOS - serao conectados ao backend depois
// ============================================

export interface User {
  id: string
  name: string
  email: string
  balance: number // saldo em BRL disponivel para apostar
}

export interface MarketOption {
  id: string
  label: { pt: string; en: string; es: string }
  probability: number // 0 a 1
  pool: number // total apostado nessa opcao
}

export interface Market {
  id: string
  type: "binary" | "multi"
  iconUrl?: string // icone pequeno do mercado (webp/jpg, 64x64)
  question: {
    pt: string
    en: string
    es: string
  }
  description: {
    pt: string
    en: string
    es: string
  }
  category: string
  probability: number // 0 a 1 (para binary: chance de YES; para multi: maior opcao)
  volume: number // total apostado em BRL
  yesPool: number
  noPool: number
  options?: MarketOption[] // apenas para type: "multi"
  closesAt: string // ISO date
  resolvedAt: string | null
  resolution: "YES" | "NO" | string | null // string para multi (id da opcao vencedora)
  createdAt: string // ISO date
  trending: boolean
  probabilityHistory: ProbabilityHistory[]
}

export interface Bet {
  id: string
  userId: string
  userName: string
  marketId: string
  direction: "YES" | "NO"
  amount: number // quanto apostou em BRL
  shares: number // cotas recebidas
  avgPrice: number // probabilidade no momento da aposta
  potentialPayout: number // quanto recebe se ganhar
  createdAt: string // ISO date
}

export interface ProbabilityHistory {
  date: string
  probability: number
}

// ============================================
// DADOS MOCKADOS
// ============================================

export const currentUser: User = {
  id: "user_1",
  name: "Rafael Costa",
  email: "rafael@email.com",
  balance: 1250.75,
}

export const markets: Market[] = [
  {
    id: "market_1",
    type: "binary",
    iconUrl: "/icons/markets/election.jpg",
    question: {
      pt: "Lula termina o mandato em 2026?",
      en: "Will Lula finish his term in 2026?",
      es: "Lula termina el mandato en 2026?",
    },
    description: {
      pt: "Resolves YES se Lula completar o mandato presidencial ate 31/12/2026.",
      en: "Resolves YES if Lula completes the presidential term by 12/31/2026.",
      es: "Se resuelve YES si Lula completa el mandato presidencial hasta el 31/12/2026.",
    },
    category: "politics",
    probability: 0.73,
    volume: 154320.5,
    yesPool: 112654.0,
    noPool: 41666.5,
    closesAt: "2026-12-31T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2024-01-15T10:00:00Z",
    trending: true,
    probabilityHistory: [
      { date: "2025-07", probability: 0.65 },
      { date: "2025-08", probability: 0.68 },
      { date: "2025-09", probability: 0.70 },
      { date: "2025-10", probability: 0.69 },
      { date: "2025-11", probability: 0.71 },
      { date: "2025-12", probability: 0.72 },
      { date: "2026-01", probability: 0.74 },
      { date: "2026-02", probability: 0.73 },
    ],
  },
  {
    id: "market_2",
    type: "binary",
    iconUrl: "/icons/markets/bitcoin.jpg",
    question: {
      pt: "Bitcoin ultrapassa $150k em 2026?",
      en: "Will Bitcoin surpass $150k in 2026?",
      es: "Bitcoin supera los $150k en 2026?",
    },
    description: {
      pt: "Resolves YES se o preco do Bitcoin atingir $150.000 USD ou mais em qualquer exchange listada no CoinGecko antes de 31/12/2026.",
      en: "Resolves YES if the Bitcoin price reaches $150,000 USD or more on any CoinGecko listed exchange before 12/31/2026.",
      es: "Se resuelve YES si el precio de Bitcoin alcanza $150,000 USD o mas en cualquier exchange listado en CoinGecko antes del 31/12/2026.",
    },
    category: "crypto",
    probability: 0.61,
    volume: 289450.0,
    yesPool: 176565.5,
    noPool: 112884.5,
    closesAt: "2026-12-31T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2024-03-10T14:00:00Z",
    trending: true,
    probabilityHistory: [
      { date: "2025-07", probability: 0.45 },
      { date: "2025-08", probability: 0.50 },
      { date: "2025-09", probability: 0.48 },
      { date: "2025-10", probability: 0.52 },
      { date: "2025-11", probability: 0.55 },
      { date: "2025-12", probability: 0.58 },
      { date: "2026-01", probability: 0.60 },
      { date: "2026-02", probability: 0.61 },
    ],
  },
  {
    id: "market_3",
    type: "binary",
    iconUrl: "/icons/markets/football.jpg",
    question: {
      pt: "Brasil ganha a Copa do Mundo 2026?",
      en: "Will Brazil win the 2026 World Cup?",
      es: "Brasil gana el Mundial 2026?",
    },
    description: {
      pt: "Resolves YES se a Selecao Brasileira vencer a Copa do Mundo FIFA 2026.",
      en: "Resolves YES if Brazil wins the FIFA 2026 World Cup.",
      es: "Se resuelve YES si la Seleccion Brasilena gana la Copa del Mundo FIFA 2026.",
    },
    category: "sports",
    probability: 0.18,
    volume: 98760.0,
    yesPool: 17776.8,
    noPool: 80983.2,
    closesAt: "2026-07-19T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2024-06-01T08:00:00Z",
    trending: true,
    probabilityHistory: [
      { date: "2025-07", probability: 0.22 },
      { date: "2025-08", probability: 0.20 },
      { date: "2025-09", probability: 0.19 },
      { date: "2025-10", probability: 0.21 },
      { date: "2025-11", probability: 0.20 },
      { date: "2025-12", probability: 0.19 },
      { date: "2026-01", probability: 0.18 },
      { date: "2026-02", probability: 0.18 },
    ],
  },
  {
    id: "market_4",
    type: "binary",
    iconUrl: "/icons/markets/climate.jpg",
    question: {
      pt: "SpaceX pousa na Lua antes de 2027?",
      en: "Will SpaceX land on the Moon before 2027?",
      es: "SpaceX aterriza en la Luna antes de 2027?",
    },
    description: {
      pt: "Resolves YES se a SpaceX conseguir pousar uma nave na superficie da Lua antes de 01/01/2027.",
      en: "Resolves YES if SpaceX lands a spacecraft on the Moon's surface before 01/01/2027.",
      es: "Se resuelve YES si SpaceX logra aterrizar una nave en la superficie de la Luna antes del 01/01/2027.",
    },
    category: "science",
    probability: 0.25,
    volume: 67890.0,
    yesPool: 16972.5,
    noPool: 50917.5,
    closesAt: "2026-12-31T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2024-05-20T12:00:00Z",
    trending: false,
    probabilityHistory: [
      { date: "2025-07", probability: 0.30 },
      { date: "2025-08", probability: 0.28 },
      { date: "2025-09", probability: 0.27 },
      { date: "2025-10", probability: 0.26 },
      { date: "2025-11", probability: 0.25 },
      { date: "2025-12", probability: 0.24 },
      { date: "2026-01", probability: 0.25 },
      { date: "2026-02", probability: 0.25 },
    ],
  },
  {
    id: "market_5",
    type: "binary",
    iconUrl: "/icons/markets/stocks.jpg",
    question: {
      pt: "Selic abaixo de 10% ate dezembro 2026?",
      en: "Will Selic rate be below 10% by December 2026?",
      es: "Selic por debajo del 10% hasta diciembre 2026?",
    },
    description: {
      pt: "Resolves YES se a taxa Selic estiver abaixo de 10% ao ano na reuniao do COPOM de dezembro de 2026.",
      en: "Resolves YES if the Selic rate is below 10% per year at the December 2026 COPOM meeting.",
      es: "Se resuelve YES si la tasa Selic esta por debajo del 10% anual en la reunion del COPOM de diciembre de 2026.",
    },
    category: "economy",
    probability: 0.15,
    volume: 45230.0,
    yesPool: 6784.5,
    noPool: 38445.5,
    closesAt: "2026-12-15T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2024-08-01T09:00:00Z",
    trending: false,
    probabilityHistory: [
      { date: "2025-07", probability: 0.20 },
      { date: "2025-08", probability: 0.18 },
      { date: "2025-09", probability: 0.17 },
      { date: "2025-10", probability: 0.16 },
      { date: "2025-11", probability: 0.15 },
      { date: "2025-12", probability: 0.14 },
      { date: "2026-01", probability: 0.15 },
      { date: "2026-02", probability: 0.15 },
    ],
  },
  {
    id: "market_6",
    type: "binary",
    iconUrl: "/icons/markets/ethereum.jpg",
    question: {
      pt: "Ethereum ultrapassa $10k em 2026?",
      en: "Will Ethereum surpass $10k in 2026?",
      es: "Ethereum supera los $10k en 2026?",
    },
    description: {
      pt: "Resolves YES se o preco do Ethereum atingir $10.000 USD ou mais antes de 31/12/2026.",
      en: "Resolves YES if Ethereum price reaches $10,000 USD or more before 12/31/2026.",
      es: "Se resuelve YES si el precio de Ethereum alcanza $10,000 USD o mas antes del 31/12/2026.",
    },
    category: "crypto",
    probability: 0.42,
    volume: 178900.0,
    yesPool: 75138.0,
    noPool: 103762.0,
    closesAt: "2026-12-31T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2024-04-22T16:00:00Z",
    trending: true,
    probabilityHistory: [
      { date: "2025-07", probability: 0.35 },
      { date: "2025-08", probability: 0.38 },
      { date: "2025-09", probability: 0.36 },
      { date: "2025-10", probability: 0.40 },
      { date: "2025-11", probability: 0.41 },
      { date: "2025-12", probability: 0.43 },
      { date: "2026-01", probability: 0.42 },
      { date: "2026-02", probability: 0.42 },
    ],
  },
  {
    id: "market_7",
    type: "binary",
    iconUrl: "/icons/markets/ai.jpg",
    question: {
      pt: "IA ganha o Nobel de Fisica em 2026?",
      en: "Will AI win the Nobel Prize in Physics in 2026?",
      es: "La IA gana el Nobel de Fisica en 2026?",
    },
    description: {
      pt: "Resolves YES se um sistema de IA for co-premiado ou citado como contribuidor principal no Nobel de Fisica de 2026.",
      en: "Resolves YES if an AI system is co-awarded or cited as a principal contributor in the 2026 Nobel Prize in Physics.",
      es: "Se resuelve YES si un sistema de IA es co-premiado o citado como contribuidor principal en el Nobel de Fisica de 2026.",
    },
    category: "science",
    probability: 0.08,
    volume: 23450.0,
    yesPool: 1876.0,
    noPool: 21574.0,
    closesAt: "2026-10-10T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2024-11-05T10:00:00Z",
    trending: false,
    probabilityHistory: [
      { date: "2025-07", probability: 0.12 },
      { date: "2025-08", probability: 0.11 },
      { date: "2025-09", probability: 0.10 },
      { date: "2025-10", probability: 0.09 },
      { date: "2025-11", probability: 0.09 },
      { date: "2025-12", probability: 0.08 },
      { date: "2026-01", probability: 0.08 },
      { date: "2026-02", probability: 0.08 },
    ],
  },
  {
    id: "market_8",
    type: "binary",
    iconUrl: "/icons/markets/space.jpg",
    question: {
      pt: "Novo filme da Marvel ultrapassa $2B de bilheteria?",
      en: "Will the new Marvel movie surpass $2B box office?",
      es: "La nueva pelicula de Marvel supera los $2B en taquilla?",
    },
    description: {
      pt: "Resolves YES se o proximo filme do MCU ultrapassar 2 bilhoes de dolares em bilheteria mundial.",
      en: "Resolves YES if the next MCU film surpasses 2 billion dollars in worldwide box office.",
      es: "Se resuelve YES si la proxima pelicula del MCU supera los 2 mil millones de dolares en taquilla mundial.",
    },
    category: "entertainment",
    probability: 0.35,
    volume: 34560.0,
    yesPool: 12096.0,
    noPool: 22464.0,
    closesAt: "2026-12-31T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2025-01-10T14:00:00Z",
    trending: false,
    probabilityHistory: [
      { date: "2025-07", probability: 0.30 },
      { date: "2025-08", probability: 0.32 },
      { date: "2025-09", probability: 0.33 },
      { date: "2025-10", probability: 0.34 },
      { date: "2025-11", probability: 0.35 },
      { date: "2025-12", probability: 0.34 },
      { date: "2026-01", probability: 0.35 },
      { date: "2026-02", probability: 0.35 },
    ],
  },
  {
    id: "market_9",
    type: "binary",
    iconUrl: "/icons/markets/brazil-reform.jpg",
    question: {
      pt: "Apple lanca oculos de RA acessiveis em 2026?",
      en: "Will Apple launch affordable AR glasses in 2026?",
      es: "Apple lanza gafas de RA asequibles en 2026?",
    },
    description: {
      pt: "Resolves YES se a Apple lancar um dispositivo de realidade aumentada com preco abaixo de $1.000 USD em 2026.",
      en: "Resolves YES if Apple launches an AR device priced below $1,000 USD in 2026.",
      es: "Se resuelve YES si Apple lanza un dispositivo de realidad aumentada con precio inferior a $1,000 USD en 2026.",
    },
    category: "technology",
    probability: 0.22,
    volume: 56780.0,
    yesPool: 12491.6,
    noPool: 44288.4,
    closesAt: "2026-12-31T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2025-02-14T11:00:00Z",
    trending: true,
    probabilityHistory: [
      { date: "2025-07", probability: 0.30 },
      { date: "2025-08", probability: 0.28 },
      { date: "2025-09", probability: 0.26 },
      { date: "2025-10", probability: 0.25 },
      { date: "2025-11", probability: 0.24 },
      { date: "2025-12", probability: 0.23 },
      { date: "2026-01", probability: 0.22 },
      { date: "2026-02", probability: 0.22 },
    ],
  },

  // ============================================
  // MERCADOS MULTI-OPCAO
  // ============================================
  {
    id: "market_10",
    type: "multi",
    iconUrl: "/icons/markets/bbb.jpg",
    question: {
      pt: "Quem vai ganhar o BBB 2026?",
      en: "Who will win Big Brother Brazil 2026?",
      es: "Quien ganara el BBB 2026?",
    },
    description: {
      pt: "Resolves para o participante que vencer a final do Big Brother Brasil 2026.",
      en: "Resolves to the contestant who wins the Big Brother Brazil 2026 finale.",
      es: "Se resuelve al participante que gane la final del Big Brother Brasil 2026.",
    },
    category: "entertainment",
    probability: 0.22,
    volume: 312500.0,
    yesPool: 0,
    noPool: 0,
    options: [
      { id: "opt_10_1", label: { pt: "Joana Ribeiro", en: "Joana Ribeiro", es: "Joana Ribeiro" }, probability: 0.22, pool: 68750 },
      { id: "opt_10_2", label: { pt: "Lucas Ferreira", en: "Lucas Ferreira", es: "Lucas Ferreira" }, probability: 0.19, pool: 59375 },
      { id: "opt_10_3", label: { pt: "Camila Santos", en: "Camila Santos", es: "Camila Santos" }, probability: 0.16, pool: 50000 },
      { id: "opt_10_4", label: { pt: "Pedro Almeida", en: "Pedro Almeida", es: "Pedro Almeida" }, probability: 0.14, pool: 43750 },
      { id: "opt_10_5", label: { pt: "Ana Clara", en: "Ana Clara", es: "Ana Clara" }, probability: 0.11, pool: 34375 },
      { id: "opt_10_6", label: { pt: "Thiago Souza", en: "Thiago Souza", es: "Thiago Souza" }, probability: 0.08, pool: 25000 },
      { id: "opt_10_7", label: { pt: "Fernanda Lima", en: "Fernanda Lima", es: "Fernanda Lima" }, probability: 0.06, pool: 18750 },
      { id: "opt_10_8", label: { pt: "Rafael Dias", en: "Rafael Dias", es: "Rafael Dias" }, probability: 0.04, pool: 12500 },
    ],
    closesAt: "2026-04-22T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2026-01-20T20:00:00Z",
    trending: true,
    probabilityHistory: [
      { date: "2026-01", probability: 0.18 },
      { date: "2026-02", probability: 0.22 },
    ],
  },
  {
    id: "market_11",
    type: "multi",
    iconUrl: "/icons/markets/president.jpg",
    question: {
      pt: "Quem sera o proximo presidente do Brasil?",
      en: "Who will be the next president of Brazil?",
      es: "Quien sera el proximo presidente de Brasil?",
    },
    description: {
      pt: "Resolves para o candidato eleito presidente do Brasil nas eleicoes de outubro de 2026.",
      en: "Resolves to the candidate elected president of Brazil in the October 2026 elections.",
      es: "Se resuelve al candidato elegido presidente de Brasil en las elecciones de octubre de 2026.",
    },
    category: "politics",
    probability: 0.28,
    volume: 487200.0,
    yesPool: 0,
    noPool: 0,
    options: [
      { id: "opt_11_1", label: { pt: "Tarcisio de Freitas", en: "Tarcisio de Freitas", es: "Tarcisio de Freitas" }, probability: 0.28, pool: 136416 },
      { id: "opt_11_2", label: { pt: "Lula (reeleicao)", en: "Lula (reelection)", es: "Lula (reeleccion)" }, probability: 0.24, pool: 116928 },
      { id: "opt_11_3", label: { pt: "Ciro Gomes", en: "Ciro Gomes", es: "Ciro Gomes" }, probability: 0.15, pool: 73080 },
      { id: "opt_11_4", label: { pt: "Simone Tebet", en: "Simone Tebet", es: "Simone Tebet" }, probability: 0.12, pool: 58464 },
      { id: "opt_11_5", label: { pt: "Outro candidato", en: "Other candidate", es: "Otro candidato" }, probability: 0.21, pool: 102312 },
    ],
    closesAt: "2026-10-31T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2025-06-01T10:00:00Z",
    trending: true,
    probabilityHistory: [
      { date: "2025-07", probability: 0.25 },
      { date: "2025-08", probability: 0.26 },
      { date: "2025-09", probability: 0.24 },
      { date: "2025-10", probability: 0.27 },
      { date: "2025-11", probability: 0.26 },
      { date: "2025-12", probability: 0.27 },
      { date: "2026-01", probability: 0.28 },
      { date: "2026-02", probability: 0.28 },
    ],
  },
  {
    id: "market_12",
    type: "multi",
    iconUrl: "/icons/markets/worldcup.jpg",
    question: {
      pt: "Quem vai ganhar a Copa do Mundo 2026?",
      en: "Who will win the 2026 World Cup?",
      es: "Quien ganara el Mundial 2026?",
    },
    description: {
      pt: "Resolves para a selecao que vencer a final da Copa do Mundo FIFA 2026 nos EUA, Mexico e Canada.",
      en: "Resolves to the team that wins the 2026 FIFA World Cup final in the USA, Mexico and Canada.",
      es: "Se resuelve a la seleccion que gane la final del Mundial FIFA 2026 en EE.UU., Mexico y Canada.",
    },
    category: "sports",
    probability: 0.20,
    volume: 523800.0,
    yesPool: 0,
    noPool: 0,
    options: [
      { id: "opt_12_1", label: { pt: "Argentina", en: "Argentina", es: "Argentina" }, probability: 0.20, pool: 104760 },
      { id: "opt_12_2", label: { pt: "Franca", en: "France", es: "Francia" }, probability: 0.18, pool: 94284 },
      { id: "opt_12_3", label: { pt: "Brasil", en: "Brazil", es: "Brasil" }, probability: 0.14, pool: 73332 },
      { id: "opt_12_4", label: { pt: "Inglaterra", en: "England", es: "Inglaterra" }, probability: 0.12, pool: 62856 },
      { id: "opt_12_5", label: { pt: "Espanha", en: "Spain", es: "Espana" }, probability: 0.11, pool: 57618 },
      { id: "opt_12_6", label: { pt: "Alemanha", en: "Germany", es: "Alemania" }, probability: 0.09, pool: 47142 },
    ],
    closesAt: "2026-07-19T23:59:59Z",
    resolvedAt: null,
    resolution: null,
    createdAt: "2025-03-15T12:00:00Z",
    trending: true,
    probabilityHistory: [
      { date: "2025-07", probability: 0.18 },
      { date: "2025-08", probability: 0.19 },
      { date: "2025-09", probability: 0.19 },
      { date: "2025-10", probability: 0.20 },
      { date: "2025-11", probability: 0.20 },
      { date: "2025-12", probability: 0.20 },
      { date: "2026-01", probability: 0.20 },
      { date: "2026-02", probability: 0.20 },
    ],
  },
]

export const userBets: Bet[] = [
  {
    id: "bet_1",
    userId: "user_1",
    userName: "Rafael Costa",
    marketId: "market_1",
    direction: "YES",
    amount: 150.0,
    shares: 205.47,
    avgPrice: 0.73,
    potentialPayout: 205.47,
    createdAt: "2024-02-10T14:23:00Z",
  },
  {
    id: "bet_2",
    userId: "user_1",
    userName: "Rafael Costa",
    marketId: "market_2",
    direction: "YES",
    amount: 200.0,
    shares: 327.87,
    avgPrice: 0.61,
    potentialPayout: 327.87,
    createdAt: "2024-03-15T09:10:00Z",
  },
  {
    id: "bet_3",
    userId: "user_1",
    userName: "Rafael Costa",
    marketId: "market_6",
    direction: "NO",
    amount: 80.0,
    shares: 137.93,
    avgPrice: 0.58,
    potentialPayout: 137.93,
    createdAt: "2024-05-02T17:45:00Z",
  },
  {
    id: "bet_4",
    userId: "user_1",
    userName: "Rafael Costa",
    marketId: "market_3",
    direction: "YES",
    amount: 50.0,
    shares: 277.78,
    avgPrice: 0.18,
    potentialPayout: 277.78,
    createdAt: "2025-01-20T11:30:00Z",
  },
]

// ============================================
// FUNCOES UTILITARIAS
// ============================================

/** Formata valor em BRL: R$ 1.250,75 */
export function formatBRL(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`
  }
  if (abs >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}K`
  }
  return `R$ ${value.toFixed(2)}`
}

/** Formata numero grande: 12.4K, 1.2M */
export function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toString()
}

/** Formata probabilidade como porcentagem: 0.73 -> "73%" */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

// ============================================
// DATAS (sem toLocaleString para evitar hydration mismatch)
// ============================================

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function getMonths(locale: string) {
  if (locale === "pt") return MONTHS_PT
  if (locale === "es") return MONTHS_ES
  return MONTHS_EN
}

export function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr)
  const months = getMonths(locale)
  const day = String(d.getUTCDate()).padStart(2, "0")
  const month = months[d.getUTCMonth()]
  const year = d.getUTCFullYear()
  return `${day} ${month} ${year}`
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const h = String(d.getUTCHours()).padStart(2, "0")
  const m = String(d.getUTCMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

export function formatDateShort(dateStr: string, locale: string): string {
  const d = new Date(dateStr)
  const day = String(d.getUTCDate()).padStart(2, "0")
  const mon = String(d.getUTCMonth() + 1).padStart(2, "0")
  const year = d.getUTCFullYear()
  if (locale === "en") return `${mon}/${day}/${year}`
  return `${day}/${mon}/${year}`
}

// ============================================
// HELPERS
// ============================================

/** Busca um mercado pelo ID */
export function getMarketById(id: string): Market | undefined {
  return markets.find((m) => m.id === id)
}

/** Busca as apostas de um usuario */
export function getBetsByUserId(userId: string): Bet[] {
  return userBets.filter((b) => b.userId === userId)
}

/** Busca as apostas em um mercado */
export function getBetsByMarketId(marketId: string): Bet[] {
  return userBets.filter((b) => b.marketId === marketId)
}

/** Retorna o preco atual de NO como (1 - probability) */
export function getNoPrice(market: Market): number {
  return 1 - market.probability
}

/** Retorna as top N opcoes de um mercado multi, ordenadas por probabilidade */
export function getTopOptions(market: Market, n = 4): MarketOption[] {
  if (!market.options) return []
  return [...market.options].sort((a, b) => b.probability - a.probability).slice(0, n)
}
