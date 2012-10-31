ROOT := $(dir $(lastword $(MAKEFILE_LIST)))
Version := $(git rev-parse --verify HEAD)

MOCHA := ./node_modules/.bin/mocha

test:
	$(MOCHA) -r should

coverage:
	rm -rf lib-cov
	jscoverage lib lib-cov
	APP_COV=1 ./node_modules/mocha/bin/mocha -r should -R html-cov > report/coverage.html
	rm -rf lib-cov

build:
	echo "building app, version $(VERSION)"
	echo $(ROOT)
	rm -rf $(ROOT)/build
	rm -rf $(ROOT)/target
	mkdir -p $(ROOT)/build
	#cp -rp $(ROOT) $(ROOT)/build
	rm -rf build/public/*
	r.js -o public/javascripts/app.build.js
	mv $(ROOT)/target/javascripts build/javascripts
	mv $(ROOT)/target/images build/images
	mkdir -p build/javascripts/lib
	mv target/javascripts/lib/require.js build/javascripts/lib
	mv target/javascripts/lib/main.js build/javascripts
	rm -rf target


.PHONY: test