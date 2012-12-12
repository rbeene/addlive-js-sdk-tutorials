/**
 * @fileoverview
 *
 * Contains implementation of logic required by the Tutorial 1.
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */
(function (window, $) {

  var log = window.log,
      ADLT = window.ADLT;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady() {
    log.debug('DOM loaded');
    $("#initProgressBar").
        progressbar({
          value:0
        });
    $('#accordion').accordion({disabled:true});
    ADLT.initAddLiveLogging();
    initializeAddLive();
  }

  /**
   * Initializes the AddLive SDK.
   */
  function initializeAddLive() {
    log.debug("Initializing the AddLive SDK");

//  Step 1 - create the PlatformInitListener and overwrite it's methods.
    var initListener = new ADL.PlatformInitListener(),
        initOptions = {initDevices:false};

//  Define the handler for initialization progress changes
    initListener.onInitProgressChanged = initProgressChangedHandler;

//  Define the handler for initialization state changes
    initListener.onInitStateChanged = initStateChangedHandler;

//  Step 2. Actually trigger the asynchronous initialization of the AddLive SDK.
    ADL.initPlatform(initListener, initOptions);
  }

  function platformInitComplete() {
    $('#initializingLabel').fadeOut(500, function () {
      $('#initializedLabel').fadeIn(500, function() {

      })
    });
  }


  function initProgressChangedHandler(e) {
    log.debug("Platform init progress: " + e.progress);
    $("#initProgressBar").progressbar('value', e.progress);
  }

  function initStateChangedHandler(e) {
    switch (e.state) {

      case ADL.InitState.ERROR:
        log.error("Failed to initialize the AddLive SDK");
        log.error("Reason: " + e.errMessage + ' (' + e.errCode + ')');
        break;

      case ADL.InitState.INITIALIZED:
        var getVersionResult = function (version) {
          log.debug("AddLive service version: " + version);
          $('#sdkVersion').html(version);
          platformInitComplete();
        };

        var responder = ADL.createResponder(getVersionResult);
        ADL.getService().getVersion(responder);
        break;

      case ADL.InitState.INSTALLATION_REQUIRED:
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
        log.debug("Please restart your browser in order to complete platform auto-update");
        break;

      case ADL.InitState.DEVICES_INIT_BEGIN:
        log.debug("Devices initialization started");
        break;

      default:
        log.warn("Got unsupported init state: " + e.state);
    }

  }

  /**
   * Register the document ready handler.
   */
  $(onDomReady);

}(window, jQuery));
