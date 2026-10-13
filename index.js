import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_SECRET_TOKEN = process.env.APP_SECRET_TOKEN || 'guardiao_pro_secure_key_2026';

const manifestContent = JSON.stringify({
  "name": "Guardião Pro - Inteligência e Segurança",
  "short_name": "Guardião Pro",
  "description": "Aplicativo inteligente de monitorização, análise de ameaças com IA e alertas de segurança em tempo real.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#030712",
  "theme_color": "#059669",
  "icons": [
    {
      "src": "https://guardiao-pro.vercel.app/icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "https://guardiao-pro.vercel.app/splash.png",
      "sizes": "512x512",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Tela de Apresentação Guardião Pro"
    }
  ]
}, null, 2);

const swContent = `
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('guardiao-pro-v13').then((cache) => cache.addAll(['/', '/index.html', '/manifest.json', '/splash.png', '/icon.png'])));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((response) => response || fetch(e.request)));
});
`;

const htmlContent = `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guardião Pro</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#030712">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-0 m-0 selection:bg-emerald-500 selection:text-white">
    
    <!-- Tela de Apresentação (Splash Screen com a Imagem Real Cyberpunk) -->
    <div id="splashScreen" class="fixed inset-0 bg-slate-950 z-50 flex flex-col justify-between items-center p-6 overflow-y-auto">
        <div class="w-full max-w-sm flex-1 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            
            <div class="w-full rounded-2xl overflow-hidden border border-emerald-500/40 shadow-2xl shadow-emerald-950/90 bg-slate-900">
                <img src="/splash.png" alt="Guardião Pro Splash" class="w-full h-auto object-cover">
            </div>

            <button onclick="entrarApp()" class="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition tracking-widest shadow-xl shadow-emerald-950">
                ENTRAR →
            </button>
        </div>

        <div class="text-[10px] text-slate-500 tracking-widest uppercase">
            Um amanhã mais seguro começa agora
        </div>
    </div>

    <!-- Central de Comando Principal -->
    <div id="mainApp" class="hidden max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4 relative overflow-hidden my-6">
        
        <div id="toast" class="hidden absolute top-4 left-4 right-4 px-4 py-2 rounded-xl text-xs shadow-lg transition-all duration-300 z-50 text-center font-medium border"></div>

        <div class="text-center">
            <div class="text-3xl mb-1">🛡️</div>
            <h1 class="text-xl font-bold text-emerald-400">Guardião Pro</h1>
            <p class="text-xs text-slate-400">Central de Inteligência e Segurança (Blindado)</p>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full text-[10px] font-semibold mt-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Sistema 100% Seguro
            </div>
        </div>

        <div class="space-y-2">
            <label class="block text-xs font-medium text-slate-300">Registar Ocorrência / Alerta:</label>
            <textarea id="txtAlerta" rows="2" maxlength="300" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition" placeholder="Ex: Movimento estranho no portão principal..."></textarea>
            
            <div class="grid grid-cols-2 gap-2">
                <button id="btnIa" onclick="analisarAlerta()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1 shadow-md shadow-emerald-950/50">
                    🤖 Analisar IA
                </button>
                <button id="btnTelegram" onclick="enviarTelegram()" class="bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1 shadow-md shadow-sky-950/50">
                    ✈️ Telegram
                </button>
            </div>
        </div>

        <div id="resultadoBox" class="hidden bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1 transition-all">
            <div class="flex justify-between items-center">
                <span class="font-semibold text-emerald-400">Parecer do Guardião IA:</span>
                <span id="badgeRisco" class="px-2 py-0.5 rounded text-[10px] font-bold"></span>
            </div>
            <p id="resultadoTexto" class="text-slate-300 leading-relaxed"></p>
        </div>

        <div class="border-t border-slate-800 pt-3">
            <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-medium text-slate-400">Histórico de Ocorrências:</span>
                <button onclick="limparHistorico()" class="text-[10px] text-red-400 hover:underline">Limpar</button>
            </div>
            <div id="historicoLista" class="space-y-1.5 max-h-32 overflow-y-auto text-[11px] text-slate-400 pr-1">
                <p class="text-slate-600 italic">Nenhum evento registado.</p>
            </div>
        </div>

        <div>
            <button id="btnInstalar" class="hidden w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-800/50 font-medium py-2 px-3 rounded-lg text-xs transition">
                📲 Instalar Aplicativo
            </button>
        </div>
    </div>

    <script>
        const SECRET_TOKEN = "${APP_SECRET_TOKEN}";

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }

        document.addEventListener('DOMContentLoaded', () => {
            carregarHistorico();
            if (sessionStorage.getItem('guardiao_logado')) {
                document.getElementById('splashScreen').style.display = 'none';
                document.getElementById('mainApp').classList.remove('hidden');
            }
        });

        function entrarApp() {
            sessionStorage.setItem('guardiao_logado', 'true');
            document.getElementById('splashScreen').style.opacity = '0';
            document.getElementById('splashScreen').style.transition = 'opacity 0.4s ease';
            setTimeout(() => {
                document.getElementById('splashScreen').style.display = 'none';
                document.getElementById('mainApp').classList.remove('hidden');
            }, 400);
        }

        function mostrarToast(mensagem, tipo = 'info') {
            const toast = document.getElementById('toast');
            toast.innerText = mensagem;
            let esty = 'bg-slate-800 border-slate-700 text-slate-200';
            if (tipo === 'erro') esty = 'bg-red-950 border-red-800 text-red-300';
            if (tipo === 'sucesso') esty = 'bg-emerald-950 border-emerald-800 text-emerald-300';
            toast.className = 'absolute top-4 left-4 right-4 px-4 py-2 rounded-xl text-xs shadow-lg transition-all duration-300 z-50 text-center font-medium border ' + esty;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 3500);
        }

        async function analisarAlerta() {
            const alerta = document.getElementById('txtAlerta').value.trim();
            if (!alerta) return mostrarToast('Digite uma descrição para o alerta!', 'erro');
            
            const btn = document.getElementById('btnIa');
            btn.innerText = 'A analisar...';
            btn.disabled = true;
            
            try {
                const res = await fetch('/analisar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-app-token': SECRET_TOKEN },
                    body: JSON.stringify({ alerta })
                });
                const data = await res.json();
                if (data.erro) throw new Error(data.erro);

                document.getElementById('resultadoBox').classList.remove('hidden');
                document.getElementById('resultadoTexto').innerText = data.analise;
                
                const badge = document.getElementById('badgeRisco');
                if (data.risco === 'CRÍTICO') badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800';
                else if (data.risco === 'MÉDIO') badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800';
                else badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800';
                badge.innerText = data.risco || 'BAIXO';

                guardarNoHistorico(alerta, data.risco || 'BAIXO');
                mostrarToast('Análise de segurança concluída!', 'sucesso');
            } catch (err) {
                mostrarToast('Erro ao processar com a IA.', 'erro');
            } finally {
                btn.innerText = '🤖 Analisar IA';
                btn.disabled = false;
            }
        }

        async function enviarTelegram() {
            const mensagem = document.getElementById('txtAlerta').value.trim();
            if (!mensagem) return mostrarToast('Digite uma mensagem para enviar!', 'erro');
            
            const btn = document.getElementById('btnTelegram');
            btn.innerText = 'A enviar...';
            btn.disabled = true;

            try {
                const res = await fetch('/notificar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-app-token': SECRET_TOKEN },
                    body: JSON.stringify({ mensagem })
                });
                const data = await res.json();
                if (data.status === 'notificado') mostrarToast('Alerta enviado para o Telegram!', 'sucesso');
                else mostrarToast('Erro ao enviar notificação.', 'erro');
            } catch (err) {
                mostrarToast('Erro de conexão.', 'erro');
            } finally {
                btn.innerText = '✈️ Telegram';
                btn.disabled = false;
            }
        }

        function guardarNoHistorico(alerta, risco) {
            let historico = JSON.parse(localStorage.getItem('guardiao_historico') || '[]');
            historico.unshift({ alerta, risco, data: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) });
            if (historico.length > 5) historico.pop();
            localStorage.setItem('guardiao_historico', JSON.stringify(historico));
            carregarHistorico();
        }

        function carregarHistorico() {
            let historico = JSON.parse(localStorage.getItem('guardiao_historico') || '[]');
            const lista = document.getElementById('historicoLista');
            if (historico.length === 0) {
                lista.innerHTML = '<p class="text-slate-600 italic">Nenhum evento registado.</p>';
                return;
            }
            lista.innerHTML = historico.map(h => 
                '<div class="bg-slate-950/60 p-2 rounded border border-slate-800 flex justify-between items-center">' +
                    '<span class="truncate max-w-[190px] text-slate-300">' + h.alerta + '</span>' +
                    '<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">' + h.data + '</span>' +
                '</div>'
            ).join('');
        }

        function limparHistorico() {
            localStorage.removeItem('guardiao_historico');
            carregarHistorico();
            mostrarToast('Histórico limpo.', 'info');
        }

        let deferredPrompt;
        const btnInstalar = document.getElementById('btnInstalar');
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            btnInstalar.classList.remove('hidden');
            btnInstalar.addEventListener('click', () => {
                btnInstalar.classList.add('hidden');
                deferredPrompt.prompt();
                deferredPrompt = null;
            });
        });
    </script>
</body>
</html>`;

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/manifest.json') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(manifestContent);
  }

  if (url.pathname === '/sw.js') {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    return res.status(200).send(swContent);
  }

  if (url.pathname === '/icon.png' || url.pathname === '/splash.png') {
    const imgPath = path.join(process.cwd(), 'splash.png');
    if (fs.existsSync(imgPath)) {
      res.setHeader('Content-Type', 'image/png');
      return res.status(200).send(fs.readFileSync(imgPath));
    } else {
      return res.status(404).send('Imagem não encontrada');
    }
  }

  if (url.pathname === '/analisar' || url.pathname === '/notificar') {
    const clientToken = req.headers['x-app-token'];
    if (!clientToken || clientToken !== APP_SECRET_TOKEN) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(403).json({ erro: "Acesso não autorizado." });
    }
  }

  if (url.pathname === '/analisar' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const { alerta } = JSON.parse(body);
      if (!alerta) return res.status(400).json({ erro: "Alerta vazio." });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analise este alerta de segurança. Retorne estritamente um JSON estruturado com duas propriedades: "risco" ("BAIXO", "MÉDIO" ou "CRÍTICO") e "analise" (parecer curto de até 2 linhas em português). Alerta: ${alerta.substring(0, 300)}`
      });
      
      let textoResp = response.text.trim();
      if (textoResp.startsWith('```json')) textoResp = textoResp.replace(/```json/g, '').replace(/```/g, '').trim();

      let jsonRes;
      try { jsonRes = JSON.parse(textoResp); } catch { jsonRes = { risco: "MÉDIO", analise: response.text }; }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).json({ status: "sucesso", ...jsonRes });
    } catch (err) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(500).json({ erro: "Erro interno." });
    }
  }

  if (url.pathname === '/notificar' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const { mensagem } = JSON.parse(body);
      if (TELEGRAM_TOKEN && mensagem) {
        await fetch(`[https://api.telegram.org/bot$](https://api.telegram.org/bot$){TELEGRAM_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: `🛡️ [Guardião Pro]: ${mensagem.substring(0, 300)}` })
        });
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).json({ status: "notificado" });
    } catch (err) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(500).json({ erro: "Erro ao notificar." });
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(htmlContent);
}
