XPI_BUILD_ROOT = .xpinstall
PLUGIN_FILE = $(top_builddir)/plugin/.libs/libmoonshine-plugin.so
CHROME_MAINIFEST = "skin moonshine default skin/"

if ENABLE_XPI_BUILD

all: moonshine.xpi

moonshine.xpi: $(PLUGIN_FILE) install.rdf Makefile
	-rm -f $@
	-rm -rf $(XPI_BUILD_ROOT)
	mkdir -p $(XPI_BUILD_ROOT)/plugins/moonshine
	mkdir -p $(XPI_BUILD_ROOT)/skin
	cp -aL $(srcdir)/install.rdf $(XPI_BUILD_ROOT)
	cp -aL $(top_srcdir)/xulrunner/icon-theme-hicolor/moonshine-32.png $(XPI_BUILD_ROOT)/skin/icon.png
	cp -aL $(PLUGIN_FILE) $(XPI_BUILD_ROOT)
	echo $(CHROME_MANIFEST) > $(XPI_BUILD_ROOT)/chrome.manifest
	find $(XPI_BUILD_ROOT) -name \*.so -exec strip '{}' ';'
	cd $(XPI_BUILD_ROOT) && zip -r9 ../$@ *

endif

clean-local:
	-rm -rf $(XPI_BUILD_ROOT)

EXTRA_DIST = install.rdf.in
CLEANFILES = moonshine.xpi
MAINTAINERCLEANFILES = Makefile.in

