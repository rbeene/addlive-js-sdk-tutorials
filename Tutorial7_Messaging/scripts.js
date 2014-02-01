/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */


(function (w) {
  'use strict';

  // IE shim - for IE 8+ the console object is defined only if the dev tools
  // are acive
  if (!window.console) {
    console = {
      log:function() {},
      warn:function() {}
    };
  }

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
    // To set your own SCOPE_ID (check shared-assets/scripts.js)
    scopeId:ADLT.SCOPE_ID
  };

  // To set your own APP_ID (check shared-assets/scripts.js)
  var APPLICATION_ID = ADLT.APP_ID;

  // To set your own API_KEY (check shared-assets/scripts.js)
  var APP_SHARED_SECRET = ADLT.API_KEY;


  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady () {
    console.log('DOM loaded');
    ADL.initStdLogging(true);

    // assuming the initAddLiveLogging and initializeAddLiveQuick are exposed
    // via ADLT namespace. (check shared-assets/scripts.js)
    ADLT.initAddLiveLogging();
    // Initializes the AddLive SDK.
    initializeAddLive(
        {initDevices:false,
          skipUpdate:true,
          applicationId: APPLICATION_ID
        });
  }

  /**
   * Initializes the AddLive SDK.
   */
  function initializeAddLive(options) {
    console.log("Initializing the AddLive SDK");

    // Step 1 - create the PlatformInitListener and overwrite it's methods.
    var initListener = new ADL.PlatformInitListener();

    // Define the handler for initialization state changes
    initListener.onInitStateChanged = function (e) {
      switch (e.state) {

        case ADL.InitState.ERROR:
          // After receiving this status, the initialization is stopped as
          // due tutorial a failure.
          console.error("Failed to initialize the AddLive SDK");
          console.error("Reason: " + e.errMessage + ' (' + e.errCode + ')');
          break;

        case ADL.InitState.INITIALIZED:
          //This state flag indicates that the AddLive SDK is initialized and fully
          //functional.
          console.log("AddLive SDK fully functional");
          onPlatformReady();
          break;

        case ADL.InitState.INSTALLATION_REQUIRED:
          // Current user doesn't have the AddLive Plug-In installed and it is
          // required - use provided URL to ask the user to install the Plug-in.
          // Note that the initialization process is just frozen in this state -
          // the SDK polls for plug-in availability and when it becomes available,
          // continues with the initialization.
          console.log("AddLive Plug-in installation required");
          $('#installBtn').attr('href', e.installerURL).css('display', 'block');
          break;
        case ADL.InitState.INSTALLATION_COMPLETE:
          console.log("AddLive Plug-in installation complete");
          $('#installBtn').hide();
          break;

        case ADL.InitState.BROWSER_RESTART_REQUIRED:
          // This state indicates that AddLive SDK performed auto-update and in
          // order to accomplish this process, browser needs to be restarted.
          console.log("Please restart your browser in order to complete platform auto-update");
          break;

        case ADL.InitState.DEVICES_INIT_BEGIN:
          // This state indicates that AddLive SDK performed auto-update and
          // in order to accomplish this process, browser needs to be restarted.
          console.log("Devices initialization started");
          break;

        default:
          // Default handler, just for sanity
          console.log("Got unsupported init state: " + e.state);
      }
    };

    // Step 2. Actually trigger the asynchronous initialization of the AddLive SDK.
    ADL.initPlatform(initListener, options);
  }

  function onPlatformReady () {
    console.log("AddLive Platform ready.");
    var ADLListener = new ADL.AddLiveServiceListener();
    ADLListener.onUserEvent = function (e) {
      if (e.isConnected) {
        $('<option id="user' + e.userId + 'Opt" value="' + e.userId + '">User '
         + e.userId + '</option>').appendTo($('#targetSelect'));

        appendMessage(e.userId, 'User with id ' + e.userId + ' just joined '
         + 'the chat');
      } else {
        $('#user' + e.userId + 'Opt').remove();

        appendMessage(e.userId, 'User with id ' + e.userId + ' just left '
         + 'the chat');
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
    ADL.getService().addServiceListener(ADL.r(onListenerAdded), ADLListener);
  }

  function onListenerAdded () {
    // Prepare the connection descriptor by cloning the configuration and
    // updating the URL and the token.
    var connDescr = $.extend({}, CONNECTION_CONFIGURATION);

    // assuming the genRandomUserId is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    ADLT._ownUserId = ADLT.genRandomUserId();
    connDescr.authDetails = genAuthDetails(connDescr.scopeId, ADLT._ownUserId);

    ADL.getService().connect(ADL.r(onConnected), connDescr);
  }

  function onConnected (connection) {
    var welcomeMessage = "You've just joined the text chat. " +
    "You're personal id: " + ADLT._ownUserId;

    appendMessage(ADLT._ownUserId, welcomeMessage);
    $('#sendBtn').removeClass('disabled').click(sendMsg);
    /**
     *
     * @type {ADL.MediaConnection}
     * @private
     */
    ADLT._chatConnection = connection;
  }

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
    ADLT._chatConnection.sendMessage(ADL.r(), msg, msgRecipient);

  }

  function appendMessage (sender, content, direct) {
    var msgClone = $('#msgTmpl').clone();
    msgClone.find('.userid-wrapper').html(sender);
    msgClone.find('.msg-content').html(content);
    if (direct) {
      msgClone.find('.direct-indicator').removeClass('hidden');
    }
    msgClone.appendTo('#msgsSink');
  }

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
  }

  $(onDomReady);
})(window);