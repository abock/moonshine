SUBDIRS = icon-theme-hicolor

BUILD_ID = `date +%Y%m%d%H%M%S`

IN_FILES = \
	application.ini.in \
	moonshine.desktop.in \
	moonshine.in

OUT_FILES = $(IN_FILES:.in=)
VERSION_DTD_OUT = $(builddir)/chrome/locale/en-US/version.dtd

launcherdir = $(bindir)
launcher_SCRIPTS = moonshine

PLAYER_TARGETS = $(foreach res, \
	$(wildcard $(top_srcdir)/player/*.js), \
		$(addprefix chrome/content/player/,$(notdir $(res))))

MTK_TARGETS = $(foreach res, \
	$(wildcard $(top_srcdir)/player/mtk/*.js), \
		$(addprefix chrome/content/player/mtk/,$(notdir $(res))))

all: $(PLAYER_TARGETS) $(MTK_TARGETS) $(OUT_FILES) $(VERSION_DTD_OUT)

moonshine: moonshine.in
	sed -e " \
		s|\@BROWSER_PLUGIN_DIR\@|$(BROWSER_PLUGIN_DIR_EXPANDED)|g; \
		s|\@pkgdatadir\@|$(pkgdatadir)|g;" < $< > $@

application.ini: application.ini.in
	sed -e " \
		s/\@VERSION\@/$(VERSION)/g; \
		s/\@BUILD_ID\@/$(BUILD_ID)/g; \
		s/\@MAX_GECKO_VERSION\@/$(MAX_GECKO_VERSION)/g; \
		s/\@MIN_GECKO_VERSION\@/$(MIN_GECKO_VERSION)/g; \
	" < $< > $@

moonshine.desktop: moonshine.desktop.in
	(cat $< && echo "MimeType=`awk -F'{' '{ \
		if ($$0 ~ /mmp_plugin_proxy_mime_types.*=.*{/) \
			start = 1; \
		else if ($$0 ~ /\}\;/) \
			start = 0; \
		else if (start == 1) { \
			sub (/\"\,.*/, "", $$2); \
			sub (/[\t ]*\"/, "", $$2); \
			if ($$2 ~ /[a-z]+\/[a-z0-9\-]/) \
				printf $$2 ";"; \
		} \
	}' < $(top_srcdir)/plugin/mmp-plugin-proxy.c`") > $@

$(VERSION_DTD_OUT): version.dtd.in
	sed -e "s|\@VERSION\@|$(VERSION)|g" < $< > $@

chrome/content/player/%: $(top_srcdir)/player/%
	mkdir -p $(dir $@)
	cp -a $< $@

XULAPP_FILES = `find $(srcdir)/chrome $(srcdir)/defaults application.ini -type f | grep -v debug.js`

install-data-local:
	for file in $(XULAPP_FILES); do \
		$(mkinstalldirs) $(DESTDIR)$(pkgdatadir)/`dirname "$$file"`; \
		$(INSTALL_DATA) -c -m 644 "$$file" $(DESTDIR)$(pkgdatadir)/$$file; \
	done;
	$(mkinstalldirs) $(DESTDIR)$(datadir)/applications
	$(INSTALL_DATA) -c -m 644 moonshine.desktop $(DESTDIR)$(datadir)/applications/moonshine.desktop

#	[ -z "$(DESTDIR)" -a -x `which update-desktop-database` ] && \
#		update-desktop-database $(datadir)/applications;

uninstall-hook:
	for file in $(XULAPP_FILES); do \
		rm $(DESTDIR)$(pkgdatadir)/$$file; \
	done
	rm $(DESTDIR)$(datadir)/applications/moonshine.desktop

clean-local:
	rm -rf chrome/content/player

run: all
	xulrunner application.ini

debug: all
	xulrunner application.ini -jsconsole

EXTRA_DIST = $(IN_FILES) \
	chrome \
	defaults \
	version.dtd.in

CLEANFILES = $(OUT_FILES) $(VERSION_DTD_OUT)
MAINTAINERCLEANFILES = Makefile.in

