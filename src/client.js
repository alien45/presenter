import io from 'socket.io-client'

const PORT_WS = 4001
let client = null

// Make sure to always keep the callback as the last argument
class Client {
    constructor(url) {
        this.socket = io(url)

        this.isConnected = () => this.socket.connected
        this.onConnect = cb => this.socket.on('connect', cb)
        this.onReconnect = cb => this.socket.on('reconnect', cb)
        this.onConnectError = cb => this.socket.on('connect_error', cb);
        this.disconnect = () => this.socket.disconnect()
        this.onError = cb => this.socket.on('error', cb)

        this.getCurrentSlide = cb => this.socket.emit('get-current-slide', cb)
        this.setCurrentSlide = (index, cb) => this.socket.emit('set-current-slide', index, cb)
        this.getSlides = cb => this.socket.emit('get-slides', cb)
        this.login = (password, cb) => this.socket.emit('login', password, cb)
        this.onSlideIndex = cb => this.socket.on('slide-index', cb)
    }

}
export const getClient = () => {
    if (!client) {
        client = new Client(`${window.location.hostname}:${PORT_WS}`)
    }
    return client
}
export default getClient()