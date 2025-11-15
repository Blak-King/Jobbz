// bot.js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL; // e.g., 'https://your-app-name.fly.dev'
const bot = new TelegramBot(token, { polling: true });

console.log("Bot has been started...");

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        await bot.sendMessage(chatId, 'Welcome! Use the /register command to create your profile.');
    }

    if (text === '/register') {
        // Send a button that links to our web app
        await bot.sendMessage(chatId, 'Click the button below to register your profile!', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Register Profile', web_app: { url: `${webAppUrl}/login` } }]
                ]
            }
        });
    }
});
