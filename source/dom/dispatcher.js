﻿//* @protected
enyo.$ = {};

enyo.dispatcher = {
	// these events come from document
	events: ["mousedown", "mouseup", "mouseover", "mouseout", "mousemove", "mousewheel", "click", "dblclick", "change", "keydown", "keyup", "keypress", "input"],
	// thes events come from window
	windowEvents: ["resize", "load", "unload", "message"],
	// feature plugins (aka filters)
	features: [],
	connect: function() {
		var d = enyo.dispatcher;
		for (var i=0, n; n=d.events[i]; i++) {
			d.listen(document, n);
		}
		for (i=0, n; n=d.windowEvents[i]; i++) {
			d.listen(window, n);
		}
	},
	listen: function(inListener, inEventName) {
		var d = enyo.dispatch;
		if (inListener.addEventListener) {
			this.listen = function(inListener, inEventName) {
				inListener.addEventListener(inEventName, d, false);
			};
		} else {
			console.log("IE8 COMPAT: using 'attachEvent'");
			this.listen = function(inListener, inEvent, inCb) {
				inListener.attachEvent("on" + inEvent, function(e) {
					e.target = e.srcElement;
					return d(e);
				});
			};
		}
		this.listen(inListener, inEventName);
	},
	//* Fire an event for Enyo to listen for
	dispatch: function(e) {
		// Find the control who maps to e.target, or the first control that maps to an ancestor of e.target.
		var c = this.findDispatchTarget(e.target) || this.findDefaultTarget(e);
		// Cache the original target
		e.dispatchTarget = c;
		// support pluggable features return true to abort immediately or set e.preventDispatch to avoid processing.
		for (var i=0, fn; fn=this.features[i]; i++) {
			if (fn.call(this, e) === true) {
				return;
			}
		}
		if (c && !e.preventDispatch) {
			this.dispatchBubble(e, c);
		}
	},
	//* Takes an Event.target and finds the corresponding enyo control
	findDispatchTarget: function(inNode) {
		var t, n = inNode;
		// FIXME: Mozilla: try/catch is here to squelch "Permission denied to access property xxx from a non-chrome context" 
		// which appears to happen for scrollbar nodes in particular. It's unclear why those nodes are valid targets if 
		// it is illegal to interrogate them. Would like to trap the bad nodes explicitly rather than using an exception block.
		try {
			while (n) {
				if (t = enyo.$[n.id]) {
					// there could be multiple nodes with this id, the relevant node for this event is n
					// we don't push this directly to t.node because sometimes we are just asking what
					// the target 'would be' (aka, calling findDispatchTarget from handleMouseOverOut)
					t.eventNode = n;
					break;
				}
				n = n.parentNode;
			}
		} catch(x) {
			console.log(x, n);
		}
		return t;
	},
	//* Return the default enyo control for events
	findDefaultTarget: function(e) {
		return enyo.master;
	},
	dispatchBubble: function(e, c) {
		return c.bubble("on" + e.type, e, c);
	}
};

enyo.dispatch = function(inEvent) {
	return enyo.dispatcher.dispatch(inEvent);
};

enyo.bubble = function(e) {
	if (e) {
		// We depend on e.target existing for event tracking and dispatching.
		if (!e.target) {
			e.target = e.srcElement;
		}
		enyo.dispatch(e);
	}
};

// '|| window.event' clause needed for IE8
enyo.bubbler = 'enyo.bubble(arguments[0] || window.event)';

// FIXME: we need to create and initialize dispatcher someplace else to allow overrides
enyo.requiresWindow(enyo.dispatcher.connect);
