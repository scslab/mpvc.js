(function() {
"use strict";
var assert = require('assert');

// DC labels:
var dclabel   = require('../../dclabels');
var Group     = dclabel.Group;
var Label     = dclabel.Label;
var Privilege = dclabel.Privilege;

// CURRENT LABEL ======================================================

// privacy:

var privacyLabel = new Label();

Object.defineProperty(exports,"privacyLabel",
  { get: function() {  return privacyLabel; },
    set: setPrivacyLabel,
    enumerable: true,
    configurable: false
  });

function setPrivacyLabel(lnew, privs) {
  assert.ok(lnew.subsumes(privacyLabel, privs), 
            "Existing label "+lnew+" is not subsumed by label "+lnew);

  if (privacyClearance)
    assert.ok(privacyClearance.subsumes(lnew),
              "Clearance "+privacyClearance+" does not subsume label "+lnew);

  privacyLabel = lnew;
}

// trust:

var trustLabel = new Label();

Object.defineProperty(exports,"trustLabel",
  { get: function() {  return trustLabel; },
    set: setTrustLabel,
    enumerable: true,
    configurable: false
  });

function setTrustLabel(lnew, privs) {
  assert.ok(trustLabel.subsumes(lnew, privs), 
            "Existing label "+trustLabel+" does not subsume label "+lnew);

  if (trustClearance)
    assert.ok(lnew.subsumes(trustClearance),
              "Label "+lnew+" does not subsume clearance "+trustClearance);

  trustLabel = lnew;
}
// ====================================================================

// CURRENT CLEARANCE ==================================================

var privacyClearance = null;

Object.defineProperty(exports,"privacyClearance",
  { get: function() {  return privacyClearance; },
    set: setPrivacyClearance,
    enumerable: true,
    configurable: false
  });

function setPrivacyClearance(lnew, privs) {
  assert.ok(privacyClearance.subsumes(lnew, privs), 
            "Existing clearance "+privacyClearance+" does not subsume clearance "+lnew);

  assert.ok(lnew.subsumes(privacyLabel),
            "Label "+lnew+" does not subsume clearnace "+privacyLabel);

  privacyClearance = lnew;
}


var trustClearance = null;

Object.defineProperty(exports,"trustClearance",
  { get: function() {  return trustClearance; },
    set: setTrustClearance,
    enumerable: true,
    configurable: false
  });

function setTrustClearance(lnew, privs) {
  assert.ok(lnew.subsumes(trustClearance, privs), 
            "Existing clearance "+trustClearance+" is not subsumed by clearance "+lnew);

  assert.ok(trustLabel.subsumes(lnew),
            "Label "+trustLabel+" does not subsume clearnace "+lnew);

  trustClearance = lnew;
}

// ====================================================================



// EXPORTS ============================================================

exports.setPrivacyLabel = setPrivacyLabel;
exports.setTrustLabel = setTrustLabel;

exports.setPrivacyClearance = setPrivacyClearance;
exports.setTrustClearance = setTrustClearance;

exports.Group = Group;
exports.Label = Label;
exports.Privilege = Privilege;

})();
