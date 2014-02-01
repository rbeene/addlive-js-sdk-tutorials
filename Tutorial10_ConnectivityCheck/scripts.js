/**
 * @fileoverview
 *
 * Contains implementation of logic required by the Tutorial 1.
 *
 * @author Tadeusz Kozak
 * @date 06-06-2013 12:25
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

  // Consts
  // To set your own APP_ID (check shared-assets/scripts.js)
  // To set your own API_KEY (check shared-assets/scripts.js)
  var APPLICATION_ID = ADLT.APP_ID,
      APP_SHARED_SECRET = ADLT.API_KEY;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady() {
    console.log('DOM loaded');
    // Initializes the AddLive SDK.
    initializeAddLive({applicationId:APPLICATION_ID});
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
          _platformReady();
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

  function _platformReady() {
    ADL.getService().getVersion((ADL.r(function (version) {
      $('#sdkVersionLbl').text(version);
    })));
    // assuming the genRandomUserId is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    var userId = ADLT.genRandomUserId();
    var connDescr = {
      scope:ADLT.SCOPE_ID
    }; // To set your own SCOPE_ID (check shared-assets/scripts.js)
    // assuming the genAuth is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    connDescr.authDetails = ADLT.genAuth('', userId, APPLICATION_ID,
                                             APP_SHARED_SECRET);

    connDescr.highVideoStream = {maxBitRate:1024};
    $('#connQualityLbl').text('Testing...');
    ADL.getService().networkTest(ADL.r(_onNetworkTestResults), connDescr);
  }

  function _onNetworkTestResults(result) {
    var lbl = '';
    switch (result) {
      case ADL.ConnectionQuality.FINE:
        lbl = 'Good';
        break;
      case ADL.ConnectionQuality.AVERAGE:
        lbl = 'Average';
        break;
      case ADL.ConnectionQuality.BAD:
        lbl = 'Bad';
        break;
      default :
        lbl = 'Unknown';
    }
    $('#connQualityLbl').text(lbl);
  }

  function _onNetworkTestComplete(result) {
    var lbl = '';
    switch (result) {
      case ADL.ConnectionQuality.FINE:
        lbl = 'Good';
        break;
      case ADL.ConnectionQuality.AVERAGE:
        lbl = 'Average';
        break;
      case ADL.ConnectionQuality.BAD:
        lbl = 'Bad';
        break;
      default :
        lbl = 'Unknown';
    }
    document.getElementById('connQualityLbl').innerText = lbl;
  }

  /**
   * Register the document ready handler.
   */
  $(onDomReady);
})();