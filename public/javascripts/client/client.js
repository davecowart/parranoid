var clientViewModel;
$(function() {
	var socket = io.connect('http://localhost');
	clientViewModel = new ClientViewModel(socket);
	ko.applyBindings(clientViewModel);
	$('#rooms').tabs();
});