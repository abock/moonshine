SUBDIRS = icon-theme-hicolor

BUILD_ID = `date +%Y%m%d%H%M%S`

IN_FILES = \
	application.ini.in \
	moonshine.desktop.in \
	moonshine.in

OUT_FILES = $(IN_FILES:.in=)

desktopdir = $(datadir)/applications
desktop_DATA = moonshine.desktop

launcherdir = $(bindir)
launcher_SCRIPTS = moonshine

appdir = $(pkgdatadir)
app_DATA = application.ini
app_chromedir = $(pkgdatadir)/chrome
app_chrome_DATA = chrome/chrome.manifest
app_chrome_contentdir = $(pkgdatadir)/chrome/content
app_chrome_content_DATA = $(wildcard chrome/content/*)
app_chrome_content_playerdir = $(pkgdatadir)/chrome/content/player
app_chrome_content_player_DATA = $(wildcard chrome/content/player/*)
app_defaults_preferencesdir = $(pkgdatadir)/defaults/preferences
app_defaults_preferences_DATA = defaults/preferences/prefs.js

PLAYER_TARGETS = $(foreach res, \
	$(wildcard $(top_srcdir)/player/*.js) \
	$(wildcard $(top_srcdir)/player/*.xaml), \
		$(addprefix chrome/content/player/,$(notdir $(res))))
	
all: $(PLAYER_TARGETS) $(OUT_FILES)

moonshine: moonshine.in
	sed -e "s|\@pkgdatadir\@|$(pkgdatadir)|g;" < $< > $@

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

chrome/content/player/%: $(top_srcdir)/player/%
	mkdir -p $(dir $@)
	cp -a $< $@

clean-local:
	rm -rf chrome/content/player

run: all
	xulrunner application.ini

EXTRA_DIST = $(IN_FILES) \
	chrome \
	defaults

CLEANFILES = $(OUT_FILES)
MAINTAINERCLEANFILES = Makefile.in

