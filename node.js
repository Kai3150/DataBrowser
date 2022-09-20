const http = require('http');
const fs = require('fs');
const url = require('url');
const socketio = require('socket.io');
const dgram = require('dgram');

const hostname = '127.0.0.1';
const port = 3000;
const server = http.createServer(RouteSetting);
function RouteSetting(req, res) {
    const url_parts = url.parse(req.url);

    switch (url_parts.pathname) {
        case '/':
        case '/index.html': {
            let indexPage = fs.readFileSync('./index.html', 'UTF-8');

            let jsonData = fs.readFileSync('./test.json', 'UTF-8');
            let json = JSON.parse(jsonData);
            let columns = Object.keys(json);

            //columns.lengthの代わりに20を使用
            let dictText = fs.readFileSync('./label_id.json', 'utf8');
            let dictJson = JSON.parse(dictText);

            const links = [];
            let widthList = [];

            for (let i = 0; i < columns.length; i++) {
                const element = columns[i];
                let columns2 = Object.keys(json[element])

                for (let j = 0; j < columns2.length; j++) {
                    links.push({ source: element, target: columns2[j], width: json[element][columns2[j]] });
                    widthList.push(Math.abs(json[element][columns2[j]]) * 3);
                }
            }
            let dict_columns = Object.keys(dictJson);

            const nodes = []
            for (let j = 0; j < dict_columns.length; j++) {
                nodes.push({ id: dict_columns[j], group: dictJson[dict_columns[j]].group });
            }
            let gData = { nodes: nodes, links: links };
            gData = JSON.stringify(gData);
            indexPage = indexPage.replace('gData', gData);

            widthList = JSON.stringify(widthList);
            indexPage = indexPage.replace('widthList', widthList);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexPage);
            break;
        }
        default:
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('お探しのページは見つかりません。');
            break;
    }
}

let = server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

//ソケット通信
var io = socketio(server); // HTTPサーバとソケットオブジェクトを紐付けして，WebSocket通信を有効化

io.sockets.on('connection', function (socket) {
    socket.on('client_to_server', function (data) {
        io.sockets.emit('server_to_client', { value: data.value });
    });
});

console.log("Server started at port: " + port);

//前準備
//----------------------------------------------------------------------------------------------------------------------------


//dgramでBlenderからデータを受け取る
const PORT_A = 8080;
const HOST_A = '0.0.0.0';

const socket = dgram.createSocket('udp4');

socket.on('listening', () => {
    const address = socket.address();
    console.log('UDP socket listening on ' + address.address + ":" + address.port);
});


//Blenderからデータが来たとき
socket.on('message', (message, remote) => {
    //クライアント側にデータを送信
    console.log(message.toString());
    io.sockets.emit('server_to_client', { value: JSON.parse(message.toString()) });
});

//Blenderとの共有ポート
socket.bind(PORT_A, HOST_A);
