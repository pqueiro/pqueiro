// webkitdragdrop.js v1.0, Mon May 15 2010
//
// Copyright (c) 2010 Tommaso Buvoli (http://www.tommasobuvoli.com)
// No Extra Libraries are required, simply download this file, add it to your pages!
//
// To See this library in action, grab an ipad and head over to http://www.gotproject.com
// webkitdragdrop is freely distributable under the terms of an MIT-style license.

//Description
// Because this library was designed to run without requiring any other libraries, several basic helper functions were implemented
// 6 helper functons in this webkit_tools class have been taked directly from Prototype 1.6.1 (http://prototypejs.org/) (c) 2005-2009 Sam Stephenson
var webkit_DragManager = {
    draggables: [],
    dropZones: [],

    addDraggable: function (draggleId, option) {
        this.draggables.push(new webkit_draggable(draggleId, option));
    },

    removeDraggable: function (draggableID) {
        for (var i = 0; i < this.draggables.length; i++) {
            if (this.draggables[i].p.handle.id == draggableID) {
                this.draggables[i].destroy();
                break;
            }
        }
    },

    addDropZone: function (dropZoneId, option) {
        webkit_drop.add(dropZoneId, option);
        this.dropZones.push(dropZoneId);
    },

    reset: function () {
        // remove draggables
        for (var i = 0; i < this.draggables.length; i++) {
            this.draggables[i].destroy();
        }

        this.draggables = [];

        // remove drop zone
        for (var i = 0; i < this.dropZones.length; i++) {
            webkit_drop.remove(this.dropZones[i].id);
        }

        this.dropZones = [];
    }
};

var webkit_tools = {
    //$ function - simply a more robust getElementById
    $: function (e) {
        if (typeof (e) == 'string') {
            return document.getElementById(e);
        }
        return e;
    },

    //extend function - copies the values of b into a (Shallow copy)
    extend: function (a, b) {
        for (var key in b) {
            a[key] = b[key];
        }
        return a;
    },

    //empty function - used as defaut for events
    empty: function () { },

    //remove null values from an array
    compact: function (a) {
        var b = []
        var l = a.length;
        for (var i = 0; i < l; i++) {
            if (a[i] !== null) {
                b.push(a[i]);
            }
        }
        return b;
    },

    //DESCRIPTION
    //	This function was taken from the internet (http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/) and returns
    //	the computed style of an element independantly from the browser
    //INPUT
    //	oELM (DOM ELEMENT) element whose style should be extracted
    //	strCssRule element
    getCalculatedStyle: function (oElm, strCssRule) {
        var strValue = "";
        if (document.defaultView && document.defaultView.getComputedStyle) {
            strValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
        } else if (oElm.currentStyle) {
            strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1) {
                return p1.toUpperCase();
            });
            strValue = oElm.currentStyle[strCssRule];
        }
        return strValue;
    },

    //bindAsEventListener function - used to bind events
    bindAsEventListener: function (f, object) {
        var __method = f;
        return function (event) {
            __method.call(object, event || window.event);
        };
    },

    //cumulative offset - courtesy of Prototype (http://www.prototypejs.org)
    cumulativeOffset: function (element) {
        var valueT = 0,
            valueL = 0;
        do {
            valueT += element.offsetTop || 0;
            valueL += element.offsetLeft || 0;
            if (element.offsetParent == document.body) if (element.style.position == 'absolute') break;

            element = element.offsetParent;
        } while (element);

        return {
            left: valueL,
            top: valueT
        };
    },

    //getDimensions - courtesy of Prototype (http://www.prototypejs.org)
    getDimensions: function (element) {
        var display = element.style.display;
        if (display != 'none' && display != null) // Safari bug
            return {
                width: element.offsetWidth,
                height: element.offsetHeight
            };

        var els = element.style;
        var originalVisibility = els.visibility;
        var originalPosition = els.position;
        var originalDisplay = els.display;
        els.visibility = 'hidden';
        if (originalPosition != 'fixed') // Switching fixed to absolute causes issues in Safari
            els.position = 'absolute';
        els.display = 'block';
        var originalWidth = element.clientWidth;
        var originalHeight = element.clientHeight;
        els.display = originalDisplay;
        els.position = originalPosition;
        els.visibility = originalVisibility;
        return {
            width: originalWidth,
            height: originalHeight
        };
    },

    //hasClassName - courtesy of Prototype (http://www.prototypejs.org)
    hasClassName: function (element, className) {
        var elementClassName = element.className;
        return (elementClassName.length > 0 && (elementClassName == className || new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
    },

    //addClassName - courtesy of Prototype (http://www.prototypejs.org)
    addClassName: function (element, className) {
        if (!this.hasClassName(element, className)) element.className += (element.className ? ' ' : '') + className;
        return element;
    },

    //removeClassName - courtesy of Prototype (http://www.prototypejs.org)
    removeClassName: function (element, className) {
        if (this.hasClassName(element, className)) {
            element.className = this.strip(element.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' '));
        }
        return element;
    },

    //strip - courtesy of Prototype (http://www.prototypejs.org)
    strip: function (s) {
        return s.replace(/^\s+/, '').replace(/\s+$/, '');
    }
}

