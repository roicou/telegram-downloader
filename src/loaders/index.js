import airgramLoader from './airgram.loader.js'
/**
 * @param {import('airgram').default} airgram
 */
export default async (airgram) => {
    await airgramLoader(airgram);
}