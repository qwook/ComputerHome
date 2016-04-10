define([], function () {
  'use strict';

  if (CLIENT) {

    // Sending a chat
    var chatForm = document.getElementsByClassName('chat-form')[0];
    chatForm.addEventListener('submit', function (event) {

      var text = chatForm.getElementsByClassName('chat-text')[0];

      primus.write({ type: 'chat', message: text.value });
      text.value = "";

      event.preventDefault();
    });

    // Adding chats to the Log
    var chatList = document.getElementsByClassName('chat')[0];
    network.addEventListener('receive', function (event) {

      var listing = document.createElement('p');
      var message = document.createElement('span');
      message.textContent = event.message;
      listing.innerHTML = '<strong>' + escape(event.name) + ' </strong> ';
      listing.appendChild(message);

      chatList.appendChild(listing);
    });
  } else {

    // On receive chat, send it out
    network.addEventListener('chat', function (event) {

      primus.write({
        name: event.spark.name,
        type: 'receive',
        message: event.message
      });
    });
  }
});
//# sourceMappingURL=chat.js.map
