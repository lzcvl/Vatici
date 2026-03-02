import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/login',
        '/cadastro',
        '/esqueci-senha',
        '/redefinir-senha',
        '/portfolio',
        '/atividade',
        '/criar',
      ],
    },
    sitemap: 'https://vatici.com/sitemap.xml',
  }
}
