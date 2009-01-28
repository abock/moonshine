GENERATED = embedded-media-resources.h
VAR_PREFIX = _EMBEDDED_
RESOURCES = \
	media-player.xaml \
	media-player.js \
	silver-resolver.js

CODIFY = ./codify.sh

RESOURCES_BUILD = $(foreach res, $(RESOURCES), \
	`echo $(VAR_PREFIX)$(notdir $(res)) \
		| tr '[:lower:]' '[:upper:]' \
		| sed -r 's|[-.]|_|g;s|[^A-Z0-9_]||g'` \
	$(res))

all: $(GENERATED)

$(GENERATED): $(CODIFY) $(RESOURCES)
	$(CODIFY) $@ $(RESOURCES_BUILD)

CLEANFILES = $(GENERATED)
EXTRA_DIST = $(CODIFY) $(RESOURCES)

