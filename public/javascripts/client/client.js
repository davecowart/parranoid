$(function() {
	$('#rooms').tabs();

	var viewModel = new ClientViewModel();
	ko.applyBindings(viewModel);

	viewModel.addServer({ connection: 'irc.freenode.net' });
	viewModel.servers()[0].joinRoom('#ix2-test');
	viewModel.servers()[0].joinRoom('#ix2-bot');
	console.log(viewModel);
});