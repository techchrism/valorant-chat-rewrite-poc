import * as tls from 'node:tls'
import {ConfigMITM} from './ConfigMITM'
import * as fs from 'node:fs'
import {XMLBuilder, XMLParser} from 'fast-xml-parser'

export class XmppMITM {
    private readonly _port: number
    private readonly _host: string
    private readonly _configMitm: ConfigMITM
    private readonly _macroMap: Map<string, string>
    private readonly _replacementMap: Map<string, string>
    private readonly _parser = new XMLParser({ignoreAttributes: false})
    private readonly _builder = new XMLBuilder({ignoreAttributes: false})

    constructor(port: number, host: string, configMitm: ConfigMITM, macroMap: Map<string, string>, replacementMap: Map<string, string>) {
        this._port = port
        this._host = host
        this._configMitm = configMitm
        this._macroMap = macroMap
        this._replacementMap = replacementMap
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
                    socket.write(data)
                })

                socket.on('data', data => {
                    let modifiedBuffer = data
                    try {
                        const xml = this._parser.parse(data.toString())
                        if(xml.hasOwnProperty('message')) {
                            const macro = this._macroMap.get(xml.message['body'])
                            if(macro !== undefined) {
                                xml.message['body'] = macro
                            } else {
                                for(const [key, value] of this._replacementMap.entries()) {
                                    xml.message['body'] = xml.message['body'].replaceAll(key, value)
                                }
                            }

                            modifiedBuffer = Buffer.from(this._builder.build(xml))
                        }
                    } catch(ignored) {}


                    if(riotTLS.connecting) {
                        preConnectBuffer = Buffer.concat([preConnectBuffer, modifiedBuffer])
                    } else {
                        riotTLS.write(modifiedBuffer)
                    }
                })
            }).listen(this._port, () => {resolve()})
        })
    }
}