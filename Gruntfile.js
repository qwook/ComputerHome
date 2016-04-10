module.exports = function(grunt) {

	grunt.initConfig({
    'pkg': grunt.file.readJSON('package.json'),
    'babel': {
      'options': {
        'sourceMap': true,
        'plugins': ['transform-es2015-modules-amd', 'transform-es2015-classes', 'transform-es2015-arrow-functions', 'transform-es2015-block-scoped-functions', 'transform-es2015-block-scoping']
      },
      'dist': {
        'files': [{
          'expand': true,
          'src': ['client/**/*.js', 'lib/**/*.js', 'client.js'],
          'dest': 'build/',
          'ext': '.js'
        }]
      }
    },
    'connect': {
      'dev': {
        'options': {
          'hostname': '*',
          'base': ['public/', 'build/', 'bower_components/'],
          'port': '8080',
        }
      }
    },
    'execute': {
      'dev': {
        'src': ['server/index.js']
      }
    },
    'express': {
      'options': {
      },
      'dev': {
        'options': {
          'script': 'server/index.js'
        }
      },
    },
    'watch': {
      'options': {
        'atBegin': true,
      },
      'dev': {
        'files': ['lib/*', 'client/**/*.js', 'server/*', 'public/*', 'bower_components/*'],
        'tasks': ['express:dev', 'babel'],
        'options': {
          'livereload': 35729,
          'spawn': false
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['watch:dev']);

}
