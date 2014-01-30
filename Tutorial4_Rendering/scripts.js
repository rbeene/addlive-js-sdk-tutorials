/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */

(function () {
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
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady () {
    console.log('DOM loaded');

    // assuming the initAddLiveLogging and initDevicesSelects
    // are exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    ADLT.initAddLiveLogging();
    ADLT.initDevicesSelects();
    // Initializes the AddLive SDK.
    initializeAddLive();
  }

  /**
   * Initializes the AddLive SDK.
   */
  function initializeAddLive() {
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
    ADL.initPlatform(initListener, {applicationId:1});
  }

  function onPlatformReady () {
    // assuming the populateDevicesOfType is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    ADLT.populateDevicesOfType('#camSelect', 'VideoCapture');
    startLocalVideo();
  }

  function startLocalVideo () {
    var resultHandler = function (sinkId) {
      console.log("Local preview started. Rendering the sink with id: " + sinkId);
      ADL.renderSink({
        sinkId:sinkId,
        containerId:'renderContainer'
      });

      ADL.renderSink({
        sinkId:sinkId,
        containerId:'renderContainerWindowed',
        windowless:false
      });


      ADL.renderSink({
        sinkId:sinkId,
        containerId:'renderContainerMirror',
        mirror:true
      });

      ADL.renderSink({
        sinkId:sinkId,
        containerId:'renderContainerBicubic',
        filterType:ADL.VideoScalingFilter.BICUBIC
      });
    };
    ADL.getService().startLocalVideo(ADL.createResponder(resultHandler));
  }

  /**
   * Register the document ready handler.
   */
  $(onDomReady);
})();