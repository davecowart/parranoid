$(function() {
	$('#rooms').tabs();
	var socket = io.connect('http://localhost');
	ko.applyBindings(new ClientViewModel(socket));
});