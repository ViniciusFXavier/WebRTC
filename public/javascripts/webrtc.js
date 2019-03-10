var configuration = { iceServers: [{ urls: [] }] };
const localConnection = new RTCPeerConnection(configuration);
var remoteConnection = null;

//var file controler
var fileObject = {
	sendFileDom: {},
	recFileDom: {},
	receiveBuffer: [],
	receivedSize: 0,
	file: null,
	bytesPrev: null
}

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
	if (enableFileTransfer.checked) {
		channel.file = localConnection.createDataChannel('file');
		fileChannel(channel.file);
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
	if (event.channel.label == "file") {
		console.log('file Channel Received -', event);
		channel.file = event.channel;
		fileChannel(event.channel);
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
function fileChannel(e) {
	channel.file.onopen = function (e) {
		console.log('file channel is open', e);
	}
	channel.file.onmessage = function (e) {
		// Figure out data type
		var type = Object.prototype.toString.call(e.data), data;
		if (type == "[object ArrayBuffer]") {
			data = e.data;
			fileObject.receiveBuffer.push(data);
			fileObject.receivedSize += data.byteLength;
			recFileProg.value = fileObject.receivedSize;
			if (fileObject.receivedSize == fileObject.recFileDom.size) {
				var received = new window.Blob(fileObject.receiveBuffer);
				fileDownload.href = URL.createObjectURL(received);
				fileDownload.innerHTML = "download";
				fileDownload.download = fileObject.recFileDom.name;
				// rest
				fileObject.receiveBuffer = [];
				fileObject.receivedSize = 0;
				// clearInterval(window.timer);	
			}
		} else if (type == "[object String]") {
			data = JSON.parse(e.data);
		} else if (type == "[object Blob]") {
			data = e.data;
			fileDownload.href = URL.createObjectURL(data);
			fileDownload.innerHTML = "download";
			fileDownload.download = fileObject.recFileDom.name;
		}

		// Handle initial msg exchange
		if (data.fileInfo) {
			if (data.fileInfo == "areYouReady") {
				fileObject.recFileDom = data;
				recFileProg.max = data.size;
				var sendData = JSON.stringify({ fileInfo: "readyToReceive" });
				channel.file.send(sendData);
				// window.timer = setInterval(function(){
				// 	Stats();
				// },1000)				
			} else if (data.fileInfo == "readyToReceive") {
				sendFileProg.max = fileObject.sendFileDom.size;
				sendFileinChannel(); // Start sending the file
			}
			console.log('_fileChannel: ', data.fileInfo);
		}
	}
	channel.file.onclose = function () {
		console.log('file channel closed');
	}
}

function sendMsg() {
	var text = sendTxt.value;
	chat.innerHTML = chat.innerHTML + "<pre class='sent'>" + text + "</pre>";
	channel.chat.send(text);
	sendTxt.value = "";
	return false;
}
function sendFile() {
	if (!fileTransfer.value) return;
	var fileInfo = JSON.stringify(fileObject.sendFileDom);
	channel.file.send(fileInfo);
	console.log('file info sent');
}
function sendFileinChannel() {
	var chunkSize = 16384;
	var sliceFile = function (offset) {
		var reader = new window.FileReader();
		reader.onload = (function () {
			return function (e) {
				channel.file.send(e.target.result);
				if (file.size > offset + e.target.result.byteLength) {
					window.setTimeout(sliceFile, 0, offset + chunkSize);
				}
				sendFileProg.value = offset + e.target.result.byteLength
			};
		})(file);
		var slice = file.slice(offset, offset + chunkSize);
		reader.readAsArrayBuffer(slice);
	};
	sliceFile(0);
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
		stream.getTracks().forEach(function (track) {
			localConnection.addTrack(track, stream);
		});
	}).catch(function (error) {
		console.log('Media: ' + error.name, error.message);
	});
}
function stopMedia() {
	var stream = localVideoStream.srcObject;
	if (stream) {
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

// View
enableFileTransfer.addEventListener('change', function () {
	if (this.checked) {
		channel.file = localConnection.createDataChannel('file');
		chatChannel(channel.file);
	} else {
		channel.file.close();
	}
});
enableChat.addEventListener('change', function () {
	if (this.checked) {
		channel.chat = localConnection.createDataChannel('chat');
		chatChannel(channel.chat);
	} else {
		channel.chat.close();
	}
});
enableMicrophoneStream.addEventListener('change', function () {
	var stream = localVideoStream.srcObject;
	if (stream) {
		if (this.checked) {
			stream.getAudioTracks().forEach(function (track) {
				// track.play();
			});
		} else {
			stream.getAudioTracks().forEach(function (track) {
				track.stop();
			});
		}
	}
});
fileTransfer.onchange = function (e) {
	var files = fileTransfer.files;
	if (files.length > 0) {
		file = files[0];
		fileObject.sendFileDom.name = file.name;
		fileObject.sendFileDom.size = file.size;
		fileObject.sendFileDom.type = file.type;
		fileObject.sendFileDom.fileInfo = "areYouReady";
		console.log(fileObject.sendFileDom);
	} else {
		console.log('No file selected');
	}
}