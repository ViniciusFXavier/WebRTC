function addMessage(message) {
    var newText = document.createTextNode(message);
    received.appendChild(newText);
    received.appendChild(document.createElement("br"));
}
window.addEventListener("load", function () {
    document.getElementById('name').value = (Date.now() / 1000 | 0) % 1000;
    document.getElementById("send").onclick = function () {
        var message = document.getElementById('message').value;
        //channel.send(message);
        var peer = document.querySelectorAll('input[name=peer]:checked');
        if (peer.length && message.length > 0) {
            sendMessage(peer[0].value, message);
            addMessage('to ' + peer[0].value + ': ' + message);
            //startCommunication(peer[0].value);
        }
        else {
            alert("Please, choose a peer and enter a message");
        }
    };
    document.getElementById("start").onclick = function () {
        var received = document.getElementById('received');
        var name = document.getElementById('name');
        initChat(name.value,
            addMessage,
            function (peers) {
                var peersDiv = document.getElementById('peers');
                while (peersDiv.firstChild) {
                    peersDiv.removeChild(peersDiv.firstChild);
                }
                for (var p in peers) {
                    var div = document.createElement("div");
                    div.innerHTML = '<input type="radio" name="peer" value="'
                        + peers[p].id + '">' + peers[p].id + '<br/>';
                    peersDiv.appendChild(div);
                }
            }
        );
        document.getElementById("initialChatArea").style.display = "none";
        document.getElementById("mainChatArea").style.display = "block";
        //startCommunication(2);
    };
}, false);
