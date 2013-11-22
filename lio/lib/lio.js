(function() {
"use strict";
var assert = require('assert');
var clone = require('clone');

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
  guardAllocPrivacy(lnew, privs);
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
  guardAllocTrust(lnew, privs);
  trustLabel = lnew;
}
// ====================================================================

// CURRENT CLEARANCE ==================================================

// privacy:

var privacyClearance = null;

Object.defineProperty(exports,"privacyClearance",
  { get: function() {  return privacyClearance; },
    set: setPrivacyClearance,
    enumerable: true,
    configurable: false
  });

function setPrivacyClearance(lnew, privs) {
  assert.ok(privacyClearance.subsumes(lnew, privs), 
            "Existing clearance "+privacyClearance+
            " does not subsume clearance "+lnew);

  assert.ok(lnew.subsumes(privacyLabel),
            "Label "+lnew+" does not subsume clearnace "+privacyLabel);

  privacyClearance = lnew;
}

// trust:

var trustClearance = null;

Object.defineProperty(exports,"trustClearance",
  { get: function() {  return trustClearance; },
    set: setTrustClearance,
    enumerable: true,
    configurable: false
  });

function setTrustClearance(lnew, privs) {
  assert.ok(lnew.subsumes(trustClearance, privs), 
            "Existing clearance "+trustClearance+
            " is not subsumed by clearance "+lnew);

  assert.ok(trustLabel.subsumes(lnew),
            "Label "+trustLabel+" does not subsume clearnace "+lnew);

  trustClearance = lnew;
}

// ====================================================================

// LABELED VALUES =====================================================


// Labeled Labeled(any, optional { privacy: Label, trust: Label}, Privilege)
function Labeled(val, opts, privs) {
  if (!Labeled.isLabeled(this))
    return new Labeled(val, opts);

  var value = clone(val);

  opts = opts || {};

  // set the privacy label:
  this.privacy = opts.privacy || privacyLabel;
  assert.ok(Label.isLabel(this.privacy), "Expected Label");
  guardAllocPrivacy(this.privacy, privs);

  // set the trust label:
  this.trust = opts.trust || trustLabel;
  assert.ok(Label.isLabel(this.trust), "Expected Label");
  guardAllocTrust(this.trust, privs);

  // Call toString on the value, raising the current label
  this.toString = function() { 
    setPrivacyLabel(this.privacy, privs);
    setTrustLabel(this.trust, privs);
    return value.toString();
  }

  // Return the value, raising the current label
  this.valueOf = function() { 
    setPrivacyLabel(this.privacy, privs);
    setTrustLabel(this.trust, privs);
    return value;
  };

  deepFreeze(this);
}

Labeled.isLabeled = function(lobj) {
  return lobj instanceof Labeled;
};

// ====================================================================

// GUARDS =============================================================

// Throws an exception if the object label is not between the current
// label and clearance, taking privs into consideration.
function guardAllocPrivacy(lobj, privs) {
  assert.ok(lobj.subsumes(privacyLabel, privs), 
            "Existing label "+lobj+" is not subsumed by label "+lobj);

  if (privacyClearance)
    assert.ok(privacyClearance.subsumes(lobj),
              "Clearance "+privacyClearance+" does not subsume label "+lobj);
}

// Throws an exception if the object label is not between the current
// label and clearance, taking privs into consideration.
function guardAllocTrust(lobj, privs) {
  assert.ok(trustLabel.subsumes(lobj, privs), 
            "Existing label "+trustLabel+
            " does not subsume label "+lobj);
  if (trustClearance)
    assert.ok(lobj.subsumes(trustClearance),
              "Label "+lobj+" does not subsume clearance "+trustClearance);
}


// HELPER FUNCTIONS ===================================================

// Deep freeze an object and return it; from Object.freeze on MDN 
function deepFreeze (o) {
  var prop, propKey;
  Object.freeze(o);
  for (propKey in o) {
    prop = o[propKey];
    if ((!o.hasOwnProperty(propKey)) || 
        typeof prop !== "object"     || 
        Object.isFrozen(prop)) {
      continue;
    }
    deepFreeze(prop); // Recursively call deepFreeze.
  }
  return o;
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

exports.Labeled = Labeled;

})();
