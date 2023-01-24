import * as fs from 'node:fs'
import {ConfigMITM} from './ConfigMITM'
import {XmppMITM} from './XmppMITM'
import {getRiotClientPath, isRiotClientRunning} from './riotClientUtils'
import {exec} from 'node:child_process'

(async () => {
    const logDir = './logs'
    const httpPort = 35479
    const xmppPort = 35478
    const host = '127.0.0.1'

    if(await isRiotClientRunning()) {
        console.log('Riot client is running, please close it before running this tool')
        process.exit(1)
    }

    try {
        await fs.promises.mkdir(logDir)
    } catch (ignored) {}

    const logPath = `${logDir}/${(new Date()).getTime()}.txt`
    console.log(`Writing to ${logPath}`)

    const logStream = fs.createWriteStream(logPath)
    // Log header format
    logStream.write(JSON.stringify({
        type: 'valorant-xmpp-logger',
        version: '1.0.0'
    }) + '\n')

    const configMitm = new ConfigMITM(httpPort, host, xmppPort)
    await configMitm.start()
    console.log(`Listening on ${host}:${httpPort}`)
    const xmppMitm = new XmppMITM(xmppPort, host, configMitm, logStream)
    await xmppMitm.start()
    console.log('XMPP listening...')

    console.log('Starting Riot Client...')
    const riotClientPath = await getRiotClientPath()
    exec(`"${riotClientPath}" --client-config-url="http://${host}:${httpPort}" --launch-product=valorant --launch-patchline=live`)
})()