// server.js
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Supabase initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// The page that shows the Telegram Login button
app.get('/login', (req, res) => {
    // We can pass the chatId to the page if needed, but the auth data is enough
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login with Telegram</title>
        </head>
        <body>
            <script async src="https://telegram.org/js/telegram-widget.js?22"
                data-telegram-login="${process.env.TELEGRAM_BOT_USERNAME}"
                data-size="large"
                data-auth-url="${process.env.WEB_APP_URL}/auth/callback"
                data-request-access="write">
            </script>
        </body>
        </html>
    `);
});

// The callback URL that Telegram redirects to
app.get('/auth/callback', async (req, res) => {
    try {
        const authData = req.query;
        if (!checkTelegramAuth(authData)) {
            return res.status(403).send('Invalid hash. Authentication failed.');
        }

        // Auth is valid, now save data to Supabase
        const { id, first_name, last_name, username, photo_url } = authData;

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: parseInt(id, 10),
                first_name,
                last_name,
                username,
                photo_url
            })
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw new Error('Could not save profile to the database.');
        }

        console.log('Profile saved/updated:', data);
        res.send('<script>window.close();</script><h1>Success! You can close this window.</h1>');

    } catch (error) {
        console.error('Callback error:', error);
        res.status(500).send('An internal server error occurred.');
    }
});

// Security function to verify the data is from Telegram
function checkTelegramAuth(data) {
    const secretKey = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN).digest();
    const checkString = Object.keys(data)
        .filter(key => key !== 'hash')
        .map(key => `${key}=${data[key]}`)
        .sort()
        .join('\n');

    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
    return hmac === data.hash;
}

app.listen(port, () => {
    console.log(`Web server listening on port ${port}`);
});
