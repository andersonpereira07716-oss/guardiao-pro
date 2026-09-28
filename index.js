import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import pm2 from 'pm2';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const INTERVALO_MINUTOS = 2; // Podes ajustar o tempo aqui

async function enviarTelegram(mensagem) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: mensagem,
                parse_mode: 'Markdown'
            })
        });
    } catch (err) {
        console.error("Erro ao enviar Telegram:", err);
    }
}

async function analisarErroEEnviarAlerta(servico, logs) {
    let diagnosticoIA = "";

    try {
        console.log(`A consultar o Gemini para o serviço ${servico}...`);
        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Analisa este erro do PM2 para o serviço ${servico} e dá um diagnóstico rápido e sugestão de correção em português:\n\n${logs}`
        });
        diagnosticoIA = response.text;
    } catch (aiError) {
        console.log("⚠️ Aviso: IA indisponível ou sem quota. A enviar alerta direto...");
        diagnosticoIA = `⚠️ *Diagnóstico de IA indisponível temporariamente* (Quota/Erro na API).\n\n📄 *Estado do Serviço:* \`${servico}\``;
    }

    await enviarTelegram(`🚨 *ALERTA: O serviço ${servico} falhou!* 🚨\n\n${diagnosticoIA}`);
}

function verificarServicos() {
    console.log(`\n🔍 [${new Date().toLocaleTimeString()}] A verificar infraestrutura...`);
    
    pm2.connect((err) => {
        if (err) {
            console.error("Erro ao conectar ao PM2:", err);
            return;
        }

        pm2.list((err, list) => {
            pm2.disconnect();
            if (err) {
                console.error("Erro ao listar processos:", err);
                return;
            }

            list.forEach((proc) => {
                const nome = proc.name;
                const status = proc.pm2_env.status;
                if (nome === 'guardiao-pro') return;

                if (status !== 'online') {
                    console.log(`⚠️ Alerta: O serviço ${nome} está em estado: ${status}`);
                    analisarErroEEnviarAlerta(nome, `Estado atual detetado pelo gestor: ${status}`);
                } else {
                    console.log(`✔️ Serviço ${nome} a funcionar normalmente.`);
                }
            });
        });
    });
}

// Executa imediatamente e depois repete em loop
verificarServicos();
setInterval(verificarServicos, INTERVALO_MINUTOS * 60 * 1000);
