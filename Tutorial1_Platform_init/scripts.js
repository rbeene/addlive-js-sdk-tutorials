/**
 * @fileoverview
 *
 * Contains implementation of logic required by the Tutorial 1.
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
  function onDomReady() {
    console.log('DOM loaded');
    $("#initProgressBar").
        progressbar({
          value:0
        });
    // assuming the initAddLiveLogging is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    ADLT.initAddLiveLogging();
    initializeAddLive();
  }

  /**
   * Initializes the AddLive SDK.
   */
  function initializeAddLive() {
    console.log("Initializing the AddLive SDK");

    // Step 1 - create the PlatformInitListener and overwrite it's methods.
    var initListener = new ADL.PlatformInitListener();

    // Define the handler for initialization progress changes
    initListener.onInitProgressChanged = function (e) {
      console.log("Platform init progress: " + e.progress);
      $("#initProgressBar").progressbar('value', e.progress);
    };

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
          //functional. In this tutorial, we will just perform sample call to
          //retrieve the current version of the SDK
          var getVersionResult = function (version) {
            console.log("AddLive service version: " + version);
            $('#sdkVersion').html(version);
          };

          var responder = ADL.createResponder(getVersionResult);
          ADL.getService().getVersion(responder);
          break;

        case ADL.InitState.INSTALLATION_REQUIRED:
          // Current user doesn't have the AddLive Plug-In installed and it is
          // required - use provided URL to ask the user to install the Plug-in.
          // Note that the initialization process is just frozen in this state -
          // the SDK polls for plug-in availability and when it becomes available,
          // continues with the initialization.
          console.log("AddLive Plug-in installation required");
          $('#installBtn').
              attr('href', e.installerURL).
              css('display', 'block');
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

  /**
   * Register the document ready handler.
   */
  $(onDomReady);

})();