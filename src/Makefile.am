INCLUDES = \
	$(MOZILLA_CFLAGS) \
	$(GLIB_CFLAGS) \
	-D_FORTIFY_SOURCE=2 \
	-Wall \
	-ggdb3

RESOURCE_OUT_FILE = mmp-resources.h
RESOURCE_VAR_PREFIX = MLMP_RESOURCE_
RESOURCES = \
	resources/player.xaml \
	resources/player.js \
	resources/wmp-controls.js

RESOURCES_BUILD = $(foreach res, $(RESOURCES), \
	`echo $(RESOURCE_VAR_PREFIX)$(notdir $(res)) \
		| tr '[:lower:]' '[:upper:]' \
		| sed -r 's|[-.]|_|g;s|[^A-Z0-9_]||g'` \
	$(res))

$(RESOURCE_OUT_FILE): generate-resource $(RESOURCES)
	$(SHELL) $< $@ $(RESOURCES_BUILD)

mpplugindir=$(libdir)/browser-plugins
mpplugin_LTLIBRARIES = libmoonmp-plugin.la

libmoonmp_plugin_la_SOURCES = \
	mmp-plugin-proxy.c \
	mmp-plugin.c \
	mmp-binder.c \
	mmp-script.c

libmoonmp_plugin_la_LDFLAGS = \
	-avoid-version \
	-export-symbols $(srcdir)/export-symbols \
	-module

libmoonmp_plugin_la_LIBADD = \
	$(GLIB_LIBS) \
	$(MOZILLA_LIBS)

$(libmoonmp_plugin_la_SOURCES): $(RESOURCE_OUT_FILE)

test-plugin: all 
	mkdir -p ~/.mozilla/plugins
	rm -f ~/.mozilla/plugins/libmoonmp-plugin.so
	cp .libs/libmoonmp-plugin.so ~/.mozilla/plugins

run: test-plugin
	firefox -P dev -no-remote ../test/test.html

gdb: test-plugin
	gdb $(libdir)/firefox/firefox -ex "run -P dev -no-remote ../test/test.html"

EXTRA_DIST = $(RESOURCES)
CLEANFILES = $(RESOURCE_OUT_FILE)
MAINTAINERCLEANFILES = Makefile.in

