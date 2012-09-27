module.exports = function(assets) {
	assets.root = __dirname;
	assets.addJs('/public/javascripts/*.js');
	assets.addCss('/public/stylesheets/base/**.styl');

	// client
	assets.addJs('/public/javascripts/client/**.js', 'client');
	assets.addCss('/public/stylesheets/client/**.styl', 'client');
};