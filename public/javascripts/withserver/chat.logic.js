function initChat(id, messageCallback, peersCallback) {
    var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;

    var wsUri = "ws://192.168.1.38:3001/";
    var signalingChannel = createSignalingChannel(wsUri, id,
        () => {
            alert('Connection closed. Please, try again later');
            document.location.reload();
        });
    var servers = { iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302', 'stun:stun4.l.google.com:19302'] }] };
    window.channel = {};
    window.caller = id;

    function createPeerConnection(peerId) {
        var pc = new RTCPeerConnection(servers, {
            optional: [{
                DtlsSrtpKeyAgreement: true
            }]
        });

        pc.onicecandidate = function (evt) {
            if (evt.candidate) {
                // empty candidate (with evt.candidate === null) are often generated
                signalingChannel.sendICECandidate(evt.candidate, peerId);
            }
        };

        signalingChannel.onICECandidate = function (ICECandidate, source) {
            console.log("receiving ICE candidate from ", source);
            pc.addIceCandidate(new RTCIceCandidate(ICECandidate));
        };

        pc.ondatachannel = function (event) {
            var receiveChannel = event.channel;
            console.log("channel received");
            window.channel[peerId] = receiveChannel;
            receiveChannel.onmessage = function (event) {
                messageCallback(event.data);
            };
        };
        return pc;
    }

    function sendMessage(peerId, message) {
        var channel = window.channel[peerId];
        if (channel)
            channel.send(window.caller + ': ' + message);
        else {
            channel = startCommunication(peerId);
            // TODO: add queue for unsent messages
            setTimeout(function () {
                channel.send(window.caller + ': ' + message);
            }, 200);
        }
    }
    function startCommunication(peerId) {
        var pc = new RTCPeerConnection(servers, {
            optional: [{
                DtlsSrtpKeyAgreement: true
            }]
        });

        signalingChannel.onAnswer = function (answer, source) {
            console.log('receive answer from ', source);
            pc.setRemoteDescription(new RTCSessionDescription(answer));
        };

        signalingChannel.onICECandidate = function (ICECandidate, source) {
            console.log("receiving ICE candidate from ", source);
            pc.addIceCandidate(new RTCIceCandidate(ICECandidate));
        };

        pc.onicecandidate = function (evt) {
            if (evt.candidate) {
                // empty candidate (with evt.candidate === null) are often generated
                signalingChannel.sendICECandidate(evt.candidate, peerId);
            }
        };

        //:warning the dataChannel must be opened BEFORE creating the offer.
        var _commChannel = pc.createDataChannel('communication', {
            reliable: false
        });

        pc.createOffer(function (offer) {
            pc.setLocalDescription(offer);
            console.log('send offer');
            signalingChannel.sendOffer(offer, peerId);
        }, function (e) {
            console.error(e);
        });

        window.channel[peerId] = _commChannel;

        _commChannel.onclose = function (evt) {
            console.log("dataChannel closed");
        };

        _commChannel.onerror = function (evt) {
            console.error("dataChannel error");
        };

        _commChannel.onopen = function () {
            console.log("dataChannel opened");
        };

        _commChannel.onmessage = function (message) {
            messageCallback(message.data);
        };
        return _commChannel;
    }
    window.sendMessage = sendMessage;

    signalingChannel.onPeers = function (peers) {
        for (var p in window.channel) {
            if (!peers[p]) {
                console.log("removing channel for ", p);
                delete window.channel[p];
            }
        }
        for (var p in peers) {
            // > check to prevent both side channel creation
            if (!window.channel[p] && p > window.caller) {
                createPeerConnection(p);
            }
        }
        peersCallback(peers);
    };

    signalingChannel.onOffer = function (offer, source) {
        console.log('receive offer');
        var peerConnection = createPeerConnection(source);
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        peerConnection.createAnswer(function (answer) {
            peerConnection.setLocalDescription(answer);
            console.log('send answer');
            signalingChannel.sendAnswer(answer, source);
        }, function (e) {
            console.error(e);
        });
    };
}