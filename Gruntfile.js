module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			kanade: {
				options: {
					sourceMap: 'kanade.min.js.map'
				},
				files: {
					'kanade.min.js': [
						'assets/microajax.js',
						'assets/kizzy.js',
						'assets/iscroll.js',
						'assets/tappable.js',
						'assets/tenshi.js'
					]
				}
			}
		},
		connect: {
			server: {
				options: {
					keepalive: true,
					hostname: null
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-connect');

};