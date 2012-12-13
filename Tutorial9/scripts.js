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
    ADLT.initAddLiveLogging();
    initUI();
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

  function initUI() {
    $('#camSelect').change(onCamSelected);
    $('#micSelect').change(onMicSelected);
    $('#spkSelect').change(onSpkSelected);
    $("#initProgressBar").
        progressbar({
          value:0
        });
    $('#micActivityBar').progressbar({value:10});

    $('#volumeCtrlSlider').slider({
      min:0,
      max:255,
      animate:true,
      value:127,
      slide:onVolumeSlide
    });

    $('#accordion').accordion({disabled:true});
    $('#platformInitNextBtn').click(platformInitStepComplete);
    $('#micTestAgainBtn').click(startMicTest);
    $('#camTestAgainBtn').click(startCamTest);
    $('#micNextBtn').click(micSetupComplete);
    $('#spkNextBtn').click(spkTestComplete);
    $('#camNextBtn').click(camTestComplete);
    $('#playTestSoundBtn').button().click(onPlayTestSoundBtnClicked)
  }

  function platformInitComplete() {
    ADLT.populateDevicesQuick();
    var listener = new ADL.AddLiveServiceListener();
    listener.onDeviceListChanged = onDeviceListChanged;
    listener.onMicActivity = onMicActivity;

    var onAddListenerSucc = function () {
      var $platformInitStep = $('#platformInitStep');
      $platformInitStep.find('.state-testing-msg').fadeOut(500, function () {
        $platformInitStep.find('.state-ok-msg').fadeIn(500, function () {
          $platformInitStep.find('.next-btn').show();
          $('#accordion').accordion('refresh');
        })
      });
    };
    ADL.getService().addServiceListener(ADL.r(onAddListenerSucc), listener);

  }

  function platformInitStepComplete() {
    nextStep();
    startMicTest()
  }

  //============================================================================

  var micActivitySamples = [];

  function startMicTest() {
    log.debug("Starting microphone test");
    micActivitySamples = [];
    var selectedMic = $('#micSelect').val();
    var $micSetupStepWrapper = $('#micSetupStepWrapper');
    $micSetupStepWrapper.find('.state-msg').hide();
    $micSetupStepWrapper.find('.next-btn').hide();

    var micSelectedSuccHandler = function () {
          $micSetupStepWrapper.find('.state-testing-msg').show();
          $('#accordion').accordion('refresh');
          // Set the mic gain to half of the range avail
          ADL.getService().setMicrophoneVolume(ADL.r(), 125);
          ADL.getService().monitorMicActivity(ADL.r(), true);
          setTimeout(micTestComplete, 5000);
        },
        micSelectedErrHandler = function (errCode, errMsg) {
          $micSetupStepWrapper.find('.state-error-msg').show();
          $('#micError').html('Reason: Failed to select given device - ' +
              errMsg + '(' + errCode + ')');
          $('#accordion').accordion('refresh');
        };

    ADL.getService().setAudioCaptureDevice(
        ADL.r(micSelectedSuccHandler, micSelectedErrHandler), selectedMic);
  }

  function micTestComplete() {
    var $micSetupStepWrapper = $('#micSetupStepWrapper');

    ADL.getService().monitorMicActivity(ADL.r(), false);
    $micSetupStepWrapper.find('.state-testing-msg').hide();

    var activityOk = false;
    $.each(micActivitySamples, function (i, value) {
      if (value > 10) {
        activityOk = true;
      }
    });
    if (activityOk) {
      $micSetupStepWrapper.find('.state-ok-msg').show();
      $micSetupStepWrapper.find('.next-btn').show();
    } else {
      $('#micError').html('Reason: No activity was detected from given device.');
      $micSetupStepWrapper.find('.state-error-msg').show();
    }
    $('#accordion').accordion('refresh');
  }

  /**
   * Handles the change event of the audio capture devices select.
   */
  function onMicSelected() {
    startMicTest();
  }


  function micSetupComplete() {
    nextStep();
    setupSpkTest();
  }

  //============================================================================

  function setupSpkTest() {
    populateVolume();
  }

  function populateVolume() {
    var resultHandler = function (volume) {
      $('#volumeCtrlSlider').slider('value', volume);
    };
    ADL.getService().getSpeakersVolume(ADL.r(resultHandler));
  }

  function onPlayTestSoundBtnClicked() {
    var $spkSetupStep = $('#spkSetupStepWrapper');
    var onSuccHandler = function () {
      $spkSetupStep.find('.next-btn').show();
      $spkSetupStep.find('.state-ok-msg').show();
    };
    var onErrHandler = function () {
      $spkSetupStep.find('.state-error-msg').show();
    };
    ADL.getService().startPlayingTestSound(
        ADL.r(onSuccHandler, onErrHandler));
  }

  function onVolumeSlide(e, ui) {
    ADL.getService().setSpeakersVolume(ADL.r(), ui.value);
  }

  function onSpkSelected() {
    var selected = $(this).val();
    var $spkSetupStep = $('#spkSetupStepWrapper');
    $spkSetupStep.find('.next-btn').hide();
    $spkSetupStep.find('.state-msg').hide();
    var onSuccHandler = function () {
      $spkSetupStep.find('.state-testing-msg').show();
    };
    var onErrHandler = function () {
      $spkSetupStep.find('.state-error-msg').show();
    };
    ADL.getService().setAudioOutputDevice(ADL.r(onSuccHandler, onErrHandler), selected);
  }

  function spkTestComplete() {
    nextStep();
    setupCamTest();
  }

  //============================================================================

  function setupCamTest() {
    startCamTest();
  }

  function startCamTest() {
    log.debug("Starting camera test");
    var $camSetupStepWrapper = $('#camSetupStepWrapper');

    var localPrevStarted = function (sinkId) {
          $camSetupStepWrapper.find('.state-testing-msg').hide();
          $camSetupStepWrapper.find('.state-ok-msg').show();
          $camSetupStepWrapper.find('.next-btn').show();
          ADL.renderSink({sinkId:sinkId, containerId:'camPreviewRenderer'});
        },
        localPrevStartError = function (errCode, errMsg) {
          $camSetupStepWrapper.find('.state-testing-msg').hide();
          $camSetupStepWrapper.find('.state-error-msg').show();
          $('#camError').html('Reason: Failed to use given device - ' +
              errMsg + ' (errCode ' + errCode + ')');
          $('#accordion').accordion('refresh');
        };

//    Stop local video if was started previously
    var localPrevStopped = function () {
      var selectedMic = $('#camSelect').val();
      $camSetupStepWrapper.find('.state-msg').hide();
      $camSetupStepWrapper.find('.next-btn').hide();
      $camSetupStepWrapper.find('.state-testing-msg').show();

      var camSelectedSuccHandler = function () {
            $('#accordion').accordion('refresh');

            ADL.getService().startLocalVideo(
                ADL.r(localPrevStarted, localPrevStartError));
          },
          camSelectedErrHandler = function (errCode, errMsg) {
            $camSetupStepWrapper.find('.state-error-msg').show();
            $('#camError').html('Reason: Failed to select given device - ' +
                errMsg + ' (errCode ' + errCode + ')');
            $('#accordion').accordion('refresh');
          };

      ADL.getService().setVideoCaptureDevice(
          ADL.r(camSelectedSuccHandler, camSelectedErrHandler), selectedMic);

    };

    ADL.getService().stopLocalVideo(ADL.r(localPrevStopped, localPrevStopped));
  }

  /**
   * Handles the change event of the video capture devices select.
   */
  function onCamSelected() {
    startCamTest();
  }

  function camTestComplete() {
    ADL.getService().stopLocalVideo(ADL.r());
    nextStep();
    setupConnAndHwTest();
  }

  //============================================================================

  var ConnHwItemStatus = {BAD:'ok', WARN:'warn', OK:'bad'};


  function setupConnAndHwTest() {
    testCpu();
  }

  var CLOCK_MAP = {
    1:{warn:2000, ok:Number.MAX_VALUE},
    2:{warn:1700, ok:3000},
    3:{warn:2500, ok:3000},
    4:{ok:2000}

  };


  function testCpu() {
    var $cpuTest = $('#cpuTest');
    var onHostDetails = function (info) {
      var cpuStatus = ConnHwItemStatus.BAD;
      if (CLOCK_MAP[info.cores] !== undefined) {
        if (CLOCK_MAP[info.cores].ok > info.clock) {
          cpuStatus = ConnHwItemStatus.OK;
        } else if (CLOCK_MAP[info.cores].warn > info.clock) {
          cpuStatus = ConnHwItemStatus.WARN;
        }
      } else if (info.cores > 4) {
        cpuStatus = ConnHwItemStatus.OK;
      }
      if (info.brand_string.match(/Atom/)) {
        cpuStatus = ConnHwItemStatus.WARN;
      }
      $cpuTest.find('.info').html(info.brand_string).show();
      $cpuTest.find('.hw-conn-' + cpuStatus).show();
    }, onHostDetailsErr = function () {
      $cpuTest.find('.info').html("Failed to identify CPU").show();
      $cpuTest.find('.hw-conn-warn').show();
    };
    ADL.getService().getHostCpuDetails(ADL.r(onHostDetails, onHostDetailsErr))
  }

  function nextStep() {
    var $accordion = $('#accordion');
    var currentStep = $accordion.accordion('option', 'active');
    $accordion.accordion('option', 'active', currentStep + 1);
  }

  /**
   * ===========================================================================
   * AddLiveService events handling
   * ===========================================================================
   */

  function onDeviceListChanged(e) {
    log.debug("Got devices list changed");
    if (e.audioInChanged) {
      log.debug("Got new microphone plugged in");
      ADLT.populateDevicesOfType('#micSelect', 'AudioCapture');
    }
    if (e.audioOutChanged) {
      log.debug("Got new speakers plugged in");
      ADLT.populateDevicesOfType('#spkSelect', 'AudioOutput');
    }
    if (e.videoInChanged) {
      log.debug("Got new camera plugged in");
      ADLT.populateDevicesOfType('#camSelect', 'VideoCapture');
    }
  }

  function onMicActivity(e) {
    log.debug("Got mic activity: " + e.activity);
    $('#micActivityBar').progressbar('value', e.activity / 255 * 100);
    micActivitySamples.push(e.activity);
  }


  /**
   * ===========================================================================
   * Initialization events handling
   * ===========================================================================
   */
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
