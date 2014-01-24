/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */


(function (w) {
  'use strict';

  // Scope constants
  var APPLICATION_ID = NaN,

      APP_SHARED_SECRET = '',

        /**
         * Configuration of the streams to publish upon connection established
         * @type {Object}
         */
        CONNECTION_CONFIGURATION = {

        /**
         * Description of the base line video stream - the low layer. It's QVGA, with
         * bitrate equal to 64kbps and 5 frames per second
         */
        lowVideoStream:{
          publish:true,
          receive:true,
          maxWidth:320,
          maxHeight:240,
          maxBitRate:64,
          maxFps:5
        },

        /**
         * Description of the adaptive video stream - the high layer. It's QVGA, with
         * 400kbps of bitrate and 15 frames per second
         */
        highVideoStream:{
          publish:true,
          receive:true,
          maxWidth:320,
          maxHeight:240,
          maxBitRate:400,
          maxFps:15
        },

        /**
         * Flags defining that both streams should be automatically published upon
         * connection.
         */
        autopublishVideo:true,
        autopublishAudio:true
      },

      mediaConnType2Label = {};

  mediaConnType2Label[ADL.ConnectionType.NOT_CONNECTED] = 'not connected';
  mediaConnType2Label[ADL.ConnectionType.TCP_RELAY] = 'RTP/TCP relayed';
  mediaConnType2Label[ADL.ConnectionType.UDP_RELAY] = 'RTP/UDP relayed';
  mediaConnType2Label[ADL.ConnectionType.UDP_P2P] = 'RTP/UDP in P2P';

  //User ID's array to allow video input
  var allowedVideoSenders = new Array();

  //User ID's array to allow video input
  var allowedAudioSenders = new Array();

  // Scope variables
  var scopeId, userId, localVideoStarted = false;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady() {
    console.log('DOM loaded');

    // assuming the initAddLiveLogging is exposed via ADLT namespace. (check shared-assets/scripts.js)
    ADLT.initAddLiveLogging();
    initUI();
    var initOptions = {applicationId:APPLICATION_ID};

    // assuming the initializeAddLiveQuick is exposed via ADLT namespace. (check shared-assets/scripts.js)
    ADLT.initializeAddLiveQuick(onPlatformReady, initOptions);
  }

  function initUI() {
    console.log("Initializing the UI");
    $('#publishAudioChckbx').change(onPublishAudioChanged);
    $('#publishVideoChckbx').change(onPublishVideoChanged);

    $('#camSelect').change(function () {
      var selectedDev = $(this).val();
      ADL.getService().setVideoCaptureDevice(
          ADL.r(startLocalVideoMaybe), selectedDev);
    });

    $('#micSelect').change(ADLT.getDevChangedHandler('AudioCapture'));
    $('#spkSelect').change(ADLT.getDevChangedHandler('AudioOutput'));

    console.log("UI initialized");
  }

  function onPlatformReady() {
    console.log("==============================================================");
    console.log("==============================================================");
    console.log("AddLive SDK ready - setting up the application");

    // assuming the populateDevicesQuick is exposed via ADLT namespace. (check shared-assets/scripts.js)
    ADLT.populateDevicesQuick();
    startLocalVideoMaybe();
    initServiceListener();
  }

  /**
   * ==========================================================================
   * Beginning of the AddLive service events handling code
   * ==========================================================================
   */


  function initServiceListener() {
    console.log("Initializing the AddLive Service Listener");

    // 1. Instantiate the listener
    var listener = new ADL.AddLiveServiceListener();


    // 2. Define the handler for the user event
    listener.onUserEvent = function (e) {
      console.log("Got new user event: " + e.userId);
      if (e.isConnected) {
        onUserJoined(e);
      } else {
        console.log("User with id: " + e.userId + ' left the media scope');
        $('#renderingWidget' + e.userId).html('').remove();
      }
    };

    // 3. Define the handler for streaming status changed event
    listener.onMediaStreamEvent = function (e) {
      console.log("Got new media streaming status changed event");
      switch (e.mediaType) {
        case ADL.MediaType.AUDIO:
          onRemoteAudioStreamStatusChanged(e);
          break;
        case ADL.MediaType.VIDEO:
          onRemoteVideoStreamStatusChanged(e);
          break;
        default :
          console.warn('Got unsupported media type in media stream event: ' + e.mediaType);
      }
    };

    // 4. Define the handler for the media connection type changed event
    listener.onMediaConnTypeChanged = function (e) {
      console.log("Got new media connection type: " + e.connectionType);
      $('#connTypeLbl').html(mediaConnType2Label[e.connectionType]);
    };

    // 5. Define the handler for the connection lost event
    listener.onConnectionLost = function (e) {
      console.warn('Got connection lost notification: ' + JSON.stringify(e));
      disconnectHandler();
      tryReconnect();
    };

    // 6. Prepare the success handler
    var onSucc = function () {
      console.log("AddLive service listener registered");
      $('#connectBtn').click(connect).removeClass('disabled');
    };

    // 7. Finally register the AddLive Service Listener
    ADL.getService().addServiceListener(ADL.createResponder(onSucc), listener);

  }

  function onUserJoined(e) {
    console.log("Got new user with id: " + e.userId);

    // 1. Prepare a rendering widget for the user.
    var renderer = $('#rendererTmpl').clone();
    renderer.attr('id', 'renderingWidget' + e.userId);
    renderer.find('.render-wrapper').attr('id', 'renderer' + e.userId);
    renderer.find('.user-id-wrapper').html(e.userId);

    // 2. Append it to the rendering area.
    $('#renderingWrapper').append(renderer);
    if (e.videoPublished) {
      // 3a. Render the sink if the video stream is being published.
      ADL.renderSink({
        sinkId:e.videoSinkId,
        containerId:'renderer' + e.userId
      });
    }
    else {
      // 3b. Just show the no video stream published indicator.
      renderer.find('.no-video-text').show();
      renderer.find('.allowReceiveVideoChckbx').hide();
    }

    // 4. Show the "audio muted" indicator if user does not publish audio stream
    if (!e.audioPublished) {
      renderer.find('.muted-indicator').show();
      renderer.find('.allowReceiveAudioChckbx').hide();
    }

    // Add the new user id to the arrays of allowed input of audio and video
    allowedAudioSenders.push(parseInt(e.userId));
    allowedVideoSenders.push(parseInt(e.userId));

    // Add the new user id to the pool of user allowed to send audio and video
    ADL.getService().setAllowedSenders(ADL.createResponder(onSilenced), scopeId, ADL.MediaType.AUDIO, allowedAudioSenders);
    ADL.getService().setAllowedSenders(ADL.createResponder(onSilenced), scopeId, ADL.MediaType.VIDEO, allowedVideoSenders);

    renderer.find('.allowReceiveAudioChckbx').attr('id', 'allowReceiveAudio' + e.userId);
    renderer.find('.allowReceiveVideoChckbx').attr('id', 'allowReceiveVideo' + e.userId);
    $('#allowReceiveAudio' + e.userId).change({rend: renderer},onAllowedAudioChanged);
    $('#allowReceiveVideo' + e.userId).change({rend: renderer},onAllowedVideoChanged);
  }

  function onRemoteVideoStreamStatusChanged(e) {
    console.log("Got change in video streaming for user with id: " + e.userId +
        ' user just ' +
        (e.videoPublished ? 'published' : 'stopped publishing') +
        ' the stream');
    // 1. Grab the rendering widget corresponding to the user
    var renderingWidget = $('#renderingWidget' + e.userId);

    if (e.videoPublished) {
      // 2a. If video was just published - render it and hide the "No video from user" indicator
      ADL.renderSink({
        sinkId:e.videoSinkId,
        containerId:'renderer' + e.userId
      });
      renderingWidget.find('.no-video-text').hide();
    } else {
      // 2b. If video was just unpublished - clear the renderer and show the "No video from user" indicator
      renderingWidget.find('.render-wrapper').empty();
      renderingWidget.find('.no-video-text').show();
    }
  }

  function onRemoteAudioStreamStatusChanged(e) {
    console.log("Got change in audio streaming for user with id: " + e.userId +
        ' user just ' +
        (e.audioPublished ? 'published' : 'stopped publishing') +
        ' the stream');

    // 1. Find the "Audio is muted" indicator corresponding to the user
    var muteIndicator = $('#renderingWidget' + e.userId).find('.muted-indicator');
    if (e.audioPublished) {
      // 2a. Hide it if audio stream was just published
      muteIndicator.hide();
    } else {
      // 2.b Show it if audio was just unpublished
      muteIndicator.show();
    }
  }

  /**
   * Tries to reestablish the connection to the AddLive Streaming Server in case
   * of network-driven loss.
   *
   * It will retry the connect every 5 seconds.
   */
  function tryReconnect() {

    // Register the reconnect handler to be triggered after 5 seconds
    setTimeout(function () {
      console.log("Trying to reestablish the connection to the AddLive Streaming " + "Server");

      // 1. Define the result handler
      var succHandler = function () {
        console.log("Connection successfully reestablished!");
        postConnectHandler();
      };

      // 2. Define the failure handler
      var errHandler = function () {
        console.warn("Failed to reconnect. Will try again in 5 secs");
        tryReconnect();
      };
      // 3. Try to connect
      var connDescriptor = genConnectionDescriptor(scopeId, userId);
      ADL.getService().connect(ADL.createResponder(succHandler, errHandler),
          connDescriptor);
    }, 5000);

  }

  /**
   * ==========================================================================
   * End of the AddLive service events handling code
   * ==========================================================================
   */


  function startLocalVideoMaybe() {
    if (localVideoStarted) {
      return;
    }
    console.log("Starting local preview of current user");
    // 1. Define the result handler
    var resultHandler = function (sinkId) {
      console.log("Local preview started. Rendering the sink with id: " + sinkId);
      ADL.renderSink({
        sinkId:sinkId,
        containerId:'renderLocalPreview',
        mirror:true
      });
      localVideoStarted = true;
    };

    // 2. Request the SDK to start capturing local user's preview
    ADL.getService().startLocalVideo(ADL.createResponder(resultHandler));
  }

  /**
   * ==========================================================================
   * Beginning of the connection management code
   * ==========================================================================
   */

  function connect() {
    console.log("Establishing a connection to the AddLive Streaming Server");

    // 1. Disable the connect button to avoid a cascade of connect requests
    $('#connectBtn').unbind('click').addClass('disabled');

    // 2. Get the scope id and generate the user id.
    scopeId = $('#scopeIdTxtField').val();

    // assuming the genRandomUserId is exposed via ADLT namespace. (check shared-assets/scripts.js)
    userId = ADLT.genRandomUserId();

    // 3. Define the result handler - delegates the processing to the postConnectHandler
    var connDescriptor = genConnectionDescriptor(scopeId, userId);
    var onSucc = function () {
      postConnectHandler();
    };

    // 4. Define the error handler - enabled the connect button again
    var onErr = function () {
      $('#connectBtn').click(connect).removeClass('disabled');
    };

    // 5. Request the SDK to establish a connection
    ADL.getService().connect(ADL.createResponder(onSucc, onErr), connDescriptor);
  }

  function disconnect() {
    console.log("Terminating a connection to the AddLive Streaming Server");

    // 1. Define the result handler
    var succHandler = function () {
      scopeId = undefined;
      userId = undefined;
      disconnectHandler();
    };

    // 2. Request the SDK to terminate the connection
    ADL.getService().disconnect(ADL.createResponder(succHandler), scopeId);
  }

  /**
   * Common post disconnect handler - used when user explicitly terminates the
   * connection or if the connection gets terminated due to the networking issues.
   *
   * It just resets the UI to the default state.
   */
  function disconnectHandler() {

    // 1. Toggle the active state of the Connect/Disconnect buttons
    $('#connectBtn').click(connect).removeClass('disabled');
    $('#disconnectBtn').unbind('click').addClass('disabled');

    // 2. Reset the connection type label
    $('#connTypeLbl').html('none');

    // 3. Clear the remote user renderers
    $('#renderingWrapper').find('.remote-renderer').html('').remove();

    // 4. Clear the local user id label
    $('#localUserIdLbl').html('undefined');
  }

  /**
   * Common post connect handler - used when user manually establishes the
   * connection or connection is being reestablished after being lost due to the
   * Internet connectivity issues.
   *
   */
  function postConnectHandler() {
    console.log("Connected. Disabling connect button and enabling the disconnect");

    // 1. Enable the disconnect button
    $('#disconnectBtn').click(disconnect).removeClass('disabled');

    // 2. Update the local user id label
    $('#localUserIdLbl').html(userId);
  }

  function genConnectionDescriptor(scopeId, userId) {
    // Clone the video streaming configuration and create a connection descriptor using settings provided by the user
    var connDescriptor = $.extend({}, CONNECTION_CONFIGURATION);
    connDescriptor.scopeId = scopeId;
    connDescriptor.authDetails = genAuthDetails(scopeId, userId);
    connDescriptor.autopublishAudio = $('#publishAudioChckbx').is(':checked');
    connDescriptor.autopublishVideo = $('#publishVideoChckbx').is(':checked');
    return connDescriptor;
  }


  /**
   * ==========================================================================
   * End of the connection management code
   * ==========================================================================
   */

  /**
   * ==========================================================================
   * Beginning of the user's events handling code
   * ==========================================================================
   */

  /**
   * Handles the change of the "Publish Audio" checkbox
   */
  function onPublishAudioChanged() {
    if (!scopeId) {
      // If the scope id is not defined, it means that we're not connected and thus there is nothing to do here.
      return;
    }

    // Since we're connected we need to either start or stop publishing the audio stream, depending on the new state of the checkbox
    if ($('#publishAudioChckbx').is(':checked')) {
      ADL.getService().publish(ADL.r(), scopeId, ADL.MediaType.AUDIO);
    } else {
      ADL.getService().unpublish(ADL.r(), scopeId, ADL.MediaType.AUDIO);
    }

  }

  /**
   * Handles the change of the "Publish Audio" checkbox
   */
  function onPublishVideoChanged() {
    if (!scopeId) {

      // If the scope id is not defined, it means that we're not connected and thus there is nothing to do here.
      return;
    }

    // Since we're connected we need to either start or stop publishing the audio stream, depending on the new state of the checkbox
    if ($('#publishVideoChckbx').is(':checked')) {
      ADL.getService().publish(ADL.r(), scopeId, ADL.MediaType.VIDEO);
    } else {
      ADL.getService().unpublish(ADL.r(), scopeId, ADL.MediaType.VIDEO);
    }

  }

  /**
   * Prepare the handler when using setAllowedSenders
   */
  var onSilenced = function (e) {
    console.warn('Got setAllowedSenders notification: ' + JSON.stringify(e));
  };

  /**
   * Handles the change of the "Allowed Audio" checkbox
   */
  function onAllowedAudioChanged(e) {
    userId = parseInt(e.data.rend.find('.user-id-wrapper').html());

    // Since we're connected we need to either start or stop publishing the audio stream, depending on the new state of the checkbox
    if ($('#allowReceiveAudio'+userId).is(':checked')) {
      //Add the User ID to the array of users allowed to send audio
      allowedAudioSenders.push(userId);
      ADL.getService().setAllowedSenders(ADL.createResponder(onSilenced), scopeId, ADL.MediaType.AUDIO, allowedAudioSenders);
    } else {
      //Remove the User ID to the array of users allowed to send audio
      var index = allowedAudioSenders.indexOf(userId);
      if(index != -1) {
        allowedAudioSenders.splice(index, 1);
      }
      ADL.getService().setAllowedSenders(ADL.createResponder(onSilenced), scopeId, ADL.MediaType.AUDIO, allowedAudioSenders);
    }
  }

  /**
   * Handles the change of the "Allowed Audio" checkbox
   */
  function onAllowedVideoChanged(e) {
    userId = parseInt(e.data.rend.find('.user-id-wrapper').html());

    // Since we're connected we need to either start or stop publishing the audio stream, depending on the new state of the checkbox
    if ($('#allowReceiveVideo'+userId).is(':checked')) {
      //Add the User ID to the array of users allowed to send video
      allowedVideoSenders.push(userId);
      ADL.getService().setAllowedSenders(ADL.createResponder(onSilenced), scopeId, ADL.MediaType.VIDEO, allowedVideoSenders);
    } else {
      //Remove the User ID to the array of users allowed to send video
      var index = allowedVideoSenders.indexOf(userId);
      if(index != -1) {
        allowedVideoSenders.splice(index, 1);
      }
      ADL.getService().setAllowedSenders(ADL.createResponder(onSilenced), scopeId, ADL.MediaType.VIDEO, allowedVideoSenders);
    }
  }

  function genAuthDetails(scopeId, userId) {

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

  /**
   * ==========================================================================
   * End of the user's events handling code
   * ==========================================================================
   */


  /**
   * Register the document ready handler.
   */
  $(onDomReady);

})(window);