//Description
// Droppable fire events when a draggable is dropped on them
var webkit_droppables = function () {
    this.initialize = function () {
        this.droppables = [];
        this.droppableRegions = [];
    }

    this.add = function (root, instance_props) {
        root = webkit_tools.$(root);
        var default_props = {
            accept: [],
            hoverClass: null,
            hoverAllDropZone: false,
            onDrop: webkit_tools.empty,
            onOver: webkit_tools.empty,
            onOut: webkit_tools.empty,
            onAllOver: webkit_tools.empty,
            onAllOut: webkit_tools.empty
        };
        default_props = webkit_tools.extend(default_props, instance_props || {});
        this.droppables.push({
            r: root,
            p: default_props
        });
    }

    this.remove = function (root) {
        root = webkit_tools.$(root);
        var d = this.droppables;
        var i = d.length;
        while (i--) {
            if (d[i].r == root) {
                d[i] = null;
                this.droppables = webkit_tools.compact(d);
                return true;
            }
        }
        return false;
    }

    //calculate position and size of all droppables
    this.prepare = function () {
        var d = this.droppables;
        var i = d.length;
        var dR = [];
        var r = null;

        while (i--) {
            r = d[i].r;
            if (r.style.display != 'none') {
                dR.push({
                    i: i,
                    size: webkit_tools.getDimensions(r),
                    offset: webkit_tools.cumulativeOffset(r),
                    dropzone: r
                })
            }
        }

        this.droppableRegions = dR;
    }

    this.isIPad1 = function () {
        if (navigator.userAgent.indexOf("iPad") != -1
            && navigator.userAgent.indexOf("OS 5") != -1) {
            return true;
        }
        else {
            return false;
        }
    }

    this.isIE89 = function () {
        if (navigator.userAgent.indexOf("MSIE 8") != -1 || navigator.userAgent.indexOf("MSIE 9") != -1) {
            return true;
        }
        else {
            return false;
        }
    }

    this.finalize = function (x, y, r, p, e) {
        //[IN:039575] Here we initialize the lastIndex value to undefined. During initialization, the droppable might hover a content zone and so we may have a lastIndex value which correspond to a wrong content zone. And in this.process call we are returning a wrong value.
        this.lastIndex = undefined;
        var indices = this.isOver(x, y);
        var index = this.maxZIndex(indices);
        var over = this.process(index, r);
        var self = this;

        webkit_tools.removeClassName(r, "dragging");

        if (over) {
            this.drop(index, r, e);
        }
        else {
            var revertFunction = function (event) {
                webkit_tools.addClassName(r, "release");

                //remove the animated class
                webkit_tools.removeClassName(r, "animatedfast");

                //remove the shake class
                webkit_tools.removeClassName(r, "shake");

                //remove the droptransition class
                webkit_tools.removeClassName(r, "droptransition");

                r.setAttribute("style", "top: " + p.ry + "px; left: " + p.rx + "px;");
                self.process(-1, r);

                // remove hoverClass on all drop zones
                for (var i = 0; i < self.droppables.length; i++) {
                    var dropZone = self.droppables[i]
                    var parent = dropZone.p;
                    var root = dropZone.r;
                    if (parent.hoverClass) {
                        webkit_tools.removeClassName(root, parent.hoverClass);
                    }
                }

                // hack : it is important to hide slowly the mask. During this time, the drage zone come back to its initial position.
                setTimeout(function () { $("#mask").css("display", "none"); }, 500);
            };

            if (this.isIPad1()) {
                // The shake animation make shut down the iPad 1.
                setTimeout(revertFunction, 200);
            }
            else if (this.isIE89()) {
                // We use jQuery on other browsers.
                // Shake draggable :
                $(r).animate({ left: "-=20" }, 20);
                setTimeout(function () { $(r).animate({ left: "+=40" }, 20); }, 20);
                setTimeout(function () { $(r).animate({ left: "-=40" }, 20); }, 40);
                setTimeout(function () { $(r).animate({ left: "+=40" }, 20); }, 60);
                setTimeout(function () { $(r).animate({ left: "-=20" }, 20); }, 80);
                setTimeout(function () { $(r).animate({ left: p.rx, top: p.ry }, 500); }, 100);

                // Back to origianl position.
                setTimeout(revertFunction, 600);
            }
            else {
                // We use css 3 to animates draggable on webkit
                webkit_tools.addClassName(r, "animatedfast shake");
                webkit_tools.addClassName(r, "droptransition");
                r.addEventListener('animationend', revertFunction, false);
            }

            // we display a mask to fix a bug : when the user click on the draggable zone (which is shaked), its position changes.
            $("#mask").css("display", "block");
        }

        return over;
    }

    this.check = function (x, y, r) {
        var indices = this.isOver(x, y);
        var index = this.maxZIndex(indices);
        return this.process(index, r);
    }

    this.isOver = function (x, y) {
        var dR = this.droppableRegions;
        var i = dR.length;
        var active = [];
        var r = 0;
        var maxX = 0;
        var minX = 0;
        var maxY = 0;
        var minY = 0;

        while (i--) {
            r = dR[i];
            var dropzone = $(r.dropzone);

            minY = dropzone.offset().top;
            maxY = minY + r.size.height;

            if ((y >= minY) && (y < maxY)) {
                minX = r.offset.left;

                if (minX >= this.getParentOffset()) {
                    minX = minX - this.getParentOffset();
                }

                maxX = minX + r.size.width;

                if ((x >= minX) && (x <= maxX)) {
                    active.push(r.i);
                }
            }
        }

        return active;
    }

    this.getParentOffset = function () {
        return 0;
    }

    this.maxZIndex = function (indices) {
        var d = this.droppables;
        var l = indices.length;
        var index = -1;

        var maxZ = -100000000;
        var curZ = 0;

        while (l--) {
            curZ = parseInt(d[indices[l]].r.style.zIndex || 0);
            if (curZ > maxZ) {
                maxZ = curZ;
                index = indices[l];
            }
        }

        return index;
    }

    this.process = function (index, draggableRoot) {
        // remove hoverClass on all drop zone, except the over drop zone
        for (var i = 0; i < this.droppables.length; i++) {
            var d = this.droppables[i]
            var p = d.p;
            var r = d.r;
            if (p.hoverClass) {
                webkit_tools.removeClassName(r, p.hoverClass);
            }

            if (p.hoverAllDropZone && i == index) {
                webkit_tools.addClassName(r, p.hoverClass);
            }
        }

        // We are initializing the value to false because at the first call lastOutput might not be set by nobody as this.lastIndex = undefined
        this.lastOutput = false;
        //only perform update if a change has occured
        if (this.lastIndex != index) {
            //remove previous
            if (this.lastIndex != null && this.lastIndex != -1) {
                var d = this.droppables[this.lastIndex]
                var p = d.p;
                var r = d.r;

                p.onOut(draggableRoot);
                p.onAllOut(draggableRoot);
                this.lastIndex = null;
                this.lastOutput = false;
            }

            //add new
            if (index != -1) {
                var d = this.droppables[index]
                var p = d.p;
                var r = d.r;

                if (this.isAccepted(draggableRoot, p.accept)) {
                    if (p.hoverClass) {
                        webkit_tools.addClassName(r, p.hoverClass);
                    }

                    p.onOver(draggableRoot);

                    this.lastOutput = true;
                }

                if (draggableRoot.id == p.accept) {
                    p.onOver();

                    this.lastOutput = true;
                }

                p.onAllOver(draggableRoot);
            }
            this.lastIndex = index;
        }
        return this.lastOutput;
    }

    this.drop = function (index, r, e) {
        if (index != -1) {
            this.droppables[index].p.onDrop(r, e);
        }
    }

    this.hasClassNames = function (r, names) {
        var l = names.length;
        if (l == 0) {
            return true
        }
        while (l--) {
            if (webkit_tools.hasClassName(r, names[l])) {
                return true;
            }
        }
        return false;
    }

    this.isAccepted = function (r, acceptedIds) {
        var l = acceptedIds.length;
        if (l == 0) {
            return false;
        }
        while (l--) {
            if (r.id == acceptedIds[l]) {
                return true;
            }
        }
        return false;
    }

    this.initialize();
}

