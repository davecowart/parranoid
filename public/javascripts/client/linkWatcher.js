(function ($) {
    function linkIt(element) {
        var $scrollArea = $(element);
        $scrollArea.find('.text:not(.linked)').linkify({target: '_blank',includeW3: false}).addClass('linked');
    }

    $.fn.watchForLinks = function () {
        return this.each(function () {
            var element = this;
            setInterval(function() { linkIt(element); }, 100);
            linkIt(element);
        });
    };
})(jQuery);