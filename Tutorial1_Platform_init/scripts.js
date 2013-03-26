/**
 * @fileoverview
 *
 * Contains implementation of logic required by the Tutorial 1.
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */


(function (w) {
  'use strict';
  var ADLT = w.ADLT,
      log = ADLT.log;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  ADLT.onDomReady = function () {
    log.debug('DOM loaded');
    $("#initProgressBar").
        progressbar({
          value:0
        });
    ADLT.initAddLiveLogging();
    ADLT.initializeAddLive();
  };

  /**
   * Initializes the AddLive SDK.
   */
  ADLT.initializeAddLive = function () {
    log.debug("Initializing the AddLive SDK");

//  Step 1 - create the PlatformInitListener and overwrite it's methods.
    var initListener = new ADL.PlatformInitListener();

//  Define the handler for initialization progress changes
    initListener.onInitProgressChanged = function (e) {
      log.debug("Platform init progress: " + e.progress);
      $("#initProgressBar").progressbar('value', e.progress);
    };

//  Define the handler for initialization state changes
    initListener.onInitStateChanged = function (e) {
      switch (e.state) {

        case ADL.InitState.ERROR:
//      After receiving this status, the initialization is stopped as due to
//      a failure.
          log.error("Failed to initialize the AddLive SDK");
          log.error("Reason: " + e.errMessage + ' (' + e.errCode + ')');
          break;

        case ADL.InitState.INITIALIZED:
//      This state flag indicates that the AddLive SDK is initialized and fully
//      functional. In this tutorial, we will just perform sample call to
//      retrieve the current version of the SDK
          var getVersionResult = function (version) {
            log.debug("AddLive service version: " + version);
            $('#sdkVersion').html(version);
          };

          var responder = ADL.createResponder(getVersionResult);
          ADL.getService().getVersion(responder);
          break;

        case ADL.InitState.INSTALLATION_REQUIRED:
//      Current user doesn't have the AddLive Plug-In installed and it is
//      required - use provided URL to ask the user to install the Plug-in.
//      Note that the initialization process is just frozen in this state -
//      the SDK polls for plug-in availability and when it becomes available,
//      continues with the initialization.
          log.debug("AddLive Plug-in installation required");
          $('#installBtn').
              attr('href', e.installerURL).
              css('display', 'block');
          break;
        case ADL.InitState.INSTALLATION_COMPLETE:
          log.debug("AddLive Plug-in installation complete");
          $('#installBtn').hide();
          break;

        case ADL.InitState.BROWSER_RESTART_REQUIRED:
//      This state indicates that AddLive SDK performed auto-update and in order
//      to accomplish this process, browser needs to be restarted.
          log.debug("Please restart your browser in order to complete platform auto-update");
          break;

        case ADL.InitState.DEVICES_INIT_BEGIN:
//      This state indicates that AddLive SDK performed auto-update and in order
//      to accomplish this process, browser needs to be restarted.
          log.debug("Devices initialization started");
          break;

        default:
//      Default handler, just for sanity
          log.warn("Got unsupported init state: " + e.state);
      }
    };

//  Step 2. Actually trigger the asynchronous initialization of the AddLive SDK.
    ADL.initPlatform(initListener, {bugReportingEndpoint:'//localhost:5000/reliability'});
  };

  /**
   * Register the document ready handler.
   */
  $(ADLT.onDomReady);

})(window);