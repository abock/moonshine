//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

function MtkBox (settings) {
    MtkContainer.call (this, settings);
    this.InitFromXaml (this.XamlInitSource || "<Canvas/>");

    //
    // Properties
    //

    this.Spacing = 0;

    //
    // Collection Logic
    //

    this.PackStart = function (widget, expand) {
        widget.Settings.MtkBoxExpand = expand;
        this.Add (widget);
    };

    //
    // Sizing and Allocation/Generic Layout
    //
    //   VBox: Static = Width/Left,  Variable = Height/Top
    //   HBox: Static = Height/Left, Variable = Width/Left
    //
    //   The static dimension is dictated by child size requests,
    //   and the variable dimension by the parent allocation in
    //   the respective dimension
    //

    this.Override ("OnSizeRequest", function () {
        var request = { Width: 0, Height: 0 };
        var visible_child_count = 0;
        this.Children.forEach (function (child) {
            if (!child.Visible) {
                return;
            }
            visible_child_count++;
            var sr = child.SizeRequest;
            request[this.StaticDimension] = Math.max (request[this.StaticDimension], sr[this.StaticDimension]);
            request[this.VariableDimension] += sr[this.VariableDimension];
        }, this);
        request[this.StaticDimension] += 2 * this[this.StaticPadding];
        request[this.VariableDimension] += 2 * this[this.VariablePadding] + (visible_child_count - 1) * this.Spacing;
        return request;
    });

    this.Override ("OnSizeAllocate", function () {
        if (!this.IsRealized) {
            return;
        }

        // Avoid calling this.$OnSizeAllocate$ (MtkContainer)
        // since it handles child allocations as well. We
        // need this call to have ourself allocated first.
        this.MtkWidget_OnSizeAllocate ();

        var variable_offset = this[this.VariablePadding];
        var static_offset = this[this.StaticPadding];

        var static_space = 0;
        var flex_space = 0;
        var flex_count = 0;

        var visible_child_count = 0;

        this.Children.forEach (function (child) {
            if (!child.Visible) {
                return;
            }
            visible_child_count++;
            static_space += child.Settings.MtkBoxExpand ? 0 : child.SizeRequest[this.VariableDimension];
            flex_count += child.Settings.MtkBoxExpand ? 1 : 0;
        }, this);

        flex_space = this.Allocation[this.VariableDimension] - static_space - 
            (visible_child_count - 1) * this.Spacing - 2 * this[this.VariablePadding];
        if (flex_space < 0) {
            flex_space = 0;
        }
        
        this.Children.forEach (function (child) {
            if (!child.Visible) {
                return;
            }
            
            child.Allocation[this.VariableOffset] = variable_offset;
            child.Allocation[this.StaticOffset] = static_offset;

            if (child.Settings.MtkBoxExpand && flex_count > 0) {
                var size = flex_space / flex_count--;
                flex_space -= size;
                if (flex_count == 0) {
                    size += flex_space;
                }
                
                child.Allocation[this.VariableDimension] = size;
            } else {
                child.Allocation[this.VariableDimension] = child.SizeRequest[this.VariableDimension];
            }

            child.Allocation[this.StaticDimension] = this.Allocation[this.StaticDimension] - 2 * this[this.StaticPadding];

            variable_offset += child.Allocation[this.VariableDimension] + this.Spacing;

            child.Realize ();
            child.OnSizeAllocate ();
        }, this);
    });

    this.AfterConstructed ();
} 

function MtkHBox (settings) {
    MtkBox.call (this, settings);
    this.StaticDimension = "Height";
    this.VariableDimension = "Width";
    this.StaticOffset = "Top";
    this.VariableOffset = "Left";
    this.StaticPadding = "TotalYPadding";
    this.VariablePadding = "TotalXPadding";
    this.AfterConstructed ();
}

function MtkVBox (settings) {
    MtkBox.call (this, settings);
    this.StaticDimension = "Width";
    this.VariableDimension = "Height";
    this.StaticOffset = "Left";
    this.VariableOffset = "Top";
    this.StaticPadding = "TotalXPadding";
    this.VariablePadding = "TotalYPadding";
    this.AfterConstructed ();
}

