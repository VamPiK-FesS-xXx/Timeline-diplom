import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			'/api': {
				target: 'http://timeline-bd',
				changeOrigin: true,
				rewrite: path => path.replace(/^\/api/, '/backend/api'),
				cookieDomainRewrite: '',
			},
			'/nyt': {
				target: 'https://api.nytimes.com',
				changeOrigin: true,
				rewrite: path => path.replace(/^\/nyt/, ''),
				configure: proxy => {
					proxy.on('proxyReq', proxyReq => {
						proxyReq.setHeader(
							'User-Agent',
							'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
						)
					})
				},
			},
		},
	},
})
