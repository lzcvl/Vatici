import { Suspense } from "react"
import { HomePage } from "@/components/vatici/home-page"

export default function Page() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  )
}
