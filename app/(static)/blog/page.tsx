import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Blog — VATICI",
  description: "Artigos, análises e novidades da VATICI.",
}

// Future posts will be added here as static objects or fetched from a CMS.
const posts: Array<{
  slug: string
  title: string
  date: string
  excerpt: string
  category: string
}> = [
  {
    slug: "introducao-mercados-previsao",
    title: "Introdução aos Mercados de Previsão",
    date: "1 de março de 2026",
    excerpt:
      "O que são mercados de previsão, como funcionam e por que são uma ferramenta poderosa para agregar informação dispersa.",
    category: "Educação",
  },
]

export default function BlogPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Blog</h1>
      <p className="mt-3 text-muted-foreground">
        Artigos sobre mercados de previsão, análises e novidades da plataforma.
      </p>

      <div className="mt-10 space-y-8">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                {post.category}
              </span>
              <span>{post.date}</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {post.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
            <p className="mt-4 text-sm font-medium text-primary">
              Em breve →
            </p>
          </article>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="mt-16 rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">Nenhum artigo publicado ainda.</p>
          <p className="mt-1 text-sm text-muted-foreground">Volte em breve.</p>
        </div>
      )}
    </div>
  )
}
