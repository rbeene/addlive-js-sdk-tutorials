<?php

$APP_ID = -1; // Put your app Id here;
$API_KEY = ''; // Put your API key here;
$SCOPE_ID = 'SomeScopePlsChangeMe';  // Put your scope here;

$AUTH_DETAILS = _gen_auth_details(2, $APP_ID, $API_KEY, $SCOPE_ID);

function _gen_auth_details($userId, $appId, $apiKey, $scopeId){
  $authDetails = array("userId" => $userId, "salt" => _gen_random_string(20));
  $expires = mktime(date("H")+2,date("i"),date("s"),date("m"),date("d"),date("Y"));
  $authDetails['expires'] = $expires;
  $signature_body = $appId.
    $scopeId.
    $userId.
    $authDetails['salt'].
    $authDetails['expires'].
    $apiKey;
  $hasher = hash('sha256', $signature_body);
  $authDetails['signature'] = strtoupper($hasher);
  return $authDetails;
}

function _gen_random_string($size) {
  $alphabetsUpper = range('A','Z');
  $alphabetsLower = range('a','z');
  $numbers = range('0','9');
  $final_array = array_merge($alphabetsUpper,$alphabetsLower,$numbers);
  $random = '';
  while($size--) {
    $key = array_rand($final_array);
    $random .= $final_array[$key];
  }
  return $random;
}

?>
