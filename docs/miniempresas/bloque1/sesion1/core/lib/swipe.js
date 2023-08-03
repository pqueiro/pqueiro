/*
 * Swipe 2.0
 *
 * Brad Birdsall
 * Copyright 2013, MIT License
 *
*/

function Swipe(container, options) {

    'use strict';

    // utilities
    var noop = function () { }; // simple no operation function
    var offloadFn = function (fn) { setTimeout(fn || noop, 0) }; // offload a functions execution

    var pointerDownName = 'touchstart';
    var pointerUpName = 'touchend';
    var pointerMoveName = 'touchmove';

    // IE 10
    if (window.navigator.msPointerEnabled) {
        pointerDownName = 'MSPointerDown';
        pointerUpName = 'MSPointerUp';
        pointerMoveName = 'MSPointerMove';
    }
    // IE 11
    if (window.navigator.pointerEnabled) {
        pointerDownName = 'pointerdown';
        pointerUpName = 'pointerup';
        pointerMoveName = 'pointermove';
    }

    // check browser capabilities
    var browser = {
        addEventListener: !!window.addEventListener,
        touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
        transitions: (function (temp) {
            var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
            for (var i in props) if (temp.style[props[i]] !== undefined) return true;
            return false;
        })(document.createElement('swipe'))
    };

    // quit if no root element
    if (!container) return;
    var element = container.children[0];
    var slides, slidePos, width, length;
    options = options || {};
    var index = parseInt(options.startSlide, 10) || 0;
    var speed = options.speed || 300;
    options.continuous = options.continuous !== undefined ? options.continuous : true;

    function setup() {

        // cache slides
        slides = element.children;
        length = slides.length;

        // set continuous to false if only one slide
        if (slides.length < 2) options.continuous = false;

        //special case if two slides
        if (browser.transitions && options.continuous && slides.length < 3) {
            element.appendChild(slides[0].cloneNode(true));
            element.appendChild(element.children[1].cloneNode(true));
            slides = element.children;
        }

        // create an array to store current positions of each slide
        slidePos = new Array(slides.length);

        // determine width of each slide
        width = container.getBoundingClientRect().width || container.offsetWidth;

        element.style.width = (slides.length * width) + 'px';

        // stack elements
        var pos = slides.length;
        while (pos--) {

            var slide = slides[pos];

            slide.style.width = width + 'px';
            slide.setAttribute('data-index', pos);

            if (browser.transitions) {
                slide.style.left = (pos * -width) + 'px';
                move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
            }

        }

        // reposition elements before and after index
        if (options.continuous && browser.transitions) {
            move(circle(index - 1), -width, 0);
            move(circle(index + 1), width, 0);
        }

        if (!browser.transitions) element.style.left = (index * -width) + 'px';

        container.style.visibility = 'visible';

    }

    function prev() {

        if (options.continuous) slide(index - 1);
        else if (index) slide(index - 1);

    }

    function next() {

        if (options.continuous) slide(index + 1);
        else if (index < slides.length - 1) slide(index + 1);

    }

    function circle(index) {

        // a simple positive modulo using slides.length
        return (slides.length + (index % slides.length)) % slides.length;

    }

    function slide(to, slideSpeed) {
        locked = applicationViewModel.navigationManager.allExercises()[to] && applicationViewModel.navigationManager.allExercises()[to].isLocked();

        // do nothing if already on requested slide
        if (index == to) {
            translate(circle(to - 1), slidePos[circle(to - 1)], speed*0.5);
            translate(to, slidePos[to], speed * 0.5);
            translate(circle(to + 1), slidePos[circle(to + 1)], speed * 0.5);
    
             return;
        }
        else if ((to > index) && locked) {
       
            translate(index, slidePos[index] - width * 0.3, speed * 0.5);
            translate(to, slidePos[to] - width * 0.3, speed * 0.5);

            setTimeout(function () { slide(index, speed * 0.5) }, speed*1.2);

            return;
        }

        if (browser.transitions) {

            var direction = Math.abs(index - to) / (index - to); // 1: backward, -1: forward

            // get the actual position of the slide
            if (options.continuous) {
                var natural_direction = direction;
                direction = -slidePos[circle(to)] / width;

                // if going forward but to < index, use to = slides.length + to
                // if going backward but to > index, use to = -slides.length + to
                if (direction !== natural_direction) to = -direction * slides.length + to;

            }

            var diff = Math.abs(index - to) - 1;

            // move all the slides between index and to in the right direction
            while (diff--) move(circle((to > index ? to : index) - diff - 1), width * direction, 0);

            to = circle(to);

            move(index, width * direction, slideSpeed || speed);
            move(to, 0, slideSpeed || speed);

            if (options.continuous) move(circle(to - direction), -(width * direction), 0); // we need to get the next in place

        } else {

            to = circle(to);
            animate(index * -width, to * -width, slideSpeed || speed);
            //no fallback for a circular continuous if the browser does not accept transitions
        }

        index = to;
        options.callback && options.callback(index, slides[index]);
    }

    function move(index, dist, speed) {

        translate(index, dist, speed);
        slidePos[index] = dist;

    }

    function translate(index, dist, speed) {
        // Get the slide by index
        var slide = slides[index];

        // Get the style that is assigned to the slide.  If no slide was found
        // this will return false.
        var style = slide && slide.style;

        // If there was no style found, return (do nothing)
        if (!style) return;

        // In Javascript, you can assign multiple variables at once.  For example,
        // "var a = b = c = 10;".  That would assign all 3 variables to 10.  In the
        // code below, it assigns a transition for each custom browser (since each
        // browser has a custom attribute that it uses).  msTransitionDuration is
        // for Microsoft (IE), webkit for Chrome, Moz for Firefox, etc.  It assigns
        // each of them to be "<speed>ms", speed being a variable passed into the
        // function.  It looks strange because each variable is on it's own line,
        // but you can imagine it like the example I provided above.
        style.webkitTransitionDuration =
        style.MozTransitionDuration =
        style.msTransitionDuration =
        style.OTransitionDuration =
        style.transitionDuration = speed + 'ms';

        // Now, assign the transform methods.  Chrome uses a different format, so
        // it gets it's own string.  ms, Moz, and O are the same, so they are
        // assigned in a similar style to the block above.
        style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
        style.msTransform =
        style.MozTransform =
        style.OTransform = 'translateX(' + dist + 'px)' + 'translateZ(0)';
    }

    function animate(from, to, speed) {

        // if not an animation, just reposition
        if (!speed) {

            element.style.left = to + 'px';
            return;

        }

        var start = +new Date;

        var timer = setInterval(function () {

            var timeElap = +new Date - start;

            if (timeElap > speed) {

                element.style.left = to + 'px';

                if (delay) begin();

                options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

                clearInterval(timer);
                return;

            }

            element.style.left = (((to - from) * (Math.floor((timeElap / speed) * 100) / 100)) + from) + 'px';

        }, 4);

    }

    // setup auto slideshow
    var delay = options.auto || 0;
    var interval;

    function begin() {

        interval = setTimeout(next, delay);

    }

    function stop() {

        delay = 0;
        clearTimeout(interval);

    }


    // setup initial vars
    var start = {};
    var delta = {};
    var isScrolling;
  

    // [Mohive Assessment] Specify if the next Exercise is locked. Is updated onStart , used onMoved and onEnd.
    var locked;

    // [Mohive Assessment] Specify if the move must be stopped
    var stopMoving;

    // setup event capturing
    var events = {

        handleEvent: function (event) {

            // If element or the target has noSwipe class, we dont catch swipe events
            if ($(event.target).hasClass('noSwipe') || $(element).hasClass('noSwipe')) {
                return;
            }
            switch (event.type) {
                case pointerDownName: this.start(event); break;
                case pointerMoveName: this.move(event); break;
                case pointerUpName: offloadFn(this.end(event)); break;

                case 'webkitTransitionEnd':
                case 'msTransitionEnd':
                case 'oTransitionEnd':
                case 'otransitionend':
                case 'transitionend': offloadFn(this.transitionEnd(event)); break;
                case 'resize': offloadFn(setup.call()); break;
            }

            if (options.stopPropagation) event.stopPropagation();

        },
        start: function (event) {

            var touches;

            if (event.touches == undefined) {
                touches = event;
            }
            else{
                touches = event.touches[0];
            }

            // measure start values
            start = {

                // get initial touch coords
                x: touches.pageX,
                y: touches.pageY,

                // store time to determine touch duration
                time: +new Date

            };

            // used for testing first move event

            isScrolling = undefined;

            // reset delta and end measurements
            delta = {};

            // attach touchmove and touchend listeners

            element.addEventListener(pointerMoveName, this, false);
            element.addEventListener(pointerUpName, this, false);

            // call start callback
            options.startCallback && options.startCallback();

            // prepare the moveCallbackOnce here
            // move() will unset currentMoveCallbackOnce but not moveCallbackOnce
            // so we keep the setting
            options.currentMoveCallbackOnce = options.moveCallbackOnce;

            locked = applicationViewModel.exercises()[index + 1] && applicationViewModel.exercises()[index + 1].isLocked();
            stopMoving = false;
        },
        move: function (event) {

            // this callback is being called on every move
            options.moveAlwaysCallback && options.moveAlwaysCallback (index, slides[index]);

            if (event.touches == undefined) {
                // ensure swiping with one touch and not pinching
                if (event.length > 1 || event.scale && event.scale !== 1) return;
            }
            else {
                // ensure swiping with one touch and not pinching
                if (event.touches.length > 1 || event.scale && event.scale !== 1) return;
            }
           
            if (options.disableScroll) event.preventDefault();

            var touches;

            if (event.touches == undefined) {
                touches = event;
            }
            else {
                touches = event.touches[0];
            }

            // measure change in x and y
            delta = {
                x: touches.pageX - start.x,
                y: touches.pageY - start.y
            }

            // determine if scrolling test has run - one time test
            if (typeof isScrolling == 'undefined') {
                isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y));
            }
            
            // if user is not trying to scroll vertically
            if (!isScrolling) {

                // call moveOnce callback
                // this callback is called only once per start-move-end cycles
                if (options.currentMoveCallbackOnce) {
                    var cb = options.currentMoveCallbackOnce;
                    options.currentMoveCallbackOnce = null;
                    cb(index, slides[index]);
                }

                // call move callback 
                options.moveCallback && options.moveCallback(index, slides[index]);

                // prevent native scrolling 
                event.preventDefault();

                // stop slideshow
                stop();

                // increase resistance if first or last slide

                if (!stopMoving) {
                    if (options.continuous) { // we don't add resistance at the end

                        translate(circle(index - 1), delta.x + slidePos[circle(index - 1)], 0);
                        translate(index, delta.x + slidePos[index], 0);
                        translate(circle(index + 1), delta.x + slidePos[circle(index + 1)], 0);

                    } else {

                        delta.x =
                            delta.x /

                            ((!index && delta.x > 0 // if first slide and sliding left
                                        || index == slides.length - 1 // or if last slide and sliding right
                                        && delta.x < 0 // and if sliding at all
                                ) ?
                                (Math.abs(delta.x) / width + 1) // determine resistance level
                                : 1); // no resistance if false

                        // translate 1:1
                        translate(index - 1, delta.x + slidePos[index - 1], 0);
                        translate(index, delta.x + slidePos[index], 0);
                        translate(index + 1, delta.x + slidePos[index + 1], 0);
                    }

                    // determine direction of swipe (true:right, false:left)
                    var direction = delta.x < 0;

                    // Stop moving if the next exercise is locked (Assessment) and reaches 30% of the slide width.
                    if (locked && direction && (delta.x + slidePos[index] < -(width*0.30))) {
                        stopMoving = true;
                    }
                }
            } 
        },
        end: function (event) {

            // measure duration
            var duration = +new Date - start.time;

            // determine if slide attempt triggers next/prev slide
            var isValidSlide =
                  Number(duration) < 250               // if slide duration is less than 250ms
                  && Math.abs(delta.x) > 20            // and if slide amt is greater than 20px
                  || Math.abs(delta.x) > width / 2;      // or if slide amt is greater than half the width

            // determine if slide attempt is past start and end
            var isPastBounds =
                  !index && delta.x > 0                            // if first slide and slide amt is greater than 0
                  || index == slides.length - 1 && delta.x < 0;    // or if last slide and slide amt is less than 0

            if (options.continuous) isPastBounds = false;

            // determine direction of swipe (true:right, false:left)
            var direction = delta.x < 0;

            // if not scrolling vertically
            if (!isScrolling) {
                var lockNavigation = direction && locked;
              
                if (isValidSlide && !isPastBounds && !lockNavigation) {

                    if (direction) {

                        if (options.continuous) { // we need to get the next in this direction in place

                            move(circle(index - 1), -width, 0);
                            move(circle(index + 2), width, 0);

                        } else {
                            move(index - 1, -width, 0);
                        }

                        move(index, slidePos[index] - width, speed);
                        move(circle(index + 1), slidePos[circle(index + 1)] - width, speed);
                        index = circle(index + 1);

                    } else {
                        if (options.continuous) { // we need to get the next in this direction in place

                            move(circle(index + 1), width, 0);
                            move(circle(index - 2), -width, 0);

                        } else {
                            move(index + 1, width, 0);
                        }

                        move(index, slidePos[index] + width, speed);
                        move(circle(index - 1), slidePos[circle(index - 1)] + width, speed);
                        index = circle(index - 1);

                    }

                    options.callback && options.callback(index, slides[index]);

                } else {

                    if (options.continuous) {

                        move(circle(index - 1), -width, speed);
                        move(index, 0, speed);
                        move(circle(index + 1), width, speed);

                    } else {

                        move(index - 1, -width, speed);
                        move(index, 0, speed);
                        move(index + 1, width, speed);
                    }

                }

            }

            // kill touchmove and touchend event listeners until touchstart called again
            element.removeEventListener(pointerMoveName, events, false);
            element.removeEventListener(pointerUpName, events, false);
        },
        transitionEnd: function (event) {

            if (parseInt(event.target.getAttribute('data-index'), 10) == index) {

                if (delay) begin();

                options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

            }

        }

    }

    function unbindEvents() {
        // removed event listeners
        if (browser.addEventListener) {

            // remove current event listeners
            element.removeEventListener(pointerDownName, events, false);
            element.removeEventListener('webkitTransitionEnd', events, false);
            element.removeEventListener('msTransitionEnd', events, false);
            element.removeEventListener('oTransitionEnd', events, false);
            element.removeEventListener('otransitionend', events, false);
            element.removeEventListener('transitionend', events, false);
            window.removeEventListener('resize', events, false);

        }
        else {

            window.onresize = null;

        }
    }

    function bindEvents() {
        // add event listeners
        if (browser.addEventListener) {
          
            // set touchstart event on element   
            if (browser.touch && applicationViewModel.platformFeatures.getAllowManualSwipe()) {
                element.addEventListener(pointerDownName, events, true);
            }

            if (browser.transitions) {
                element.addEventListener('webkitTransitionEnd', events, false);
                element.addEventListener('msTransitionEnd', events, false);
                element.addEventListener('oTransitionEnd', events, false);
                element.addEventListener('otransitionend', events, false);
                element.addEventListener('transitionend', events, false);
            }

            // set resize event on window
            window.addEventListener('resize', events, false);

        } else {

            window.onresize = function () { setup() }; // to play nice with old IE

        }
    }

    // trigger setup
    setup();

    // start auto slideshow if applicable
    if (delay) begin();

    bindEvents();

    

    // expose the Swipe API
    return {
        bindEvents: function () {
            // unbind before bind avoids double-binding
            unbindEvents();
            bindEvents();
        },
        unbindEvents: function(){
            unbindEvents();
        },
        setup: function () {
            requestAnimationFrame(function () {
                setup();
            });
        },
        slide: function (to, speed) {
            requestAnimationFrame(function () {
                // cancel slideshow
                stop();

                slide(to, speed);
            });
        },
        prev: function () {
            requestAnimationFrame(function () {
                // cancel slideshow
                stop();

                prev();
            });
        },
        next: function () {
            requestAnimationFrame(function () {
                // cancel slideshow
                stop();

                next();
            });
        },
        getPos: function () {

            // return current index position
            return index;

        },
        getNumSlides: function () {

            // return total number of slides
            return length;
        },
        kill: function () {

            // cancel slideshow
            stop();

            // reset element
            element.style.width = 'auto';
            element.style.left = 0;

            // reset slides
            var pos = slides.length;
            while (pos--) {

                var slide = slides[pos];
                slide.style.width = '100%';
                slide.style.left = 0;

                if (browser.transitions) translate(pos, 0, 0);

            }

            unbindEvents();

        }
    }

}


if (window.jQuery || window.Zepto) {
    (function ($) {
        $.fn.Swipe = function (params) {
            return this.each(function () {
                $(this).data('Swipe', new Swipe($(this)[0], params));
            });
        }
    })(window.jQuery || window.Zepto)
}