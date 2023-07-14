const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { instrument } = require('@socket.io/admin-ui');
const io = require('socket.io')(server, {
    cors: {
        origin: ['http://localhost:3000', 'https://admin.socket.io'],
        credentials: true
    }
});

instrument(io, {
    auth: false
})
const salas = new Map();

io.on('connection', (socket) => {
    socket.on('crear-sala', (data) => {

        salas.set(data.codigo, {
            nombre: data.codigo,
            usuarios: [],
            categorias: data.categorias,
            juegos: [],
        });

        const newSocket = io.of(data.codigo);
        newSocket.on('connection', (salaSocket) => {

            const sala = salas.get(data.codigo);


            salaSocket.on('disconnect', data => {
                sala.usuarios = sala.usuarios.filter(u => u.id !== salaSocket.id);
                newSocket.emit('actualizar-usuarios', sala.usuarios);
            })

            salaSocket.on('empezar-juego', _data => {
                newSocket.emit('start', _data);
            })
            salaSocket.on('detener', _data => {
                newSocket.emit('detener-juego', _data);
            })

            salaSocket.on('enviar-resultados', _data => {
                sala.juegos.push(_data);
                let cantidad = newSocket.sockets.size;
                if (sala.juegos.length >= cantidad) {
                    newSocket.emit('enviar-respuestas', sala.juegos);
                    sala.juegos = [];
                }

            })
            salaSocket.on('correccion', _data => {
                newSocket.emit('corregir-respuesta', _data);
            })
            salaSocket.on('reiniciar', _data => {
                sala.usuarios = _data;
                newSocket.emit('reiniciar-juego', _data);
            })
            salaSocket.on('girar-letra', _data => {
                newSocket.emit('escoger-letra', _data);
            })

            salaSocket.on('enviar-nombre', (_nombre) => {
                sala.usuarios.push({
                    id: salaSocket.id,
                    nombre: _nombre,
                    puntaje: 0
                });
                newSocket.emit('enviar-usuarios', {
                    usuarios: sala.usuarios,
                    categorias: sala.categorias
                });
            })
            salaSocket.on('chat-message', (_data) => {
                newSocket.emit('chat-message', { nombre: _data.user, id: salaSocket.id, mensaje: _data.mensaje });
            })
        })
    })
});

server.listen(4000, () => {
    console.log('Server running');
});




