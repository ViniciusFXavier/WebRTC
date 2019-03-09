var configuration = { iceServers: [{ urls: [] }] };
const localConnection = new RTCPeerConnection(configuration);
var remoteConnection = null;

var channel = [];

function errHandler(err) {
	console.warn(err);
}

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

localConnection.onicecandidate = function (event) {
	var cand = event.candidate;
	console.log('cand', cand);
	if (!cand) {
		console.log('iceGatheringState complete', localConnection.localDescription.sdp);
		localOffer.value = JSON.stringify(localConnection.localDescription);
	} else {
		console.log('candidate', cand.candidate);
	}
}

localConnection.oniceconnectionstatechange = function () {
	console.log('iceconnectionstatechange: ', localConnection.iceConnectionState);
}

localConnection.onconnectionstatechange = function (event) {
	console.log('onconnection ', event);
}

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
	if (enable_chat.checked) {
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

function sendMsg() {
	var text = sendTxt.value;
	chat.innerHTML = chat.innerHTML + "<pre class='sent'>" + text + "</pre>";
	channel.chat.send(text);
	sendTxt.value = "";
	return false;
}