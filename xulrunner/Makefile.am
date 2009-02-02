BUILD_ID = `date +%Y%m%d%H%M%S`

IN_FILES = \
	application.ini.in \
	moonlight-media-player.desktop.in

OUT_FILES = $(foreach infile, $(IN_FILES), \
	$(patsubst %.in, %, $(infile)))

all: $(OUT_FILES)

application.ini: application.ini.in
	sed -e " \
		s/\@VERSION\@/$(VERSION)/g; \
		s/\@BUILD_ID\@/$(BUILD_ID)/g; \
		s/\@MAX_GECKO_VERSION\@/$(MAX_GECKO_VERSION)/g; \
		s/\@MIN_GECKO_VERSION\@/$(MIN_GECKO_VERSION)/g; \
	" < $< > $@

moonlight-media-player.desktop: moonlight-media-player.desktop.in
	cp $< $@
	echo "MimeType=`awk -F'{' '{ \
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
	}' < $(top_srcdir)/plugin/mmp-plugin-proxy.c`" >> $@

run: application.ini
	xulrunner $<

EXTRA_DIST = $(IN_FILES) \
	chrome/

CLEANFILES = $(OUT_FILES)
MAINTAINERCLEANFILES = Makefile.in

