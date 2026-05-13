import express from 'express';
import path from 'path';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createServer as createViteServer } from 'vite';

// Use the stealth plugin
puppeteer.use(StealthPlugin());

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for generating checkout session
  app.post('/api/generate-checkout', async (req, res) => {
    let { accessToken, accountId, planType } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'accessToken is required' });
    }

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage', 
          '--no-zygote',             
          '--single-process',        
          '--lang=id-ID,id',
          // TAMBAHKAN BARIS INI UNTUK MENYAMARKAN LOKASI RENDER:
          '--proxy-server=http://193.5.64.151:50100'
        ]
      });

      const page = await browser.newPage();

      // OTENTIKASI PROXY (SANGAT PENTING)
      await page.authenticate({
        username: 'TWNZmBax',
        password: 'sR5ExHiTh3'
      });

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'id-ID,id;q=0.9'
      });
      await page.emulateTimezone('Asia/Jakarta');
      
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'id-ID,id;q=0.9'
      });
      await page.emulateTimezone('Asia/Jakarta');

      await page.goto('https://chatgpt.com/', { 
        waitUntil: 'domcontentloaded', // Lebih cepat daripada 'networkidle2'
        timeout: 60000                 // Memberi waktu 60 detik (sebelumnya hanya 30 detik)
      });

// Execute API call directly inside browser context
const checkoutData = await page.evaluate(async (token, acctId, plan) => {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Origin': 'https://chatgpt.com',
    'Referer': 'https://chatgpt.com/premium',
    'Accept': '*/*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Content-Type': 'application/json',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    // Menyamarkan user-agent agar konsisten dengan browser asli
    'User-Agent': navigator.userAgent 
  };

  if (acctId) {
    headers['ChatGPT-Account-ID'] = acctId;
  }

  // KUNCI UTAMA: Paksa parameter Native dan Localization
  const body = {
    'plan_id': plan === 'business' ? 'workspace_standard' : 'plus',
    'is_native': true,             // Memaksa UI Native (Chatgpt.com)
    'use_native_checkout': true,   // Memaksa opsi pembayaran lokal
    'currency': 'IDR',             // Meminta mata uang Rupiah
    'country': 'ID'                // Konfirmasi lokasi Indonesia
  };

  const response = await fetch('https://chatgpt.com/backend-api/payments/checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
     const text = await response.text();
     throw new Error(`Request failed with status ${response.status}: ${text}`);
  }
  
  return response.json();
}, accessToken, accountId, planType);

      await browser.close();

      const url = checkoutData?.url;
      if (!url) {
         return res.status(500).json({ error: 'Did not receive URL from API response', data: checkoutData });
      }

      const match = url.match(/(cs_live_[a-zA-Z0-9]+)/);
      if (match && match[1]) {
        const extractedSessionId = match[1];
        const checkoutUrl = `https://chatgpt.com/checkout/openai_llc/${extractedSessionId}`;
        return res.json({ checkoutUrl });
      } else {
        return res.status(500).json({ error: 'Could not extract session ID from response', url });
      }

    } catch (error) {
      console.error('Error generating checkout:', error);
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
