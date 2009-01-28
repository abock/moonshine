INCLUDES = \
	$(MOZILLA_CFLAGS) \
	$(GLIB_CFLAGS) \
	-Wall \
	-ggdb3

mpplugindir=$(libdir)/browser-plugins
mpplugin_LTLIBRARIES = libmoonmp-plugin.la

libmoonmp_plugin_la_LDFLAGS = \
	-avoid-version \
	-export-symbols $(srcdir)/export-symbols \
	-module

libmoonmp_plugin_la_LIBADD = $(GLIB_LIBS)

libmoonmp_plugin_la_SOURCES = \
	plugin-proxy.cpp

test-plugin: all 
	mkdir -p ~/.mozilla/plugins
	rm -f ~/.mozilla/plugins/libmoonmp-plugin.so
	cp .libs/libmoonmp-plugin.so ~/.mozilla/plugins

run: test-plugin
	firefox -P dev -no-remote ../test/test.html

MAINTAINERCLEANFILES = Makefile.in
