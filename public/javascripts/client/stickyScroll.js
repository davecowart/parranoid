(function ($) {
    function stickToBottom(element) {
        var $scrollArea = $(element);
        if (!$scrollArea.attr('unlocked'))
            $scrollArea.scrollTop(element.scrollHeight - $scrollArea.height());
    }

    function monitorLock(element) {
        $scrollArea = $(element);
        $scrollArea.scroll(function() {
            if ($scrollArea[0].scrollHeight === 0 || $scrollArea[0].scrollHeight - $scrollArea.height() === $scrollArea.scrollTop())
                $scrollArea.removeAttr('unlocked');
            else
                $scrollArea.attr('unlocked','true');
        });
    }

    $.fn.stick = function () {
        return this.each(function () {
            var element = this;
            setInterval(function() { stickToBottom(element); }, 100);
            monitorLock(element);
            stickToBottom(element);
        });
    };
})(jQuery);