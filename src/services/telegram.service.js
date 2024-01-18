import config from '../config/index.js';
import fs from 'fs';
class TelegramService {
    constructor() {
        /**
         * array de descargas
         * steps: 0 - en cola
         *        1 - descargando
         *        2 - movendo arquivo
         * @private
         * @type {{
         *      file: string,
         *      file_id: number,
         *      file_size: number,
         *      message: number,
         *      id: number,
         *      step: number,
         *      update: import('airgram').Message,
         *      reply: import('airgram').Message,
         *      download: import('airgram').downloadFile,
         *      process: number,
         *      last: number,
         *      times: number,
         *      attempts: number
         * }[]}
         */
        this._downloads = [];

        // creamos un intervalo e cada 10 segundos comprobamos o estado das descargas
        setInterval(() => this._manageDownloads(), 10000);
    }
    /**
     * inicia airgram
     * @public
     * @param {import('airgram').default} airgram 
     */
    init(airgram) {
        this._airgram = airgram;
    }
    /**
     * recibe un novo arquivo
     * @public
     * @param {import('airgram').updateNewMessage} update
     */
    async newFile(update) {
        const message = update.message;
        console.log(JSON.stringify(message, null, 2));
        const document = update.message.content.document || update.message.content.video;
        console.log('New file', document.fileName);
        const reply = await this._airgram.api.sendMessage({
            chatId: config.telegram.chat_id,
            replyToMessageId: message.id,
            inputMessageContent: {
                _: 'inputMessageText',
                text: {
                    _: 'formattedText',
                    text: `${document.fileName}\n👍 Arquivo recibido`
                },
            }
        })
        // const reply = await this._sendMessage(config.telegram.chat_id, `${document.fileName}\nArquivo recibido`, download);
        const download = {
            file: document.fileName, // nome do arquivo
            file_id: document.document?.remote.id || document.video?.remote.id, // id do arquivo remoto
            file_size: document.document?.size || document.video?.size, // tamaño do arquivo
            message: message.id, // id da mensaxe de telegram que contén o arquivo
            id: document.document?.id || document.video.id, // id do arquivo local
            step: 0, // paso no que se atopa a descarga
            update: update, // obxecto update de airgram
            reply: reply, // obxecto reply de airgram (a mensaxe de resposta)
            reply_confirmed: false, // se a mensaxe de resposta foi confirmada
            download: null, // obxecto download de airgram (a descarga)
            process: 0, // porcentaxe de descarga
            last: 0, // última porcentaxe de descarga
            times: 0, // veces que se repite a mesma porcentaxe de descarga
            attempts: 0 // intentos de descarga
        };
        // creamos unha nova descarga no array
        this._downloads.push(download);
    }

    async updateMessage(update) {
        // console.log(JSON.stringify(update, null, 2));
        // console.log(this._downloads[0].reply);
        const download = this._downloads.find(d => d.reply.response?.id === update.oldMessageId || d.reply.id === update.oldMessageId);
        // console.log(download);
        if (download) {
            console.log('Update message', download.file)
            download.reply = update.message;
            download.reply_confirmed = true;
        }
    }

