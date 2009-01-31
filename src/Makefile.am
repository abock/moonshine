INCLUDES = \
	$(MOZILLA_CFLAGS) \
	$(GLIB_CFLAGS) \
	-D_FORTIFY_SOURCE=2 \
	-Wall \
	-ggdb3

RESOURCE_OUT_FILE = $(builddir)/mmp-resources.h
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

$(RESOURCE_OUT_FILE): $(srcdir)/generate-resource $(RESOURCES)
	$(SHELL) $< $@ $(RESOURCES_BUILD)

mpplugindir=$(libdir)/browser-plugins
mpplugin_LTLIBRARIES = libmoonmp-plugin.la

libmoonmp_plugin_la_SOURCES = \
	mmp-plugin-proxy.cpp \
	mmp-plugin.c \
	mmp-binder.c \
	mmp-script.c

libmoonmp_plugin_la_LDFLAGS = \
	-avoid-version \
	-module \
	-export-symbols $(srcdir)/export-symbols

libmoonmp_plugin_la_LIBADD = \
	$(GLIB_LIBS) \
	$(MOZILLA_LIBS)

noinst_HEADERS = \
	mmp-binder.h \
	mmp-plugin.h \
	mmp-script.h

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

EXTRA_DIST = 
	$(libmoonmp_plugin_la_SOURCES) \
	$(noinst_HEADERS) \
	$(RESOURCES) \
	generate-resource \
	export-symbols

CLEANFILES = $(RESOURCE_OUT_FILE)
MAINTAINERCLEANFILES = Makefile.in

