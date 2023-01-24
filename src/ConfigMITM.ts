import * as http from 'node:http'
import {HeadersInit} from 'undici'

interface PlayerConfigAffinities {
    'chat.affinities': {
        [key: string]: string
    }
    'chat.host': string
    'chat.port': number
    'chat.allow_bad_cert.enabled': boolean
}

export class ConfigMITM {
    private readonly _port: number
    private readonly _host: string
    private readonly _xmppPort: number
    private _server: http.Server | null = null
    private _affinityMappingID = 0
    public affinityMappings: {
        localHost: string,
        riotHost: string,
        riotPort: number
    }[] = []

    constructor(port: number, host: string, xmppPort: number) {
        this._port = port
        this._host = host
        this._xmppPort = xmppPort
    }

    async start() {
        this._server = http.createServer(async (req, res) => {
            const now = Date.now()
            console.log(`Request: ${now} ${req.method} ${req.url}`)

            const proxiedHeaders = new Headers(req.headers as HeadersInit)
            proxiedHeaders.delete('host')

            const response = await fetch(`https://clientconfig.rpg.riotgames.com${req.url}`, {
                method: req.method,
                headers: proxiedHeaders
            })
            const text = await response.text()

            res.writeHead(response.status)
            if(req.url?.startsWith('/api/v1/config/player') && response.status === 200) {
                // Rewrite affinity data
                const data = JSON.parse(text) satisfies PlayerConfigAffinities
                if(data.hasOwnProperty('chat.affinities')) {
                    for(const [region, ip] of Object.entries(data['chat.affinities'])) {
                        const existingMapping = this.affinityMappings.find(mapping => mapping.riotHost === ip)
                        if(existingMapping !== undefined) {
                            data['chat.affinities'][region] = existingMapping.localHost
                        } else {
                            const newMapping = {
                                localHost: `127.0.0.${++this._affinityMappingID}`,
                                riotHost: ip as string,
                                riotPort: data['chat.port']
                            }
                            this.affinityMappings.push(newMapping)
                            data['chat.affinities'][region] = newMapping.localHost
                        }
                    }
                    data['chat.port'] = this._xmppPort
                    data['chat.host'] = this._host
                    data['chat.allow_bad_cert.enabled'] = true
                }
                res.write(JSON.stringify(data))
            } else {
                res.write(text)
            }
            res.end()
        })
        return new Promise<void>((resolve, reject) => {
            this._server?.listen(this._port, this._host, () => {
                resolve()
            })
        })
    }

    async stop() {
        return new Promise<void>((resolve, reject) => {
            this._server?.close(() => {
                resolve()
            })
        })
    }
}