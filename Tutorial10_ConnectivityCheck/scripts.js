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
  var APPLICATION_ID = NaN, // Put your app Id here;
      APP_SHARED_SECRET = ''; // Put your API key here;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady() {
    console.log('DOM loaded');
    ADLT.initializeAddLiveQuick(_platformReady, {applicationId:APPLICATION_ID});
  }

  function _platformReady() {
    ADL.getService().getVersion((ADL.r(function (version) {
      $('#sdkVersionLbl').text(version);
    })));
    // assuming the genRandomUserId is exposed via ADLT namespace. (check shared-assets/scripts.js)
    var userId = ADLT.genRandomUserId();
    var connDescr = {
      scope:''
    };
    // assuming the genAuth is exposed via ADLT namespace. (check shared-assets/scripts.js)
    connDescr.authDetails = ADLT.genAuth('', userId, APPLICATION_ID, APP_SHARED_SECRET);
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


  function _platformReady() {
    // assuming the genRandomUserId and genAuth are exposed via ADLT namespace. (check shared-assets/scripts.js)
    var userId = ADLT.genRandomUserId();
    var connDescr = {
      scopeId:'',
      authDetails:ADLT.genAuth('', userId, APPLICATION_ID, APP_SHARED_SECRET),
      highVideoStream:{maxBitRate:1024}
    };
    $('#connQualityLbl').text('Testing...');
    ADL.getService().networkTest(ADL.r(_onNetworkTestResults), connDescr);
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