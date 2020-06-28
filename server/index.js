const express = require('express')
const http = require('http')
const path = require('path')
const fs = require('fs')
const socketIO = require('socket.io')
const app = express()
const PORT = process.env.PORT || 4000
const PORT_WS = process.env.PORT_WS || 4001
let adminClientIds = []
const allClients = {}
const PASS_TEMP = process.env.PASSWORD || '123456'
let currentSlideIndex = ''
// web socket server
const wsServer = http.createServer()
const socket = socketIO.listen(wsServer)
// event handlers
const handlers = [
    { name: 'disconnect', handler: handleDisconnect },
    { name: 'get-slides', handler: handleGetSlides },
    { name: 'get-current-slide', handler: handleGetCurrentSlide },
    { name: 'set-current-slide', handler: handleSetCurrentSlide },
    { name: 'login', handler: handleLogin },
]

// prepare and serve prebuilt static page
app.use(express.static(path.join(__dirname, '../build')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../build', 'index.html')))
// listen for http requests
http.createServer(app).listen(PORT)
// Setup websocket event handlers
socket.on('connection', client => handlers.forEach(x => client.on(x.name, x.handler)))
// listen on websocket port
wsServer.listen(PORT_WS, () => console.log(`Websocket listening on port ${PORT_WS}`))

function getSlides() {
    try {
        return fs.readdirSync(path.join(__dirname, '../build/slides/'))
    } catch (err) {
        return []
    }
}

function handleDisconnect() {
    const client = this
    adminClientIds = adminClientIds.filter(id => id !== client.id)
    delete allClients[client.id]
    console.log('Client disconnected', client.id)
}

function handleGetCurrentSlide(cb) { cb && cb(null, currentSlideIndex || 0) }

function handleSetCurrentSlide(index, cb) {
    if (!cb || currentSlideIndex === index) return
    const client = this
    if (!adminClientIds.includes(client.id)) return cb('Permission denied')
    const slides = getSlides()
    if (index < 0 || index >= slides.length) return cb('Invalid index')
    currentSlideIndex = index
    console.log('Index: ', index, 'Total clients: ', Object.keys(allClients).length)
    Object.keys(allClients).forEach(clientId => {
        const client = allClients[clientId]
        if (!client) return console.log('broadcast(): Client not found')
        client.emit('slide-index', index)
    })
    cb(null) // success
}
function handleGetSlides(cb) { cb && cb(null, getSlides()) }
function handleLogin(password, cb) {
    if (!cb) return
    const client = this
    const isAdmin = password === PASS_TEMP
    const slides = getSlides()
    allClients[client.id] = client
    if (isAdmin) adminClientIds.push(client.id)
    cb(null, isAdmin, slides, currentSlideIndex || 0)

    console.log(`${isAdmin ? 'Admin' : 'Viewer'} logged in ${client.id}`)
}