webkit_drop = new webkit_droppables();

//Description
//webkit draggable - allows users to drag elements with their hands
var webkit_draggable = function (r, ip) {
    this.isDragging = false;

    this.initialize = function (draggable, instance_props) {
        this.root = webkit_tools.$(draggable);

        var default_props = {
            scroll: false,
            revert: false,
            container: this.root,
            handle: this.root,
            zIndex: 1000,
            onStart: webkit_tools.empty,
            onEnd: webkit_tools.empty
        };

        this.p = webkit_tools.extend(default_props, instance_props || {});
        default_props.handle = webkit_tools.$(default_props.handle);
        this.prepare();
        this.bindEvents();
    }

    this.prepare = function () {
        var rs = this.root.style;

        //set position
        if (webkit_tools.getCalculatedStyle(this.root, 'position') != 'absolute') {
            rs.position = 'relative';
        }

        //set top, right, bottom, left
        rs.top = rs.top || '0px';
        rs.left = rs.left || '0px';
        rs.right = "";
        rs.bottom = "";

        //set zindex;
        rs.zIndex = rs.zIndex || '0';
    }

    this.bindEvents = function () {
        var handle = this.p.handle;
        var container = this.p.container;
        var self = this;

        this.ts = webkit_tools.bindAsEventListener(this.touchStart, this);
        this.tm = webkit_tools.bindAsEventListener(this.touchMove, this);
        this.te = webkit_tools.bindAsEventListener(this.touchEnd, this);

        if (this.useTouchEventListeners()) {
            handle.addEventListener("touchstart", this.ts, false);
            handle.addEventListener("touchmove", this.tm, false);
            handle.addEventListener("touchend", this.te, false);
        }

        if(this.useMouseEventListeners()) {
            if (handle.addEventListener) {
                handle.addEventListener("mousedown", this.ts, false);
                container.addEventListener("mousemove", this.tm, false);
                handle.addEventListener("mouseup", this.te, false);
            } else if (handle.attachEvent) {
                handle.attachEvent("onmousedown", this.ts);
                container.attachEvent("onmousemove", this.tm);
                handle.attachEvent("onmouseup", this.te);
            }
        }
    }

    this.destroy = function () {
        var handle = this.p.handle;
        var container = this.p.container;
        var self = this;

        if (this.useTouchEventListeners()) {
            handle.removeEventListener("touchstart", this.ts);
            handle.removeEventListener("touchmove", this.tm);
            handle.removeEventListener("touchend", this.te);
        }

        if(this.useMouseEventListeners()) {
            if (handle.removeEventListener) {
                handle.removeEventListener("mousedown", this.ts, false);
                container.removeEventListener("mousemove", this.tm, false);
                handle.removeEventListener("mouseup", this.te, false);
            }
            else if (handle.detachEvent) {
                handle.detachEvent("onmousedown", this.ts);
                container.detachEvent("onmousemove", this.tm);
                handle.detachEvent("onmouseup", this.te);
            }
        }
    }

    /**
    * If true, event listeners will be added on touchstart, touchmove and touchend to active touch.
    **/
    this.useTouchEventListeners = function () {
        // Get devices which need touchstart, touchmove and touchend event listeners to work well in touch mode.
        var isiOS = navigator.userAgent.indexOf("iPhone") != -1 || navigator.userAgent.indexOf("iPad") != -1 || (navigator.platform.indexOf("Mac") != -1 && navigator.maxTouchPoints > 1) || navigator.userAgent.indexOf("iPod") != -1;
        var isAndroid = navigator.userAgent.indexOf("Android") != -1;
        var isChrome = navigator.userAgent.indexOf("Chrome") != -1 && navigator.userAgent.indexOf("Edge") == -1; 
        // Note : returns Chrome to allow touch interaction for this browser. (In Chrome, touch interactions don't work with mouse events).
        return isiOS || isAndroid || isChrome;
    }

    /**
    * If true, event listeners will be added on mousedown, mousemove and mouseup to active touch.
    **/
    this.useMouseEventListeners = function () {
        var isChrome = navigator.userAgent.indexOf("Chrome") != -1 && navigator.userAgent.indexOf("Edge") == -1; 
        // All browsers can use mouse event, except touch devices contained in useTouchEventListeners.
        // Note : mouse events are called when we have mouse and touch interactions in all browsers, except Chrome.
        return !this.useTouchEventListeners() || isChrome;
    }

    this.set = function (key, value) {
        this.p[key] = value;
    }

    this.getEvent = function (event) {
        if (event.targetTouches) {
            return event.targetTouches[0];
        }
        else {
            return event;
        }
    }

    /**
    * Gets the x position of the mouse.
    */
    this.getPageX = function (event) {
        if (event.pageX) {
            return event.pageX;
        }
        else {
            // On IE<9 pageX does not exist.
            return event.clientX;
        }
    }

    /**
    * Gets the y position of the mouse.
    */
    this.getPageY = function (event) {
        if (event.pageY) {
            return event.pageY;
        }
        else {
            // On IE<9 pageY does not exist.
            return event.clientY;
        }
    }

    this.getPosition = function () {
        var rs = this.root.style;
        return {
            x: parseInt(rs.left || 0),
            y: parseInt(rs.top || 0)
        }
    }

    this.touchStart = function (event) {
        // If draggable element is already dragging, it means that the user dropped the item out of the window.
        // So in this case, do not consider the touchStart event, because the Item is already following the mouse.
        if (!this.isDragging && event) {
            // [IN:049622] [M2T MT] iPhone If page is still scrolling, dragging label gets whole layout moving 
            // This part of code is used to prevent page scrolling during dragging a label
            var viewport = $(".viewport");
            var overflowY = viewport.css("overflowY");
            if (overflowY != "hidden") {
                viewport.css("overflowY", "hidden");
                setTimeout(function () {
                    viewport.css("overflowY", overflowY);
                }, 10);
            }

            //prepare needed variables
            var p = this.p;
            var r = this.root;
            var rs = r.style;
            var t = this.getEvent(event);

            this.isDragging = true;

            webkit_tools.addClassName(r, "dragging");

            webkit_tools.removeClassName(r, "release");
            webkit_tools.removeClassName(r, "animatedfast");
            webkit_tools.removeClassName(r, "shake");
            webkit_tools.removeClassName(r, "droptransition");

            //get position of touch
            touchX = this.getPageX(t);
            touchY = this.getPageY(t);

            //set base values for position of root
            rs.top = this.root.style.top || '0px';
            rs.left = this.root.style.left || '0px';
            rs.bottom = null;
            rs.right = null;

            var rootP = webkit_tools.cumulativeOffset(r);
            var cp = this.getPosition();

            //save event properties
            p.rx = cp.x;
            p.ry = cp.y;
            p.tx = touchX;
            p.ty = touchY;
            p.z = parseInt(this.root.style.zIndex);

            //boost zIndex
            rs.zIndex = p.zIndex;
            webkit_drop.prepare();
            p.onStart(r);
        }
    }

    this.touchMove = function (event) {
        if (this.isDragging && event) {
            // IE<9 preventDefault does not exist.
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                // preventDefault in IE 8 will solve problems when dragging images
                event.returnValue = false;
                event.cancelBubble = true;
            }

            // IE<9 stopPropagation does not exist.
            if (event.stopPropagation) {
                event.stopPropagation();
            }

            //prepare needed variables
            var p = this.p;
            var r = this.root;
            var rs = r.style;
            var t = this.getEvent(event);
            if (t == null) {
                return
            }

            var curX = this.getPageX(t);
            var curY = this.getPageY(t);

            var delX = curX - p.tx;
            var delY = curY - p.ty;

            var left = p.rx + delX;

            // IE<9 does not allowed 'NaNpx' os left value.
            if (!isNaN(left)) {
                rs.left = left + 'px';
            }

            // IE<9 does not allowed 'NaNpx' os top value.
            var top = p.ry + delY;
            if (!isNaN(top)) {
                rs.top = top + 'px';
            }

            //scroll window
            if (p.scroll) {
                s = this.getScroll(curX, curY);
                if ((s[0] != 0) || (s[1] != 0)) {
                    window.scrollTo(window.scrollX + s[0], window.scrollY + s[1]);
                }
            }

            //check droppables
            webkit_drop.check(curX, curY, r, p);

            //save position for touchEnd
            this.lastCurX = curX;
            this.lastCurY = curY;
        }
    }

    this.touchEnd = function (event) {
        if (event) {

            this.isDragging = false;
            var r = this.root;
            var p = this.p;
            var dropped = webkit_drop.finalize(this.lastCurX, this.lastCurY, r, p, event);

            if (isNaN(this.p.z)) this.p.z = 0;
            r.style.zIndex = this.p.z;

            this.p.onEnd(r);
        }
    }

    this.getScroll = function (pX, pY) {
        //read window variables
        var sX = window.scrollX;
        var sY = window.scrollY;

        var wX = window.innerWidth;
        var wY = window.innerHeight;

        //set contants
        var scroll_amount = 10; //how many pixels to scroll
        var scroll_sensitivity = 100; //how many pixels from border to start scrolling from.
        var delX = 0;
        var delY = 0;

        //process vertical y scroll
        if (pY - sY < scroll_sensitivity) {
            delY = -scroll_amount;
        } else if ((sY + wY) - pY < scroll_sensitivity) {
            delY = scroll_amount;
        }

        //process horizontal x scroll
        if (pX - sX < scroll_sensitivity) {
            delX = -scroll_amount;
        } else if ((sX + wX) - pX < scroll_sensitivity) {
            delX = scroll_amount;
        }

        return [delX, delY]
    }

    //contructor
    this.initialize(r, ip);
}

