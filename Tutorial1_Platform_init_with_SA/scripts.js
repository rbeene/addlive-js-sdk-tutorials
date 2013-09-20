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

  // Imports
  var ADLT = w.ADLT,
      log = ADLT.log;

  // Consts

  var APPLICATION_ID = NaN, // Put your app Id here;
      APP_SHARED_SECRET = '', // Put your API key here;
      TEST_SCOPE_ID_PFX = 'connSetup-';

  APPLICATION_ID = 1;
  APP_SHARED_SECRET = 'CloudeoTestAccountSecret';

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
          log.debug('Got initialized: ' + JSON.stringify(e));
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
//          $('#installBtn').
//              attr('href', e.installerURL).
//              css('display', 'block');
//          break;
//        case ADL.InitState.INSTALLATION_COMPLETE:
//          log.debug("AddLive Plug-in installation complete");
//          $('#installBtn').hide();
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

    var userId = ADLT.genRandomUserId(),
        testConnDescr = {scopeId:TEST_SCOPE_ID_PFX + userId};

    // The test connection descriptor is used to determine the RTT between the
    // client and AddLive infrastructure. It should use a different scope id,
    // preferably associated with current user (e.g. conn-test-user-XXX)
    // to make sure that there won't be any interference between users testing.
    testConnDescr.authDetails = ADLT.genAuth(testConnDescr.scopeId,
        userId, APPLICATION_ID, APP_SHARED_SECRET);


    // The link quality connection descriptor will be passed by the
    // SetupAssistant to the ADL.AddLiveService#networkTest. Thus the empty
    // scope id.
    var linkQualityConnDescr = {
      scopeId:'',
      highVideoStream:{maxBitRate:1024}
    };
    linkQualityConnDescr.authDetails = ADLT.genAuth('', userId,
        APPLICATION_ID, APP_SHARED_SECRET);
//  Step 2. Actually trigger the asynchronous initialization of the AddLive SDK.
    var initOptions = {
      platformOptions:{
        applicationId:1,

        // All the AddLive mentions will be replaced with this string, if
        // specified
        label:'VideoService',

        // All the URLs pointing to http://www.addlive.com will be replaced with
        // this URL
        labelUrl:'http://www.example.com'

        // In case your application prefers to use custom template - specify it
        // here
//      , templateURL:'http://www.example.com'
      },
      testConnDescr:testConnDescr,
      linkQualityConnDescr:linkQualityConnDescr
    };
    ADL.UI.SetupAssistant.initPlatform(initListener, initOptions);
  };

  /**
   * Register the document ready handler.
   */
  $(ADLT.onDomReady);

})(window);