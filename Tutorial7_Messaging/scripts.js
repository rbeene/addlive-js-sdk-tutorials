/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */


(function (w) {
  'use strict';

  /**
   * Configuration of the streams to publish upon connection established
   * @type {Object}
   */
  var CONNECTION_CONFIGURATION = {


    /**
     * Flags defining that both streams should be automatically published upon
     * connection.
     */
    autopublishVideo:false,
    autopublishAudio:false,
    scopeId:''
  };

  var APPLICATION_ID = NaN; // Put your app Id here;

  var APP_SHARED_SECRET = ''; // Put your API key here;


  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady () {
    console.log('DOM loaded');
    ADL.initStdLogging(true);

    // assuming the initAddLiveLogging and initializeAddLiveQuick are exposed via ADLT namespace. (check shared-assets/scripts.js)
    ADLT.initAddLiveLogging();
    // Additional options for quick initialization - do not initialize the devices and do not update the plug-in
    ADLT.initializeAddLiveQuick(onPlatformReady,
        {initDevices:false,
          skipUpdate:true,
          applicationId: APPLICATION_ID
        });
  };

  function onPlatformReady () {
    console.log("AddLive Platform ready.");
    var ADLListener = new ADL.AddLiveServiceListener();
    ADLListener.onUserEvent = function (e) {
      if (e.isConnected) {
        $('<option id="user' + e.userId + 'Opt" value="' + e.userId + '">User ' + e.userId + '</option>').appendTo($('#targetSelect'));
        appendMessage(e.userId, 'User with id ' + e.userId + ' just joined ' + 'the chat');
      } else {
        $('#user' + e.userId + 'Opt').remove();
        appendMessage(e.userId, 'User with id ' + e.userId + ' just left ' + 'the chat');
      }
    };

    /**
     *
     * @param {ADL.MessageEvent} e
     */
    ADLListener.onMessage = function (e) {
      console.log("Got new message from " + e.srcUserId);
      var msg = JSON.parse(e.data);
      appendMessage(e.srcUserId, msg.text, msg.direct);
    };
    ADL.getService().addServiceListener(ADL.createResponder(onListenerAdded), ADLListener);
  };

  function onListenerAdded () {
    var connDescr = $.extend({}, CONNECTION_CONFIGURATION);

    // assuming the genRandomUserId is exposed via ADLT namespace. (check shared-assets/scripts.js)
    ADLT._ownUserId = ADLT.genRandomUserId();
    connDescr.authDetails = genAuthDetails(connDescr.scopeId, ADLT._ownUserId);

    ADL.getService().connect(ADL.createResponder(onConnected), connDescr);
  };

  function onConnected (connection) {
    var welcomeMessage = "You've just joined the text chat. " + "You're personal id: " + ADLT._ownUserId;
    appendMessage(ADLT._ownUserId, welcomeMessage);
    $('#sendBtn').removeClass('disabled').click(sendMsg);
    /**
     *
     * @type {ADL.MediaConnection}
     * @private
     */
    ADLT._chatConnection = connection;
  };

  function sendMsg () {
    var $msgInput = $('#msgInput');
    var msgContent = $msgInput.val();
    $msgInput.val('');
    var msgRecipient = $('#targetSelect').val();
    console.log("Sending new message to: " + msgRecipient);
    if (msgRecipient === 'all') {
      msgRecipient = undefined;
    }
    var msg = JSON.stringify({
      text:msgContent,
      direct:!!msgRecipient
    });
    ADLT._chatConnection.sendMessage(ADL.createResponder(), msg, msgRecipient);

  };

  function appendMessage (sender, content, direct) {
    var msgClone = $('#msgTmpl').clone();
    msgClone.find('.userid-wrapper').html(sender);
    msgClone.find('.msg-content').html(content);
    if (direct) {
      msgClone.find('.direct-indicator').removeClass('hidden');
    }
    msgClone.appendTo('#msgsSink');
  };

  function genAuthDetails (scopeId, userId) {

    // New Auth API
    var dateNow = new Date();
    var now = Math.floor((dateNow.getTime() / 1000));
    var authDetails = {
      // Token valid 5 mins
      expires:now + (5 * 60),
      userId:userId,
      salt:ADLT.randomString(100)
    };
    var signatureBody =
            APPLICATION_ID +
            scopeId +
            userId +
            authDetails.salt +
            authDetails.expires +
            APP_SHARED_SECRET;
    authDetails.signature =
        w.CryptoJS.SHA256(signatureBody).toString(w.CryptoJS.enc.Hex).toUpperCase();
    return authDetails;
  };
  $(onDomReady);

})(window);