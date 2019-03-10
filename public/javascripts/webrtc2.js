var configuration = { iceServers: [{ urls: [] }] };
const localConnection = new RTCPeerConnection(configuration);
var remoteConnection = null;
var localStream = new MediaStream();

var channel = [];

function errHandler(err) {
	console.warn(err);
}

//Connection
remoteOfferGot.onclick = function () {
	remoteConnection = new RTCSessionDescription(JSON.parse(remoteOffer.value));
	console.log('remoteOffer \n', remoteConnection);
	localConnection.setRemoteDescription(remoteConnection).then(function () {
		console.log('setRemoteDescription ok');
		if (remoteConnection.type == "offer") {
			localConnection.createAnswer().then(function (description) {
				console.log('createAnswer 200 ok \n', description);
				localConnection.setLocalDescription(description).then(function () {
				}).catch(errHandler);
			}).catch(errHandler);
		}
	}).catch(errHandler);
}
localOfferSet.onclick = function () {
	if (enableChat.checked) {
		channel.chat = localConnection.createDataChannel('chat');
		chatChannel(channel.chat);
	}
	localConnection.createOffer().then(des => {
		console.log('createOffer ok ');
		localConnection.setLocalDescription(des).then(() => {
			setTimeout(function () {
				if (localConnection.iceGatheringState == "complete") {
					return;
				} else {
					console.log('after GetherTimeout');
					localOffer.value = JSON.stringify(localConnection.localDescription);
				}
			}, 2000);
			console.log('setLocalDescription ok');
		}).catch(errHandler);
	}).catch(errHandler);
}

//Channel
localConnection.ondatachannel = function (event) {
	if (event.channel.label == "chat") {
		console.log('chat Channel Received -', event);
		channel.chat = event.channel;
		chatChannel(event.channel);
	}
};
function chatChannel(event) {
	channel.chat.onopen = function (event) {
		console.log('chat channel is open', event);
	}
	channel.chat.onmessage = function (event) {
		console.log('chat channel have message', event);
		chat.innerHTML = chat.innerHTML + "<pre>" + event.data + "</pre>"
	}
	channel.chat.onclose = function () {
		console.log('chat channel closed');
	}
}

// Get Media
function getDisplayMedia() {
	navigator.mediaDevices.getDisplayMedia({ video: SVGComponentTransferFunctionElement }).then(function (stream) {
		console.log('screenStream', stream);
		localScreenStream.srcObject = stream;
		localConnection.addTrack(stream.getTracks()[0], stream);
	}).catch(function (error) {
		console.log('Screen: ' + error.name, error.message);
	});
}

function getUserMedia() {
	navigator.mediaDevices.getUserMedia({ audio: enableVideoMicrophone.checked, video: true }).then(function (stream) {
		console.log('mediastream', stream);
		localVideoStream.srcObject = stream;
		localConnection.addTrack(mediaStream.getTracks()[0], mediaStream);
	}).catch(function (error) {
		console.log('Media: ' + error.name, error.message);
	});
}

localConnection.onicecandidate = function (event) {
	var cand = event.candidate;
	console.log('cand', cand);
	if (!cand) {
		console.log('iceGatheringState complete', localConnection.localDescription);
		localOffer.value = JSON.stringify(localConnection.localDescription);
	} else {
		console.log('candidate', cand);
	}
}
function gotRemoteStream(event) {
	console.log('gotRemoteStream', event.track, event.streams);
	remoteVideoStream.srcObject = null;
	remoteScreenStream.srcObject = null;
	var teste = false;
	if (!teste) {
		teste = true;
		remoteScreenStream.srcObject = event.streams[0];
		return;
	}

	remoteVideoStream.srcObject = event.streams[0];
}
localConnection.ontrack = function (event) {
	remoteVideoStream.srcObject = event.streams[0];
	remoteVideoStream.play();
};

localConnection.oniceconnectionstatechange = function () {
	console.log('iceconnectionstatechange: ', localConnection.iceConnectionState);
}

localConnection.onconnectionstatechange = function (event) {
	console.log('onconnectionstatechange ', localConnection.connectionState);
	connectionStatus.innerHTML = localConnection.connectionState;
	if (localConnection.connectionState === "connected") {

	} else if (localConnection.connectionState === "disconnected") {

	} else if (localConnection.connectionState === "failed") {

	} else if (localConnection.connectionState === "closed") {

	}
}

function sendMsg() {
	var text = sendTxt.value;
	chat.innerHTML = chat.innerHTML + "<pre class='sent'>" + text + "</pre>";
	channel.chat.send(text);
	sendTxt.value = "";
	return false;
}

// View
enableStream.addEventListener('change', function () {
	var divLocalStream = document.getElementById("divLocalStream");
	if (this.checked) {
		divLocalStream.classList.remove("display-none");
	} else {
		divLocalStream.classList.add("display-none");
	}
});

enableChat.addEventListener('change', function () {
	var divChat = document.getElementById("divChat");
	if (this.checked) {
		channel.chat = localConnection.createDataChannel('chat');
		chatChannel(channel.chat);
	} else {
		channel.chat.close();
	}
});