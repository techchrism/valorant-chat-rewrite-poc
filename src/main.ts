import {ConfigMITM} from './ConfigMITM'
import {XmppMITM} from './XmppMITM'
import {getRiotClientPath, isRiotClientRunning} from './riotClientUtils'
import {exec} from 'node:child_process'

(async () => {
    const httpPort = 35479
    const xmppPort = 35478
    const host = '127.0.0.1'

    const macros = new Map<string, string>()
    const replacements = new Map<string, string>()

    macros.set('!bee', 'According to all known laws of aviation, there is no way a bee should be able to fly. Its wings are too small to get its fat little body off the ground. The bee, of course, flies anyway because bees don\'t care what humans think is impossible. Yellow, black. Yellow, black. Yellow, black. Yellow, black. Ooh, black and yellow! Let\'s shake it up a little. Barry! Breakfast is ready! Coming! Hang on a second. Hello? Barry? Adam? Can you believe this is happening? I can\'t. I\'ll pick you up. Looking sharp. Use the stairs, Your father paid good money for those.')
    replacements.set(':heart:', '♥')

    if(await isRiotClientRunning()) {
        console.log('Riot client is running, please close it before running this tool')
        process.exit(1)
    }

    const configMitm = new ConfigMITM(httpPort, host, xmppPort)
    await configMitm.start()
    console.log(`Listening on ${host}:${httpPort}`)
    const xmppMitm = new XmppMITM(xmppPort, host, configMitm, macros, replacements)
    await xmppMitm.start()
    console.log('XMPP listening...')

    console.log('Starting Riot Client...')
    const riotClientPath = await getRiotClientPath()
    exec(`"${riotClientPath}" --client-config-url="http://${host}:${httpPort}" --launch-product=valorant --launch-patchline=live`)
})()