import { Airgram, Auth, prompt, toObject } from 'airgram';
import config from './config/index.js';
import loaders from './loaders/index.js';

// console.log(config);

const airgram = new Airgram({
    apiId: config.telegram.api_id,
    apiHash: config.telegram.api_hash,
    command: config.telegram.tdlib,
    logVerbosityLevel: 0,
    deviceModel: 'telegram-downloader',
    name: 'telegram-downloader',
    systemVersion: 'linux',
    systemLangCode: 'gl',
    applicationVersion: '1.0.0',
    databaseDirectory: './db',
})

airgram.use(new Auth({
    password: () => prompt(`Enter password:`),
    code: () => prompt(`Enter secret code:`),
    phoneNumber: () => prompt(`Phone number with international code (Ex: +34XXXXXXXXX):`)
}));

airgram.api.getMe()
    .then(() => {
        console.log(`
        ******************************
        Telegram Downloader is running
        ******************************
        `);
        loaders(airgram);
    })
    .catch((error) => {
        console.log('Airgram is not running', error);
        console.log('If error persist, delete "db" folder and try again')
        process.exit();
    })