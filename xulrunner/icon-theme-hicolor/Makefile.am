theme = hicolor
themedir = $(datadir)/icons/$(theme)
theme_icons = \
	apps,moonshine-16.png \
	apps,moonshine-22.png \
	apps,moonshine-24.png \
	apps,moonshine-32.png \
	apps,moonshine-48.png \
	apps,moonshine-128.png

install_icon_exec = $(SHELL) $(srcdir)/icon-theme-installer \
	-t "$(theme)" \
	-s "$(srcdir)" \
	-d "x$(DESTDIR)" \
	-b "$(themedir)" \
	-m "$(mkinstalldirs)" \
	-x "$(INSTALL_DATA)"

install-data-local:
	@-$(install_icon_exec) -i $(theme_icons)

uninstall-hook: 
	@-$(install_icon_exec) -u $(theme_icons)

EXTRA_DIST = $(wildcard *.png *.svg) icon-theme-installer
MAINTAINERCLEANFILES = Makefile.in