    /**
     * Manipulador de descargas
     * @private
     * @returns 
     */
    async _manageDownloads() {
        // primeiro comprobamos se hai descargas pendentes
        if (!this._downloads.length) return;

        // collemos a primeira descarga da lista
        const download = this._downloads[0];
        console.log('Manage download - step', download.step, '-', download.file)
        switch (download.step) {
            /*********************************/
            /* 0 - Iniciando descarga        */
            /*********************************/
            case 0:
                download.attempts++; // engadimos un intento
                // se levamos máis de 5 intentos de descarga, cortamos
                if (download.attempts > 5) {
                    console.log('\tMax attempts')
                    await this._sendMessage(`❌ Erro na descarga. Máximo de intentos alcanzado.`, download);
                    this._downloads.shift();
                    break;
                }
                console.log('\tStart download')
                // actualizamos a mensaxe de telegram
                await this._updateProccess(download);
 
                // descargamos o arquivo
                download.download = await this._airgram.api.downloadFile({
                    fileId: download.id,
                    priority: 32,
                    synchronous: false,
                });
                // console.log('editMessageText', u);
                download.step++;
                // console.log(JSON.stringify(download, null, 2));
                break;
            /*********************************/
            /* 1 - Descargando               */
            /*********************************/
            case 1:
                if (download.download) {
                    download.download = await this._airgram.api.getRemoteFile({ remoteFileId: download.file_id });
                    // se rematamos a descarga, poñemos o paso a 2 e o proceso ao 100%
                    if (download.download.response.local.isDownloadingCompleted) {
                        console.log('\tDownload complete')
                        download.process = 100;
                        await this._sendMessage(`${download.file}\n${'🟩'.repeat(10)} 100%`, download);
                        download.step++;
                        break;
                    }
                    // actualizamos o porcentaxe de descarga
                    download.process = Math.round((download.download.response.local.downloadedSize * 100 / download.file_size));
                    // se a porcentaxe de descarga é diferente da última vez, actualizamos a mensaxe de telegram e as veces a 0
                    if (download.process !== download.last) {
                        await this._updateProccess(download);
                        download.last = download.process;
                        download.times = 0;
                        break;
                    }
                    // se a porcentaxe de descarga é a mesma que a última vez, engadimos unha repetición
                    download.times++;
                    console.log('\tDownload progress is the same as last time', download.times, 'times')

                    // mentres non superemos as 10 repeticións, continuamos
                    if (download.times < 10) break;
                }
                // no caso de que superemos as 10 repeticións, ou por algún motivo non haia obxecto descarga (non debería pasar), reiniciamos a descarga
                console.log('\tDownload error. Reattempting')
                download.times = 0;
                await this._sendMessage(`${download.file}\n⚠️ Erro na descarga, reintentando máis tarde.`, download);
                download.step = 0;
                this._downloads.shift();
                this._downloads.push(download);
                break;
            /*********************************/
            /* 2 - Mover arquivo           */
            /*********************************/
            case 2:
                console.log('\tMoving file');
                await this._sendMessage(`${download.file}\n💾 Movendo arquivo...`, download);
                download.step++;
                // console.log(download.download.response.local.path, `/media/externo/downloads/${download.file}`)
                fs.copyFile(download.download.response.local.path, `${config.download_path}${download.file}`, async (err) => {
                    if (err) {
                        console.log('\tError moving file', err);
                        await this._sendMessage(`${download.file}\n❎ Arquivo descargado. Erro ao mover arquivo.\n${err}`, download);
                    } else {
                        console.log('\tFile moved');
                        await this._sendMessage(`${download.file}\n✅ Arquivo descargado e movido.`, download);
                        fs.rmSync(download.download.response.local.path);
                    }
                    this._downloads.shift();
                    if (!this._downloads.length) {
                        await this._airgram.api.sendMessage({
                            chatId: config.telegram.chat_id,
                            inputMessageContent: {
                                _: 'inputMessageText',
                                text: {
                                    _: 'formattedText',
                                    text: `😎 Descargas finalizadas.`
                                },
                            }
                        })
                    }
                });
                break;
        }
    }
    /**
     * actualiza en telegram a mensaxe do progreso de descarga
     * @private
     * @param {*} download 
     * @returns 
     */
    _updateProccess(download) {
        let boxes = '';
        for (let i = 0; i < 10; i++) {
            if (i <= (download.process / 10) - 1) {
                boxes += '🟩';
            } else {
                boxes += '⬜️';
            }
        }
        console.log('\t', boxes, download.process + '%')
        return this._sendMessage(`${download.file}\n${boxes} ${download.process}%`, download);
    }
    /**
     * actualiza a mensaxe de telegram onde indica o proceso de descarga
     * @private
     * @param {string} message 
     * @param {number} download message id
     * @returns 
     */
    async _sendMessage(message, download = null) {
        // comprobamos se a mensaxe enviada xa está confirmada (para poder editala)
        if (download.reply_confirmed) {
            // editamos a mensaxe co texto que entre
            await this._airgram.api.editMessageText({
                chatId: config.telegram.chat_id,
                messageId: download.reply.id,
                inputMessageContent: {
                    _: 'inputMessageText',
                    text: {
                        _: 'formattedText',
                        text: message
                    },
                },
            });
            return null
        }
        // se non está confirmada, pero temos resposta, eliminámola e publicamos outra
        if (download.reply) {
            this._airgram.api.deleteMessages({
                chatId: config.telegram.chat_id,
                messageIds: [download.reply.response.id]
            
            })
        }
        const res = await this._airgram.api.sendMessage({
            chatId: config.telegram.chat_id,
            replyToMessageId: download.message,
            inputMessageContent: {
                _: 'inputMessageText',
                text: {
                    _: 'formattedText',
                    text: message
                },
            }
        });
        download.reply = res;
        return;
    }
}
export default new TelegramService();