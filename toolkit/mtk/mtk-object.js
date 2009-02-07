function MtkObject () {

    //
    // Object/Class Metadata
    //

    this.DerivationChain = [];
    var d_class = arguments.callee;
    while (d_class && d_class.name && d_class != d_class.caller) {
        this.DerivationChain.push (d_class.name);
        d_class = d_class.caller;
    }

    this.Name = (this.constructor && this.constructor.name) 
        ? this.constructor.name.toString ()
        : "MtkObject_Unknown";
    this.Name = this.Name + "_" + (MtkObject.Instances++).toString ();

    //
    // VTable Implementation
    //

    this._vtable = {};
    
    this._vt_install = function (method_name, class_name, method, is_virtual) {
        if (is_virtual && this._vtable[method_name]) {
            throw "Virtual method '" + method_name + "' already defined";
        } else if (!is_virtual && !this._vtable[method_name]) {
            throw "Virtual method '" + method_name + "' not defined";
        }

        var override_name = class_name + "_" + method_name;

        if (!this._vtable[method_name]) {
            this._vtable[method_name] = [];
        } else if (this._vtable[method_name][class_name]) {
            throw "Override method '" + override_name + "' already defined";
        }

        this._vtable[method_name].unshift ([method, class_name]);
        this[override_name] = method;
    };

    this.Virtual = function (method_name, method) {
        var class_name = arguments.callee.caller.name;
        this._vt_install (method_name, class_name, method, true);

        var self = this;
        
        // Most Derived Method Invocation
        this[method_name] = function () self._vtable[method_name][0][0].apply (self, arguments);
        
        // Base Override Invocation
        this["$" + method_name + "$"] = function () {
            var vt_method = self._vtable[method_name];
            for (var i = 0; i < vt_method.length - 1; i++) {
                if (vt_method[i][0] == arguments.callee.caller) {
                    return vt_method[i + 1][0].apply (self, arguments);
                }
            }
        };
    };

    this.Override = function (method_name, method) {
        this._vt_install (method_name, arguments.callee.caller.name, method);
    };
    
    //
    // Event Implementation
    //

    this._events = {};

    this.AddEventListener = function (eventName, handler, before) {
        if (!(handler instanceof Function)) {
            throw new TypeError;
        }
        
        var name = eventName.toLowerCase ();
        var event = this._events[name];
        
        if (event instanceof Array) {
            if (before) {
                event.unshift (handler);
            } else {
                event.push (handler);
            }
        } else {
            event = [ handler ];
        }
        
        this._events[name] = event;
    };

    this.RemoveEventListener = function (eventName, handler) {
        if (!(handler instanceof Function)) {
            throw new TypeError;
        }

        var name = eventName.toLowerCase ();
        var event = this._events[name];

        if (event instanceof Array) {
            event = event.filter (function (e) e != handler);
            if (event.length > 0) {
                this._events[name] = event;
            } else {
                delete this._events[name];
            }
        }
    };

    this.RaiseEvent = function (eventName) {
        var name = eventName.toLowerCase ();
        var event = this._events[name];

        if (event instanceof Array) {
            var event_args = Array.prototype.slice.call (arguments);
            event_args[0] = this;
            event.forEach (function (handler) {
                if (handler instanceof Function) {
                    handler.apply (this, event_args);
                }
            }, this);
        }
    };
}

MtkObject.Instances = 0;

