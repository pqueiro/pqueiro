/// <reference path="jquery.d.ts"/>
/// <reference path="..\logger.ts"/>
(function () {
    // Detect the 'transitionend' event (may be prefixed)
    var transitionEndEvent = (function () {
        var t;
        var el = document.createElement('fakeelement');
        var transitions = {
            'transition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'MozTransition': 'transitionend',
            'WebkitTransition': 'webkitTransitionEnd'
        };
        for (t in transitions) {
            if (el.style[t] !== undefined) {
                return transitions[t];
            }
        }
    }());
    $.fn.cssPromise = function () {
        var def = $.Deferred();
        this.first().one(transitionEndEvent, function () {
            logger.log("received transition end for ", this);
            def.resolve();
        });
        return def.promise();
    };
}());
