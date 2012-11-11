ROOT := $(dir $(lastword $(MAKEFILE_LIST)))
Version := $(git rev-parse --verify HEAD)

REPORT_FILE=coverage.html
TESTS?=\.*

all: | test-all coverage

test-all:
	@echo 'Testing...'
	@mocha --compilers coffee:coffee-script -R list -g '$(TESTS)'

compile-coffee:
	@rm -rf lib-js
	@echo 'CoffeeScript -> JavaScript compiling...'
	@coffee -o lib-js -c lib

clean-compile:
	@rm -rf lib-js

jscoverage:
	@jscoverage lib-js lib-cov

mocha-html-cov:
	@echo 'Testing and generating coverage report...'
	@APP_COV=1 mocha --compilers coffee:coffee-script -R html-cov > $(REPORT_FILE)

clean-coverage:
	@rm -rf lib-js
	@rm -rf lib-cov

clean-report:
	@rm -rf $(REPORT_FILE)

compile: | compile-coffee

coverage: | compile-coffee jscoverage mocha-html-cov clean-coverage

clean: | clean-compile clean-coverage clean-report

.PHONY: all test-all compile-coffee clean-compile jscoverage mocha-html-cov clean-coverage clean-report compile coverage clean

