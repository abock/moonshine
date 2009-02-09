//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

var MtkConsole = {

    truncate_function_source: true,

    console_driver: function (x) {
        dump (x);
    },

    _GetFunctionName: function (func, parent) {
        if (!parent) {
            return func ? func.name || "(anonymous)" : null;
        }

        for (var prop in parent) {
            if (parent[prop] == func) {
                var parent_name = parent.className || MtkConsole._GetFunctionName (parent.constructor);
                return parent_name == "Object" ? prop : parent_name + "." + prop;
            }
        }
    },

    Log: function (str) {
        MtkConsole.WriteLine (str);
    },

    Logf: function (parent, str) {
        str = str || parent;
        var caller_name = MtkConsole._GetFunctionName (MtkConsole.Logf.caller, 
            arguments.length > 1 ? parent : null);
        MtkConsole.WriteLine (caller_name + ": " + str);
    },

    Logfa: function (parent, args) {
        var args_dump = []
        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i] == "object") {
                args_dump.push (arguments[i].toString ());
            } else {
                args_dump.push (arguments[i]);
            }
        }

        MtkConsole.Write (MtkConsole._GetFunctionName (MtkConsole.Logfa.caller, this) + ": ");
        MtkConsole.ObjDump (args_dump);
    },

    Indent: function (indent, mult) {
        if (!mult) {
            mult = 2;
        }

        var indent_str = "";
        for (var i = 0; i < indent * mult; i++) {
            indent_str += " ";
        }
        
        return indent_str;
    },

    Write: function (str) {
        MtkConsole.console_driver (str);
    },

    WriteLine: function (str) {
        if (!str) {
            MtkConsole.console_driver ("\n");
        } else {
            MtkConsole.console_driver (str + "\n");
        }
    },

    WriteIndentLine: function (str, indent) {
        var indent_str = MtkConsole.Indent (indent);
        MtkConsole.WriteLine (indent_str + str.toString ());
    },

    WriteIndent: function (str, indent) {
        MtkConsole.Write (MtkConsole.Indent (indent) + str.toString ());
    },

    ObjectVisibleChildCount: function (o) {
        if (o instanceof Array) {
            return o.length;
        }

        var count = 0;
        for (prop in o) {
            count++;
        }

        return count;
    },

    _ObjDumpProperty: function (o, prop, invoke_getters, level, i, count, max_prop_len, stack) {
        var is_getter = !invoke_getters && o.__lookupGetter__ && o.__lookupGetter__ (prop);
        var is_setter = o.__lookupSetter__ && o.__lookupSetter__ (prop);
        var eval_prop = null;

        if (!is_getter && !is_setter) {
            try {
                eval_prop = o[prop];
            } catch (e) {
                eval_prop = { 
                    MtkConsole_ObjDump_Error: "Exception when dumping property '" + prop + "'", 
                    Details: e 
                };
            }
        }
        
        var prefix = o instanceof Array ? "" : prop + ": ";
        
        if (eval_prop != null && typeof eval_prop == "object" && 
            MtkConsole.ObjectVisibleChildCount (eval_prop) > 0) {
            MtkConsole.WriteIndent (prefix, level + 1);
        } else {
            MtkConsole.WriteIndent (prefix + MtkConsole.Indent (max_prop_len - 
                prop.length, 1), level + 1);
        }

        if (is_getter) {
            MtkConsole.Write ("get ()");
        } else if (is_setter) {
            MtkConsole.Write ("set (x)");
        } else {
            MtkConsole.ObjDump (eval_prop, invoke_getters, level + 1, stack);
        }

        if (i < count - 1) {
            MtkConsole.Write (",");
        }

        MtkConsole.WriteLine ();
    },

    ObjDump: function (o, invoke_getters, level, stack) {
        if (!invoke_getters) {
            invoke_getters = false;
        }

        if (!level) {
            level = 0;
        }

        if (!stack) {
            stack = [];
        }

        var max_type_len = "function ()".length;
        var type = typeof o;

        if (typeof o == "undefined") {
            type = "undefined";
        } else if (o === null) {
            type = "null";
        }

        switch (type) {
            case "undefined":
            case "null":
                MtkConsole.Write (type);
                break;
            case "object":
                var max_prop_len = 0;
                var count = 0;
                var i = 0;
                var obj_open_char = "{";
                var obj_close_char = "}";

                // Keep a stack of references to avoid recursively dumping; e.g.:
                // var x = {}; x.self = x;
                if (stack.indexOf (o) >= 0) {
                    MtkConsole.Write ("<object already dumped>");
                    break;
                }
                stack.push (o); 

                if (o instanceof Array) {
                    count = o.length;
                    obj_open_char = "[";
                    obj_close_char = "]";
                } else {
                    for (prop in o) {
                        if (prop.length > max_prop_len) {
                            max_prop_len = prop.length;
                        }
                        count++;
                    }
                } 

                var o_name = o ? o.toString () : null;
                if (o_name == null) {
                    MtkConsole.Write ("null");;
                } else if (o instanceof Array || o_name == "[object Object]") {
                    MtkConsole.Write (obj_open_char);
                } else {
                    var instanceof_str = !o.constructor || o.constructor.name == "Object" 
                        ? "" : "[object " + o.constructor.name + "] ";
                    MtkConsole.Write (instanceof_str + "(" + o + ") {");
                }

                if (count == 0 && o_name != null) {
                    MtkConsole.Write (obj_close_char);
                    break;
                }

                MtkConsole.WriteLine ();

                if (o instanceof Array) {
                    for (var i = 0; i < count; i++) {
                        MtkConsole._ObjDumpProperty (o, i, invoke_getters, level, i, count, 0, stack);
                    }
                } else {
                    for (prop in o) {
                        MtkConsole._ObjDumpProperty (o, prop, invoke_getters, level, i++, count, max_prop_len, stack);
                    }
                }

                MtkConsole.WriteIndent (obj_close_char, level);
                break;
            case "function":
                var source = o.toSource ();
                if (MtkConsole.truncate_function_source && source.length > 80) {
                    source = source.substring (0, 80) + "... }";
                }

                if (level == 0) {
                    MtkConsole.Write (source);
                } else {
                    MtkConsole.Write (source.replace (/^function [A-Za-z0-9_]+/, 
                        "function ").replace (/^\(|\)$/g, ""));
                }
                break;
            case "string":
                MtkConsole.Write ('"' + o.toString ().replace (/"/g, "\\\"") + '"');
                break;
            default:
                MtkConsole.Write (o);
                break;
        }

        if (level == 0) {
            MtkConsole.WriteLine ();
        }
    }
}

