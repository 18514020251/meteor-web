import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // NOTE: 这里可以换内网IP模拟二维码手机扫码
server: {
  host: '0.0.0.0',
  allowedHosts: ['19157e3b.r16.vip.cpolar.cn'],
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq, req) => {
          console.log('[proxyReq]', req.method, req.url, '->', proxyReq.path)
        })
        proxy.on('proxyRes', (proxyRes, req) => {
          console.log('[proxyRes]', req.method, req.url, 'status=', proxyRes.statusCode)
        })
        proxy.on('error', (err, req) => {
          console.log('[proxyError]', req.method, req.url, err.message)
        })
      }
    }
  }
}

})
