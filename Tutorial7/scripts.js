/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */

(function ($) {

  /**
   * Configuration of the streams to publish upon connection established
   * @type {Object}
   */
  ADLT.CONNECTION_CONFIGURATION = {


    /**
     * Flags defining that both streams should be automatically published upon
     * connection.
     */
    autopublishVideo:false,
    autopublishAudio:false,
    scopeId:'Tutorial7'
  };

  ADLT.APPLICATION_ID = 1;

  ADLT.APP_SHARED_SECRET = 'CloudeoTestAccountSecret';


  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  ADLT.onDomReady = function () {
    log.debug('DOM loaded');
    ADLT.initAddLiveLogging();
//  Additional options for quick initialization - do not initialize the devices
//  and do not update the plug-in
    ADLT.initializeAddLiveQuick(ADLT.onPlatformReady,
        {initDevices:false,
          skipUpdate:true,
          applicationId: ADLT.APPLICATION_ID
        });
  };

  ADLT.onPlatformReady = function () {
    log.debug("AddLive Platform ready.");
    var ADLListener = new ADL.AddLiveServiceListener();
    ADLListener.onUserEvent = function (e) {
      if (e.isConnected) {
        $('<option id="user' + e.userId + 'Opt" value="' + e.userId + '">User ' +
            e.userId + '</option>').appendTo($('#targetSelect'));
        ADLT.appendMessage(e.userId, 'User with id ' + e.userId + ' just joined '
            + 'the chat');
      } else {
        $('#user' + e.userId + 'Opt').remove();
        ADLT.appendMessage(e.userId, 'User with id ' + e.userId + ' just left ' +
            'the chat');
      }
    };

    /**
     *
     * @param {ADL.MessageEvent} e
     */
    ADLListener.onMessage = function (e) {
      log.debug("Got new message from " + e.srcUserId);
      var msg = JSON.parse(e.data);
      ADLT.appendMessage(e.srcUserId, msg.text, msg.direct);
    };
    ADL.getService().addServiceListener(ADL.createResponder(ADLT.onListenerAdded),
        ADLListener);
  };

  ADLT.onListenerAdded = function () {
    var connDescr = $.extend({}, ADLT.CONNECTION_CONFIGURATION);
    ADLT._ownUserId = ADLT.genRandomUserId();
    connDescr.authDetails = ADLT.genAuthDetails(connDescr.scopeId,
        ADLT._ownUserId);

    ADL.getService().connect(ADL.createResponder(ADLT.onConnected), connDescr);
  };

  ADLT.onConnected = function (connection) {
    $('#sendbtn').removeClass('disabled').click(ADLT.sendMsg);
    var welcomeMessage = "You've just joined the text chat. You're personal id: "
        + ADLT._ownUserId;
    ADLT.appendMessage(ADLT._ownUserId, welcomeMessage);
    $('#sendBtn').removeClass('disabled').click(ADLT.sendMsg);
    /**
     *
     * @type {ADL.MediaConnection}
     * @private
     */
    ADLT._chatConnection = connection;
  };

  ADLT.sendMsg = function () {
    var $msgInput = $('#msgInput');
    var msgContent = $msgInput.val();
    $msgInput.val('');
    var msgRecipient = $('#targetSelect').val();
    log.debug("Sending new message to: " + msgRecipient);
    if (msgRecipient === 'all') {
      msgRecipient = undefined;
    }
    var msg = JSON.stringify({
      text:msgContent,
      direct:!!msgRecipient
    });
    ADLT._chatConnection.sendMessage(ADL.createResponder(), msg, msgRecipient);

  };

  ADLT.appendMessage = function (sender, content, direct) {
    var msgClone = $('#msgTmpl').clone();
    msgClone.find('.userid-wrapper').html(sender);
    msgClone.find('.msg-content').html(content);
    if (direct) {
      msgClone.find('.direct-indicator').removeClass('hidden');
    }
    msgClone.appendTo('#msgsSink');
  };

  $(ADLT.onDomReady);

  ADLT.genAuthDetails = function (scopeId, userId) {

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
        ADLT.APPLICATION_ID +
            scopeId +
            userId +
            authDetails.salt +
            authDetails.expires +
            ADLT.APP_SHARED_SECRET;
    authDetails.signature =
        CryptoJS.SHA256(signatureBody).toString(CryptoJS.enc.Hex).toUpperCase();
    return authDetails;
  };


})(jQuery);