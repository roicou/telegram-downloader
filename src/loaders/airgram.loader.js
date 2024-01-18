import config from '../config/index.js';
import telegramService from '../services/telegram.service.js';

/**
 * Airgram loader
 * @param {import('airgram').default} airgram
 */
export default async (airgram) => {
    // primeiro cargamos a librería de airgram no servizo
    telegramService.init(airgram);

    // escoitamos as novas mensaxes qeu entren
    airgram.on('updateNewMessage', async ({ update }, next) => {
        const { message } = update;
        // comprobamos que as mensaxes veñan do chat seleccionado
        // se contenñen un arquivo, comezamos a descarga
        // @todo que permita aceptar videos
        if (
            message.chatId !== config.telegram.chat_id || (
                message.content._ !== 'messageDocument' &&
                message.content._ !== 'messageVideo'
            )
        ) return;
        telegramService.newFile(update);
    });

    airgram.on("updateMessageSendSucceeded", async ({ update }) => {
        telegramService.updateMessage(update);
    });
}