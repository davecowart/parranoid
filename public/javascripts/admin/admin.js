$(function() {
	$('a.kill').click(function(e) {
		e.preventDefault();
		$.post($(this).attr('href'), function(data) {
			console.log(data);
			if (data.success) {
				window.location.href = '/admin';
			}
		});
	});
});