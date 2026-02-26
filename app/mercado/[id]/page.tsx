import { MarketDetail } from "@/components/vatici/market-detail"

export default async function MercadoPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  return <MarketDetail marketId={id} />
}
