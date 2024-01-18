# telegram-downloader
Esta app utiliza Airgram con TDLib 1.8.0.

Este é un cliente Telegram para Node. **Non é un BOT**. Utiliza o usuario de Telegram para descargar arquivos e videos a un directorio local.

Este cliente descargará todos os documentos ou vídeos subidos ao chat ou canle especificada onde o usuario debe ter permisos de escritura. Recoméndase crear unha canle privada para os uso exclusivo deste cliente e reenviar aí os arquivos que se desexen descargar.

## Instalación
### Clonar repositorio
```bash
git clone https://github.com/roicou/telegram-downloader.git
cd telegram-downloader
```
### Instalar TDLib 1.8.0
Según esta guía, imos compilar `td` dentro da carpeta de `telegram-downloader`, pero pode usarse unha librería `td` xa compilada en calquera directorio sempre e cando esté na versión `1.8.0`. Nese caso hai que saltarse este paso.
```bash
git clone https://github.com/tdlib/td
cd td
```
Primeiro hai que poñerse no commit da versión 1.8.0
```bash
git checkout b3ab664a18f8611f4dfcd3054717504271eeaa7a
```
A continuación compílase (este proceso é lento e pode demorarse bastantes minutos):
```bash
mkdir build
cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
cmake --build .
cd ../../
```
### Configurar .env
Copiar o `.env` de exemplo
```bash
cp .env.sample .env
```
Editar o `.env`:
```env
# TELEGRAM
TELEGRAM_API_ID=<API-ID>
TELEGRAM_API_HASH=<API-HASH>
TELEGRAM_CHAT_ID=<CHAT-ID>
TELEGRAM_TDLIB=./td/build/libtdjson.so

# DOWNLOAD PATH
DOWNLOAD_PATH='/downloads`
```
- Os tokens `API-ID` e `API-HASH` obtéñense en https://my.telegram.org/apps
- O `CHAT-ID` é o ID do chat ou canle da que se descargarán os ficheiros. Estes IDs pódense obter doadamente na barra de direccións do navegador ao acceder ao chat desde https://web.telegram.org/
- No campo `TELEGRAM_TDLIB` hai que poñer a ruta ao arquivo `libtdjson.so`. Aquí está o por defecto seguindo esta guía.
- En `DOWNLOAD_PATH` hai que indicar o directorio onde se gardarán os arquivos unha vez descargados.

### Instalar dependencias
```bash
npm install
```
## Execución
```bash
npm start
```
A aplicación iniciará cando mostre a seguinte mensaxe:
```
******************************
Telegram Downloader is running
******************************
```
### Primeiro uso
Durante a primeira execución da aplicación pedirá o número de teléfono que  haber que introducir co código internacional comezando por `+`, logo pedirá o código secreto de dobre afctor que Telegram nos enviará e por último (no caso de tela activada) pedirá o contrasinal.

```
Phone number with international code (Ex: +34XXXXXXXXX):
    +34XXXXXXXXX
Enter secret code:
    XXXXX
Enter password:
    **************
```
### Problemas coa sesión
No caso de ter problemas para ter a sesión aberta, borrando o directorio `./db` elimínanse todos os datos da sesión e poderase volver a iniciar sesión con normalidade.