var conf = { iceServers: [{ urls: [] }] };
var pc = new RTCPeerConnection(conf);
var localStream, _chatChannel;

function errHandler(name = '', message = '') {
	console.warn(name, message);
}

navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function (stream) {
	localStream = stream;
	pc.addStream(stream);
}).catch(function (error) {
	errHandler(error.name, error.message);
});

// Create a offset local
localOfferSet.onclick = function () {
	if (enable_chat.checked) {
		_chatChannel = pc.createDataChannel('chatChannel');
		chatChannel(_chatChannel);
	}
	pc.createOffer().then(des => {
		console.log('createOffer ok ');
		pc.setLocalDescription(des).then(() => {
			setTimeout(function () {
				if (pc.iceGatheringState == "complete") {
					return;
				} else {
					console.log('after GetherTimeout');
					localOffer.value = JSON.stringify(pc.localDescription);
				}
			}, 2000);
			console.log('setLocalDescription ok');
		}).catch(function (error) {
			errHandler(error.name, error.message);
		});
	}).catch(function (error) {
		errHandler(error.name, error.message);
	});
}

// Chat
function chatChannel(e) {
	_chatChannel.onopen = function (e) {
		console.log('chat channel is open', e);
	}
	_chatChannel.onmessage = function (e) {
		chat.innerHTML = chat.innerHTML + "<pre>" + e.data + "</pre>"
	}
	_chatChannel.onclose = function () {
		console.log('chat channel closed');
	}
}

//configs control
pc.onicecandidate = function (event) {
	if (event.candidate) {
		console.groupCollapsed('iceGatheringState complete');
		console.log(pc.localDescription.sdp);
		localOffer.value = JSON.stringify(pc.localDescription);
	} else {
		console.log(event.candidate);
	}
}
pc.oniceconnectionstatechange = function () {
	console.log('iceconnectionstatechange: ', pc.iceConnectionState);
}
pc.onaddstream = function (event) {
	console.log('remote onaddstream', event.stream);
	remote.src = URL.createObjectURL(event.stream);
}
pc.onconnection = function (event) {
	console.log('onconnection ', event);
}