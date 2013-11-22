(function() {
"use strict";
var assert = require('assert');

// GROUPS =============================================================

// Group(String or [String] or Group) 
function Group(ps) {
  if (!Group.isGroup(this))
    return new Group(ps);

  this._principals = [];
  this.or(ps);
  Object.seal(this);
}

// Returns true if the argument is a Group
Group.isGroup = function(group) {
  return group instanceof Group;
};

// Group or(String or [String] or Group)
Group.prototype.or = function(ps) {
  function _or(principal) {
    assert.ok(isString(principal), "Expected non-empty String");

    if (this._principals.indexOf(principal) === -1)
      this._principals.push(principal);
  }

  if (isString(ps)) {
    _or.call(this, ps);
  } else if (isArray(ps)) {
    assert.ok(isArray(ps), "Expected non-empty Array");
    ps.forEach(function (p) { _or.call(this, p); }, this);
  } else {
    assert.ok(Group.isGroup(ps), 
              "Expected non-empty Array of non-empty Strings, "+
              "a non-empty String, or a Group");
    ps._principals.forEach(_or, this);
  }
  return this;
};

Group.prototype.toString = function() {
  var str = "Group(";
  var end = this._principals.length - 1;
  this._principals.forEach(function(element, idx) {
     str += '"'+element+'"';
     if (idx !== end) {
       str += ").or(";
     }
  });
  str += ")";
  return str;
};

// bool subsumes(Group other)
Group.prototype.subsumes = function(other) {
  assert.ok(Group.isGroup(other), "Expected Group");
  // We have more principals, hence cannot subsume
  if (other._principals.length < this._principals.length)
    return false;
  // Ensure that the other role contains all the principals of this role
  return this._principals.every(function(principal) {
    return (other._principals.indexOf(principal) !== -1);
  });
};

// bool equals(Group other)
Group.prototype.equals = function(other) {
  return this === other || (this.subsumes(other) && other.subsumes(this));
};

// ====================================================================


// LABELS =============================================================

// Label(optional (String or Group or [Group] or Label))
function Label(gs) {
  if (!Label.isLabel(this))
    return new Label(gs);

  this._groups = [];
  if (gs)
    this.and(gs);
  Object.seal(this);
}

// Returns true if the argument is a Label
Label.isLabel = function(label) {
  return label instanceof Label;
};

// Label and(String or Group or [Group] or Label)
Label.prototype.and = function(gs) {
  function _and(group) {
    assert.ok(Group.isGroup(group), "Expected Group");

    var isRedundant = this._groups.some(function (g) { 
                        return g.subsumes(group); 
                      });
    if (isRedundant) return;
    this._groups.forEach(function (g, i) { 
      if (group.subsumes(g))
        this._groups.splice(i,1);
    }, this);
    this._groups.push(group);
  }

  if (isString(gs)) {
    _and.call(this, new Group(gs));
  } else if (Group.isGroup(gs)) {
    _and.call(this, gs);
  } else if (isArray(gs)) {
    assert.ok(isArray(gs), "Expected non-empty Array");
    gs.forEach(function(g) { _and.call(this, g); }, this);
  } else {
    assert.ok(Label.isLabel(gs), 
              "Expected non-empty Array of Groups, "+
              "a non-empty String, or a Label");
    gs._groups.forEach(_and, this);
  }
  return this;
};

// Label or(String or Group or [Group] or Label)
Label.prototype.or = function(gs) {
  function _or(group) {
    assert.ok(Group.isGroup(group), "Expected Group");
    var l = new Label();
    this._groups.forEach(function (g, i) { 
       l.and(g.or(group));
    });
    this._groups = l._groups;
  }

  if (isString(gs)) {
    _or.call(this, new Group(gs));
  } else if (Group.isGroup(gs)) {
    _or.call(this, gs);
  } else if (isArray(gs)) {
    assert.ok(isArray(gs), "Expected non-empty Array");
    gs.forEach(function(g) { _or.call(this, g); }, this);
  } else {
    assert.ok(Label.isLabel(gs), 
              "Expected non-empty Array of Groups, "+
              "a non-empty String, or a Label");
    gs._groups.forEach(_or, this);
  }
  return this;
};

Label.prototype.toString = function() {
  var str = "Label(";
  var end = this._groups.length - 1;
  this._groups.forEach(function(element, idx) {
     str += '"'+element+'"';
     if (idx !== end) {
       str += ").and(";
     }
  });
  str += ")";
  return str;
};

// bool subsumes(Label other, optional Privilege priv)
Label.prototype.subsumes = function(other, priv) {
  assert.ok(Label.isLabel(other),"Expected Label");

  if (priv) {
    assert.ok(Privilege.isPrivilege(priv),"Expected Privilege");
    var this_ = new Label(this_);
    this_.and(priv._label);
    return this_.subsumes(other);
  } else {
    // there are more groups in the other formula, this label cannot subsumes it
    if (other._groups.length > this._groups.length)
      return false;
    // the other label has a group that no group in this label subsumes
    return other._groups.every(function(group) {
      return this._groups.some(function(tgroup) { 
                return tgroup.subsumes(group);
              });
    }, this);
  }
};

// bool equals(Label other)
Label.prototype.equals = function(other) {
  return this === other || (this.subsumes(other) && other.subsumes(this));
};

// ====================================================================

// PRIVILEGES =========================================================

// Privilege(Label))
function Privilege(l) {
  if (!Privilege.isPrivilege(this))
    return new Privilege(l);

  l = l || new Label();
  assert.ok(Label.isLabel(l),"Expected Label");
  this._label = l;
  Object.seal(this);
}

// Privilege combine(Privilege)
Privilege.prototype.combine = function(priv) {
  assert.ok(Privilege.isPrivilege(priv),"Expected Privilege");
  this._label.and(priv._label);
  return this;
};

// Returns true if the argument is a Privilege
Privilege.isPrivilege = function(priv) {
  return priv instanceof Privilege;
};

Privilege.prototype.toString = function() {
  return "Privilege("+this._label+")";
};

// bool subsumes(Privilege other)
Privilege.prototype.subsumes = function(other) {
  return this._label.subsumes(other._label);
};

// bool equals(Privilege other)
Privilege.prototype.equals = function(other) {
  return this === other || (this.subsumes(other) && other.subsumes(this));
};

// Privilege freeze()
Privilege.prototype.freeze = function() {
  deepFreeze(this);
  return this;
};

// ====================================================================


// HELPER FUNCTIONS ===================================================

// Returns true if the argument is a non-empty string
function isString(str) {
  return str && typeof(str) === 'string';
}

// Returns true if the argument is a non-empty array
function isArray(ps) {
  return Array.isArray(ps) && ps.length > 0;
}

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

exports.Group = deepFreeze(Object.freeze(Group));
exports.Label = deepFreeze(Object.freeze(Label));
exports.Privilege = deepFreeze(Object.freeze(Privilege));

})();
