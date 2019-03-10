var configuration = { iceServers: [{ urls: [] }] };
const localConnection = new RTCPeerConnection(configuration);
var remoteConnection = null;
var localStream = new MediaStream();

var channel = [];

function errHandler(err) {
	console.warn(err);
}

function init(err) {
	if (navigator.mediaDevices.getUserMedia === undefined) {
		enableCameraStream.disabled = true;
	}
}
init();

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
enableScreenStream.onclick = function () {
	stopMedia();
	navigator.mediaDevices.getDisplayMedia({ video: SVGComponentTransferFunctionElement }).then(function (stream) {
		console.log('screenStream', stream);
		localVideoStream.srcObject = stream;
		localConnection.addTrack(stream.getTracks()[0], stream);
	}).catch(function (error) {
		console.log('Screen: ' + error.name, error.message);
	});
}
enableCameraStream.onclick = function () {
	stopMedia();
	navigator.mediaDevices.getUserMedia({ audio: enableMicrophoneStream.checked, video: true }).then(function (stream) {
		console.log('mediastream', stream);
		localVideoStream.srcObject = stream;
		stream.getTracks().forEach(function(track) {
			localConnection.addTrack(track, stream);
		});
	}).catch(function (error) {
		console.log('Media: ' + error.name, error.message);
	});
}
function stopMedia(){
	var stream = localVideoStream.srcObject;
	if (stream){
		stream.getTracks().forEach(function (track) {
			track.stop();
		});
	}
	localVideoStream.srcObject = null;
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
localConnection.ontrack = function (event) {
	remoteVideoStream.srcObject = event.streams[0];
	remoteVideoStream.play();
};

localConnection.oniceconnectionstatechange = function () {
	console.log('iceconnectionstatechange: ', localConnection.iceConnectionState);
	connectionStatus.innerHTML = localConnection.iceConnectionState;
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
enableChat.addEventListener('change', function () {
	var divChat = document.getElementById("divChat");
	if (this.checked) {
		channel.chat = localConnection.createDataChannel('chat');
		chatChannel(channel.chat);
	} else {
		channel.chat.close();
	}
});
enableMicrophoneStream.addEventListener('change', function () {
	var stream = localVideoStream.srcObject;
	if (stream){
		if (this.checked) {
			stream.getAudioTracks().forEach(function (track) {
				track.enable = true;
			});
		} else {
			stream.getAudioTracks().forEach(function (track) {
				track.enable = false;
			});
		}
	}
});