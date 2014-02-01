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
    var initOptions = {applicationId:APPLICATION_ID};
    // Initializes the AddLive SDK. Please refer to ../shared-assets/scripts.js
    ADLT.initializeAddLiveQuick(_platformReady(), initOptions);
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

  /**
   * Register the document ready handler.
   */
  $(onDomReady);
})();