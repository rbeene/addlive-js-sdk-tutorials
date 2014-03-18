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


  /**
   * ===========================================================================
   * Consts
   * ===========================================================================
   */
  var
      /**
       * ID of an application - to be used with initialization
       */
        // To set your own APP_ID (check shared-assets/scripts.js)
          APPLICATION_ID = ADLT.APP_ID,


      /**
       * Shared secret to be used with authentication
       */
        // To set your own API_KEY (check shared-assets/scripts.js)
          APP_SHARED_SECRET = ADLT.API_KEY,

      /**
       * Minimal average round trip time to streaming server that makes the
       * connection fine.
       */
          AVG_RTT_OK = 300,

      /**
       * How long the microphone test should last.
       */
          MIC_TEST_DURATION = 4000,

      /**
       * Minimal mic activity to assume that the sample contained proper mic
       * input.
       */
          MIC_TEST_MIN_ACTIVITY = 20,

      /**
       * How long the sample connection should last.
       */
          CONNECTIVITY_TEST_DURATION = 10000;


  /**
   * ===========================================================================
   * Initialization
   * ===========================================================================
   */

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady() {
    console.log('DOM loaded');

    // assuming the initAddLiveLogging is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    ADLT.initAddLiveLogging();
    initUI();
    var initOptions = {
      // Here we're telling the SDK not to initialize media devices
      // automatically to some sane defaults, as we'd like to go through this
      // process manually with the end user
      initDevices:false,
      applicationId:APPLICATION_ID};
    initializeAddLive(initOptions);
  }

  /**
   * Initializes the AddLive SDK.
   */
  function initializeAddLive(options) {
    console.log('Initializing the AddLive SDK');

    // Step 1 - create the PlatformInitListener and overwrite it's methods.
    var initListener = new ADL.PlatformInitListener();

    // Define the handler for initialization progress changes
    initListener.onInitProgressChanged = initProgressChangedHandler;

    // Define the handler for initialization state changes
    initListener.onInitStateChanged = function (e) {
      switch (e.state) {

        case ADL.InitState.ERROR:
          // After receiving this status, the initialization is stopped as
          // due tutorial a failure.
          console.error('Failed to initialize the AddLive SDK');
          console.error('Reason: ' + e.errMessage + ' (' + e.errCode + ')');
          break;

        case ADL.InitState.INITIALIZED:
          //This state flag indicates that the AddLive SDK is initialized and fully
          //functional.
          var getVersionResult = function (version) {
            console.log('AddLive service version: ' + version);
            $('#sdkVersion').html(version);
            platformInitComplete();
          };

          var responder = ADL.r(getVersionResult);
          ADL.getService().getVersion(responder);
          break;

        case ADL.InitState.INSTALLATION_REQUIRED:
          // Current user doesn't have the AddLive Plug-In installed and it is
          // required - use provided URL to ask the user to install the Plug-in.
          // Note that the initialization process is just frozen in this state -
          // the SDK polls for plug-in availability and when it becomes available,
          // continues with the initialization.
          console.log('AddLive Plug-in installation required');
          $('#installBtn').attr('href', e.installerURL).css('display', 'block');
          break;
        case ADL.InitState.INSTALLATION_COMPLETE:
          console.log('AddLive Plug-in installation complete');
          $('#installBtn').hide();
          break;

        case ADL.InitState.BROWSER_RESTART_REQUIRED:
          // This state indicates that AddLive SDK performed auto-update and in
          // order to accomplish this process, browser needs to be restarted.
          console.log('Please restart your browser in order to complete platform auto-update');
          break;

        case ADL.InitState.DEVICES_INIT_BEGIN:
          // This state indicates that AddLive SDK performed auto-update and
          // in order to accomplish this process, browser needs to be restarted.
          console.log('Devices initialization started');
          break;

        default:
          // Default handler, just for sanity
          console.log('Got unsupported init state: ' + e.state);
      }
    };

    // Step 2. Actually trigger the asynchronous initialization of the AddLive SDK.
    ADL.initPlatform(initListener, options);
  }

  function initUI() {
    // Define handlers for the devices selection change
    $('#camSelect').change(onCamSelected);
    $('#micSelect').change(onMicSelected);
    $('#spkSelect').change(onSpkSelected);

    // Create the platform init progress bar
    $('#initProgressBar').
        progressbar({
          value:0
        });

    // Create the mic ativity indicator progress bar
    $('#micActivityBar').progressbar({value:10});

    // Create volume control slider
    $('#volumeCtrlSlider').slider({
      min:0,
      max:255,
      animate:true,
      value:127,
      slide:onVolumeSlide
    });

    // Create accordion
    $('#accordion').accordion({disabled:true});

    // Bind all the button actions
    $('#platformInitNextBtn').click(platformInitStepComplete);
    $('#micTestAgainBtn').click(startMicTest);
    $('#camTestAgainBtn').click(startCamTest);
    $('#micNextBtn').click(micSetupComplete);
    $('#spkNextBtn').click(spkTestComplete);
    $('#camNextBtn').click(camTestComplete);
    $('#playTestSoundBtn').click(onPlayTestSoundBtnClicked);

    // Use the jQuery UI's style for buttons
    $('a').button();

    // And hide all the next buttons.
    $('.next-btn').hide();
  }

  function initProgressChangedHandler(e) {
    console.log('Platform init progress: ' + e.progress);
    $('#initProgressBar').progressbar('value', e.progress);
  }

  /**
   * ===========================================================================
   * Step 1. Platform init
   * ===========================================================================
   */


  /**
   * Called upon platform initialization.
   */
  function platformInitComplete() {

    // assuming the populateDevicesQuick is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    ADLT.populateDevicesQuick();

    // Define the AddLiveServiceListener
    var listener = new ADL.AddLiveServiceListener();
    listener.onDeviceListChanged = onDeviceListChanged;
    listener.onMicActivity = onMicActivity;
    listener.onMediaConnTypeChanged = onMediaConnTypeChanged;
    listener.onMediaStats = onMediaStats;

    var onAddListenerSucc = function () {
      var $platformInitStep = $('#platformInitStep');
      $platformInitStep.find('.state-testing-msg').fadeOut(500, function () {
        $platformInitStep.find('.state-ok-msg').fadeIn(500, function () {
          $platformInitStep.find('.next-btn').show();
        });
      });
    };

    // Register the listener
    ADL.getService().addServiceListener(ADL.r(onAddListenerSucc), listener);
  }

  function platformInitStepComplete() {
    nextStep();
    startMicTest();
  }

  /**
   * ===========================================================================
   * Step 2. Microphone
   * ===========================================================================
   */

  var micActivitySamples = [];

  function startMicTest() {
    console.log('Starting microphone test');
    micActivitySamples = [];
    var selectedMic = $('#micSelect').val();
    var $micSetupStepWrapper = $('#micSetupStepWrapper');
    $micSetupStepWrapper.find('.state-msg').hide();
    $micSetupStepWrapper.find('.next-btn').hide();

    var micSelectedSuccHandler = function () {
          $micSetupStepWrapper.find('.state-testing-msg').show();
          // Set the mic gain to half of the range avail
          ADL.getService().setMicrophoneVolume(ADL.r(), 125);
          ADL.getService().monitorMicActivity(ADL.r(), true);
          setTimeout(micTestComplete, MIC_TEST_DURATION);
        },
        micSelectedErrHandler = function (errCode, errMsg) {
          $micSetupStepWrapper.find('.state-error-msg').show();
          $('#micError').html('Reason: Failed to select given device - ' +
              errMsg + '(' + errCode + ')');

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
      if (value > MIC_TEST_MIN_ACTIVITY) {
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
  }

  /**
   * Handles the change event of the audio capture devices select.
   */
  function onMicSelected() {
    startMicTest();
  }

  function onMicActivity(e) {
    console.log('Got mic activity: ' + e.activity);
    $('#micActivityBar').progressbar('value', e.activity / 255 * 100);
    micActivitySamples.push(e.activity);
  }


  function micSetupComplete() {
    nextStep();
    setupSpkTest();
  }

  /**
   * ===========================================================================
   * Step 3. Speakers.
   * ===========================================================================
   */

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
    ADL.getService().startPlayingTestSound(ADL.r(onSuccHandler, onErrHandler));
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

  /**
   * ===========================================================================
   * Step 4. Camera.
   * ===========================================================================
   */

  function setupCamTest() {
    startCamTest();
  }

  function startCamTest() {
    console.log('Starting camera test');
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

        };

    // Stop local video if was started previously
    var localPrevStopped = function () {
      var selectedMic = $('#camSelect').val();
      $camSetupStepWrapper.find('.state-msg').hide();
      $camSetupStepWrapper.find('.next-btn').hide();
      $camSetupStepWrapper.find('.state-testing-msg').show();

      var camSelectedSuccHandler = function () {

            ADL.getService().startLocalVideo(
                ADL.r(localPrevStarted, localPrevStartError));
          },
          camSelectedErrHandler = function (errCode, errMsg) {
            $camSetupStepWrapper.find('.state-error-msg').show();
            $('#camError').html('Reason: Failed to select given device - ' +
                errMsg + ' (errCode ' + errCode + ')');

          };

      ADL.getService().setVideoCaptureDevice(ADL.r(camSelectedSuccHandler,
          camSelectedErrHandler), selectedMic);

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

  /**
   * ===========================================================================
   * Step 5. Hardware and Connectivity.
   * ===========================================================================
   */

  var ConnHwItemStatus = {BAD:'bad', WARN:'warn', OK:'ok'};

  var connHwTestOverallResult = ConnHwItemStatus.OK;

  function setConnHwTestStatus(newStatus) {
    if (connHwTestOverallResult === ConnHwItemStatus.BAD) {
      return;
    }
    if (newStatus === ConnHwItemStatus.OK) {
      return;
    }
    connHwTestOverallResult = newStatus;
  }

  function setupConnAndHwTest() {
    testCpu();
    initTestConn();
  }

  var CLOCK_MAP = {
    1:{warn:2500, ok:Number.MAX_VALUE},
    2:{warn:1700, ok:2500},
    3:{warn:1700, ok:2500},
    // Any 4 cores CPU will do the job
    4:{ok:0}
  };

  var WARN_CPU_PATTERNS = [
    /Atom/, /Celeron/
  ];

  var BAD_CPU_PATTERNS = [
    /Pentium III/,
    /Pentium II/
  ];

  function testCpu() {
    var $cpuTest = $('#cpuTest');
    var onHostDetails = function (info) {
      var cpuStatus = ConnHwItemStatus.BAD;
      if (CLOCK_MAP[info.cores] !== undefined) {
        if (info.clock > CLOCK_MAP[info.cores].ok) {
          cpuStatus = ConnHwItemStatus.OK;
        } else if (info.clock > CLOCK_MAP[info.cores].warn) {
          cpuStatus = ConnHwItemStatus.WARN;
        }
      } else if (info.cores > 4) {
        cpuStatus = ConnHwItemStatus.OK;
      }
      $.each(WARN_CPU_PATTERNS, function (i, pattern) {
        if (info.brand_string.match(pattern)) {
          cpuStatus = ConnHwItemStatus.WARN;
        }
      });

      $.each(BAD_CPU_PATTERNS, function (i, pattern) {
        if (info.brand_string.match(pattern)) {
          cpuStatus = ConnHwItemStatus.BAD;
        }
      });

      $cpuTest.find('.info').html(info.brand_string).show();
      $cpuTest.find('.hw-conn-' + cpuStatus).show();
      setConnHwTestStatus(cpuStatus);
    }, onHostDetailsErr = function () {
      $cpuTest.find('.info').html('Failed to identify CPU').show();
      $cpuTest.find('.hw-conn-warn').show();
      setConnHwTestStatus(ConnHwItemStatus.WARN);
    };
    ADL.getService().getHostCpuDetails(ADL.r(onHostDetails, onHostDetailsErr));
  }

  var testScopeId;

  function initTestConn() {
    // assuming the genRandomUserId is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    var userId = ADLT.genRandomUserId();
    testScopeId = 'user_setup_scope_' + userId;
    var authDetails = ADLT.genAuth(testScopeId, userId, APPLICATION_ID,
        APP_SHARED_SECRET);

    var connDescriptor = {
      scopeId:testScopeId,
      authDetails:authDetails,
      autopublishAudio:true,
      autopublishVideo:false
    };
    ADL.getService().connect(ADL.r(onConnected, onConnErr), connDescriptor);
    setTimeout(hwConnTestComplete, CONNECTIVITY_TEST_DURATION);
  }

  function hwConnTestComplete() {
    testRTT();
    ADL.getService().disconnect(ADL.r(), testScopeId);
    $('.summary-wrapper').find('.hw-conn-' + connHwTestOverallResult).show();

  }

  function testRTT() {
    var avgRtt = 0, status, infoMsg = 'Average RTT: ';
    $.each(rtts, function (i, rtt) {
      avgRtt += parseInt(rtt, 10);
    });
    avgRtt /= rtts.length;
    infoMsg += avgRtt;

    if (avgRtt > AVG_RTT_OK) {
      status = ConnHwItemStatus.WARN;
    } else {
      status = ConnHwItemStatus.OK;
    }
    var $infoContainer = $('#distanceTest');
    $infoContainer.find('.info').
        html(infoMsg).
        show();
    $infoContainer.find('.hw-conn-' + status).show();
    setConnHwTestStatus(status);
  }

  function onConnected(mediaConn) {
    var $connTest = $('#connTest');
    $connTest.find('.info').html('Connection established').show();
    $connTest.find('.hw-conn-ok').show();
    ADL.getService().startMeasuringStatistics(ADL.r(), testScopeId, 2);
  }

  function onConnErr(errCode, errMsg) {
    var $connTest = $('#connTest');
    $connTest.find('.info').html('Failed to connect due to:<br/>' +
        errMsg + ' (errCode: ' + errCode + ')').addClass('hw-conn-bad').show();
    $('.conn-test-itm .hw-conn-bad').show();
    setConnHwTestStatus(ConnHwItemStatus.BAD);
  }

  /**
   *
   * @param {ADL.MediaConnTypeChangedEvent}e
   */
  function onMediaConnTypeChanged(e) {
    console.log('Got media connection type changed: ' + JSON.stringify(e));
    var $infoContainer, status, connTypeString;
    if (e.mediaType === ADL.MediaType.AUDIO) {
      $infoContainer = $('#connTypeAudioTest');
    }
    else {
      $infoContainer = $('#connTypeVideoTest');
    }
    switch (e.connectionType) {
      case ADL.ConnectionType.UDP_RELAY:
        status = ConnHwItemStatus.OK;
        connTypeString = 'Got low latency UDP communication';
        break;
      case ADL.ConnectionType.TCP_RELAY:
        status = ConnHwItemStatus.WARN;
        connTypeString = 'Got variable latency TCP communication';
        break;
    }

    $infoContainer.find('.info').html(connTypeString).show();
    $infoContainer.find('.hw-conn-' + status).show();
    setConnHwTestStatus(status);
  }

  var rtts = [];

  /**
   *
   * @param {ADL.MediaStatsEvent} e
   */
  function onMediaStats(e) {
    console.log('Got Media Stats event');
    if (e.mediaType === ADL.MediaType.AUDIO) {
      rtts.push(e.stats.rtt);
    }
  }

  function nextStep() {
    var $accordion = $('#accordion');
    var currentStep = $accordion.accordion('option', 'active');
    $accordion.
        accordion('option', 'active', currentStep + 1).
        accordion('refresh');
  }

  /**
   * ===========================================================================
   * AddLiveService events common for more steps then 1
   * ===========================================================================
   */

  function onDeviceListChanged(e) {
    console.log('Got devices list changed');
    if (e.audioInChanged) {
      console.log('Got new microphone plugged in');
      ADLT.populateDevicesOfType('#micSelect', 'AudioCapture');
    }
    if (e.audioOutChanged) {
      console.log('Got new speakers plugged in');
      ADLT.populateDevicesOfType('#spkSelect', 'AudioOutput');
    }
    if (e.videoInChanged) {
      console.log('Got new camera plugged in');
      ADLT.populateDevicesOfType('#camSelect', 'VideoCapture');
    }
  }

  /**
   * Register the document ready handler.
   */
  $(onDomReady);
}(window, jQuery));
