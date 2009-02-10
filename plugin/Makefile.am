RESOURCE_OUT_FILE = mmp-resources.h
RESOURCE_VAR_PREFIX = MLMP_RESOURCE_
RESOURCE_ALL_VAR_NAME = MLMP_RESOURCES_ALL
RESOURCES = \
	$(wildcard $(top_srcdir)/player/*.js) \
	$(wildcard $(top_srcdir)/player/mtk/*.js)

RESOURCES_BUILD = $(foreach res, $(RESOURCES), \
	`echo $(RESOURCE_VAR_PREFIX)$(notdir $(res)) \
		| tr '[:lower:]' '[:upper:]' \
		| sed -r 's|[-.]|_|g;s|[^A-Z0-9_]||g'` \
	$(res))

$(RESOURCE_OUT_FILE): $(srcdir)/generate-resource $(RESOURCES)
	$(SHELL) $< $@ $(RESOURCE_ALL_VAR_NAME) $(RESOURCES_BUILD)

mpplugindir=$(BROWSER_PLUGIN_DIR)
mpplugin_LTLIBRARIES = libmoonshine-plugin.la

INCLUDES = \
	$(MOZILLA_CFLAGS) \
	$(GLIB_CFLAGS) \
	-D_FORTIFY_SOURCE=2 \
	-Wall \
	-ggdb3

libmoonshine_plugin_la_SOURCES = \
	$(srcdir)/mmp-plugin-proxy.c \
	$(srcdir)/mmp-plugin.c \
	$(srcdir)/mmp-binder.c \
	$(srcdir)/mmp-script.c

libmoonshine_plugin_la_LDFLAGS = \
	-avoid-version \
	-module

libmoonshine_plugin_la_LIBADD = $(GLIB_LIBS)

$(libmoonshine_plugin_la_SOURCES): $(RESOURCE_OUT_FILE)

FIREFOX = firefox -P dev -no-remote

test-plugin: all 
	mkdir -p ~/.mozilla/plugins
	rm -f ~/.mozilla/plugins/libmoonshine-plugin.so
	cp .libs/libmoonshine-plugin.so ~/.mozilla/plugins

run: hbo

wmp: test-plugin
	$(FIREFOX) http://banshee-project.org/~abock/WMV/wmv-wmp.html

hbo: test-plugin
	$(FIREFOX) http://www.hbo.com/scripts/video/vidplayer.html?movie=/av/biglove/season3/b_love_min3pmdnt_1+section=biglove+num=1227749959016+title=Big%20Love:%20Three%20Past%20Midnight:%20Bill%20And%20Barb+tunein=Sundays%20at%209pm

cspan: test-plugin
	$(FIREFOX) http://www.c-span.org/Watch/C-SPAN_wm.aspx

gdb: test-plugin
	gdb $(libdir)/firefox/firefox -ex "run -P dev -no-remote $(TEST_URI)"

EXTRA_DIST = \
	$(libmoonshine_plugin_la_SOURCES) \
	generate-resource \
    mmp-binder.h \
	mmp-plugin.h \
	mmp-script.h

CLEANFILES = $(RESOURCE_OUT_FILE)
MAINTAINERCLEANFILES = Makefile.in

