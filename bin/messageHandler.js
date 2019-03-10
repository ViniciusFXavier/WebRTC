var  connectedPeers = {};
function onMessage(ws, message){
    var type = message.type;
    switch (type) {
        case "ICECandidate":
            onICECandidate(message.ICECandidate, message.destination, ws.id);
            break;
        case "offer":
            onOffer(message.offer, message.destination, ws.id);
            break;
        case "answer":
            onAnswer(message.answer, message.destination, ws.id);
            break;
        case "init":
            onInit(ws, message.init);
            break;
        case 'close':
            onClose(ws.id);
            break;
        default:
            throw new Error("invalid message type");
    }
}

function onInit(ws, id){
    console.log("init from peer:", id);
    ws.id = id;
    connectedPeers[id] = ws;
    // Notify everyone about new peer
    onPeersChanged();
}

function onClose(id) {
    delete connectedPeers[id];
    onPeersChanged();
}

function sendPeers(ws){
    var peers = {};
    for(var k in connectedPeers) {
        if (k != ws.id) {
            peers[k] = {id: k};
        }
    }
    console.log("peers:", peers);
    ws.send(JSON.stringify({
        type: 'peers',
        peers: peers
    }));
}

function onPeersChanged(){
    for (var p in connectedPeers) {
        sendPeers(connectedPeers[p]);
    }
}

function onOffer(offer, destination, source){
    console.log("offer from peer:", source, "to peer", destination);
    connectedPeers[destination].send(JSON.stringify({
        type:'offer',
        offer:offer,
        source:source,
    }));
}

function onAnswer(answer, destination, source){
    console.log("answer from peer:", source, "to peer", destination);
    connectedPeers[destination].send(JSON.stringify({
        type: 'answer',
        answer: answer,
        source: source,
    }));
}

function onICECandidate(ICECandidate, destination, source){
    console.log("ICECandidate from peer:", source, "to peer", destination);
    connectedPeers[destination].send(JSON.stringify({
        type: 'ICECandidate',
        ICECandidate: ICECandidate,
        source: source,
    }));
}

module.exports = onMessage;