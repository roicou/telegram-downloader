import dotenv from 'dotenv';
const envFound = dotenv.config();
if (envFound.error) {
    // This error should crash whole process
    throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
    telegram: {
        api_id: Number(process.env.TELEGRAM_API_ID) || 0,
        api_hash: process.env.TELEGRAM_API_HASH || "",
        chat_id: Number(process.env.TELEGRAM_CHAT_ID) || 0,
        tdlib: process.env.TELEGRAM_TDLIB || "./libtdjson.so"
    },

    download_path: (process.env.DOWNLOAD_PATH) ? ((process.env.DOWNLOAD_PATH[process.env.DOWNLOAD_PATH.length - 1] === '/') ? process.env.DOWNLOAD_PATH : process.env.DOWNLOAD_PATH + '/') : './downloads/',

}