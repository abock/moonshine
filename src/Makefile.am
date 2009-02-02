RESOURCE_OUT_FILE = mmp-resources.h
RESOURCE_VAR_PREFIX = MLMP_RESOURCE_
RESOURCES = \
	player/player.xaml \
	player/player.js \
	player/wmp-controls.js

RESOURCES_BUILD = $(foreach res, $(RESOURCES), \
	`echo $(RESOURCE_VAR_PREFIX)$(notdir $(res)) \
		| tr '[:lower:]' '[:upper:]' \
		| sed -r 's|[-.]|_|g;s|[^A-Z0-9_]||g'` \
	$(srcdir)/$(res))

$(RESOURCE_OUT_FILE): $(srcdir)/generate-resource $(RESOURCES)
	$(SHELL) $< $@ $(RESOURCES_BUILD)

mpplugindir=$(BROWSER_PLUGIN_DIR)
mpplugin_LTLIBRARIES = libmoonmp-plugin.la

INCLUDES = \
	$(MOZILLA_CFLAGS) \
	$(GLIB_CFLAGS) \
	-D_FORTIFY_SOURCE=2 \
	-Wall \
	-ggdb3

libmoonmp_plugin_la_SOURCES = \
	$(srcdir)/mmp-plugin-proxy.c \
	$(srcdir)/mmp-plugin.c \
	$(srcdir)/mmp-binder.c \
	$(srcdir)/mmp-script.c

libmoonmp_plugin_la_LDFLAGS = \
	-avoid-version \
	-module

libmoonmp_plugin_la_LIBADD = $(GLIB_LIBS)

$(libmoonmp_plugin_la_SOURCES): $(RESOURCE_OUT_FILE)

TEST_URI = http://www.c-span.org/Watch/C-SPAN_wm.aspx

test-plugin: all 
	mkdir -p ~/.mozilla/plugins
	rm -f ~/.mozilla/plugins/libmoonmp-plugin.so
	cp .libs/libmoonmp-plugin.so ~/.mozilla/plugins

run: test-plugin
	firefox -P dev -no-remote $(TEST_URI)

gdb: test-plugin
	gdb $(libdir)/firefox/firefox -ex "run -P dev -no-remote $(TEST_URI)"

EXTRA_DIST = \
	$(libmoonmp_plugin_la_SOURCES) \
    $(RESOURCES) \
	generate-resource \
    mmp-binder.h \
	mmp-plugin.h \
	mmp-script.h

CLEANFILES = $(RESOURCE_OUT_FILE)
MAINTAINERCLEANFILES = Makefile.in