//Description
//webkit_click class. manages click events for draggables

var webkit_click = function (r, ip) {
    this.initialize = function (root, instance_props) {
        var default_props = {
            onClick: webkit_tools.empty
        };

        this.root = webkit_tools.$(root);
        this.p = webkit_tools.extend(default_props, instance_props || {});
        this.bindEvents();
    }

    this.bindEvents = function () {
        var root = this.root;

        //bind events to local scope
        this.ts = webkit_tools.bindAsEventListener(this.touchStart, this);
        this.tm = webkit_tools.bindAsEventListener(this.touchMove, this);
        this.te = webkit_tools.bindAsEventListener(this.touchEnd, this);

        //add Listeners
        root.addEventListener("touchstart", this.ts, false);
        root.addEventListener("touchmove", this.tm, false);
        root.addEventListener("touchend", this.te, false);

        this.bound = true;
    }

    this.touchStart = function () {
        this.moved = false;
        if (this.bound == false) {
            this.root.addEventListener("touchmove", this.tm, false);
            this.bound = true;
        }
    }

    this.touchMove = function () {
        this.moved = true;
        this.root.removeEventListener("touchmove", this.tm);
        this.bound = false;
    }

    this.touchEnd = function () {
        if (this.moved == false) {
            this.p.onClick();
        }
    }

    this.setEvent = function (f) {
        if (typeof (f) == 'function') {
            this.p.onClick = f;
        }
    }

    this.unbind = function () {
        var root = this.root;
        root.removeEventListener("touchstart", this.ts);
        root.removeEventListener("touchmove", this.tm);
        root.removeEventListener("touchend", this.te);
    }

    //call constructor
    this.initialize(r, ip);
}