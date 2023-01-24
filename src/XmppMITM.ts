import * as tls from 'node:tls'
import {ConfigMITM} from './ConfigMITM'
import * as fs from 'node:fs'

export class XmppMITM {
    private readonly _port: number
    private readonly _host: string
    private readonly _configMitm: ConfigMITM
    private readonly _logStream: fs.WriteStream

    constructor(port: number, host: string, configMitm: ConfigMITM, logStream: fs.WriteStream) {
        this._port = port
        this._host = host
        this._configMitm = configMitm
        this._logStream = logStream
    }

    async start() {
        return new Promise<void>(async (resolve) => {
            tls.createServer({
                key: await fs.promises.readFile('./certs/server.key'),
                cert: await fs.promises.readFile('./certs/server.cert'),
                rejectUnauthorized: false,
                requestCert: false
            }, socket => {
                const ipv4LocalHost = socket.localAddress?.replace('::ffff:', '')
                const mapping = this._configMitm.affinityMappings.find(mapping => mapping.localHost === ipv4LocalHost)
                if(mapping === undefined) {
                    console.log(`Unknown host ${socket.localAddress}`)
                    socket.destroy()
                    return
                }

                console.log(`Connecting to ${mapping.riotHost}:${mapping.riotPort}...`)

                let preConnectBuffer = Buffer.alloc(0)

                const riotTLS = tls.connect({
                    host: mapping.riotHost,
                    port: mapping.riotPort,
                    rejectUnauthorized: false,
                    requestCert: false
                }, () => {
                    if(preConnectBuffer.length > 0) {
                        riotTLS.write(preConnectBuffer)
                        preConnectBuffer = Buffer.alloc(0)
                    }
                })

                riotTLS.on('data', data => {
                    this._logStream.write(JSON.stringify({
                        type: 'incoming',
                        time: Date.now(),
                        data: data.toString()
                    }) + '\n')
                    socket.write(data)
                })

                socket.on('data', data => {
                    this._logStream.write(JSON.stringify({
                        type: 'outgoing',
                        time: Date.now(),
                        data: data.toString()
                    }) + '\n')
                    if(riotTLS.connecting) {
                        preConnectBuffer = Buffer.concat([preConnectBuffer, data])
                    } else {
                        riotTLS.write(data)
                    }
                })
            }).listen(this._port, () => {resolve()})
        })
    }
}