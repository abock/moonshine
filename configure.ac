dnl automake/autoconf setup
AC_INIT([moonshine], [0.7])
AC_CONFIG_SRCDIR(README)
AC_CANONICAL_SYSTEM
AC_PREREQ(2.13)
AM_CONFIG_HEADER(config.h)
AM_INIT_AUTOMAKE([1.9 dist-bzip2 tar-ustar])
AM_MAINTAINER_MODE

DISTCHECK_CONFIGURE_FLAGS="--disable-xpi-build"
AC_SUBST(DISTCHECK_CONFIGURE_FLAGS)

dnl Build config/tools
AC_HEADER_STDC
AC_DISABLE_STATIC
AC_PROG_LIBTOOL
PKG_PROG_PKG_CONFIG

dnl Plugin build configuration
PKG_CHECK_MODULES(MOZILLA, libxul mozilla-plugin)
PKG_CHECK_MODULES(GLIB, glib-2.0 >= 2.14 gmodule-2.0 >= 2.14 uuid)
PKG_CHECK_MODULES(XULRUNNER_192, libxul >= 1.9.2,
	HAVE_XULRUNNER_192=yes, HAVE_XULRUNNER_192=no)
if test "$HAVE_XULRUNNER_192" = "yes"; then
	AC_DEFINE(HAVE_XULRUNNER_192, 1, [xulrunner 1.9.2+ detected])
fi
AC_SUBST(MOZILLA_CFLAGS)
AC_SUBST(CFLAGS)

dnl xulrunner-1.9.1 replaced npupp.h with npfunctions.h
CFLAGS_save="$CFLAGS"
CFLAGS="$CFLAGS $MOZILLA_CFLAGS"
AC_CHECK_HEADERS(npfunctions.h)
CFLAGS="$CFLAGS_SAVE"

dnl xulrunner and XPI configuration
MIN_FIREFOX_VERSION="3.0"
MAX_FIREFOX_VERSION="3.6.*"
MIN_GECKO_VERSION="1.9"
MAX_GECKO_VERSION="1.9.*"
AC_SUBST([MIN_FIREFOX_VERSION])
AC_SUBST([MAX_FIREFOX_VERSION])
AC_SUBST([MIN_GECKO_VERSION])
AC_SUBST([MAX_GECKO_VERSION])

case "$target_os" in
	*linux*) TARGET_PLATFORM="Linux" ;;
	*) AC_MSG_ERROR([Target os $target_os is not supported]) ;;
esac

case "$target_cpu" in
	i*86) 
		TARGET_PLATFORM="$TARGET_PLATFORM"_x86-gcc3
		INSTALL_ARCH=i586
		;;
	x86_64)
		TARGET_PLATFORM="$TARGET_PLATFORM"_x86_64-gcc3
		INSTALL_ARCH=x86_64
		;;
	*) AC_MSG_ERROR([Target cpu $target_cpu is unsupported or unknown]) ;;
esac
AC_SUBST([TARGET_PLATFORM])
AC_SUBST([INSTALL_ARCH])

dnl Browser Plugin Installation Path
AC_DEFINE_UNQUOTED(INSTALL_PREFIX, "$prefix", [Plugin installation prefix])

expanded_libdir=`(case $prefix in NONE) prefix=$ac_default_prefix ;; *) ;; esac
	case $exec_prefix in NONE) exec_prefix=$prefix ;; *) ;; esac
    eval echo $libdir)`

AC_ARG_WITH(browser_plugin_dir, 
    AC_HELP_STRING([--with-browser-plugin-dir=<dir>],
		[Directory where Mozilla plugins are installed, defaults to ${libdir}/browser-plugins]), 
    [BROWSER_PLUGIN_DIR="${withval}"; 
        BROWSER_PLUGIN_DIR_EXPANDED="${withval}"], 
	[BROWSER_PLUGIN_DIR="${libdir}/browser-plugins"; 
        BROWSER_PLUGIN_DIR_EXPANDED="${expanded_libdir}/browser-plugins"])
AC_SUBST(BROWSER_PLUGIN_DIR)
AC_SUBST(BROWSER_PLUGIN_DIR_EXPANDED)

AC_ARG_ENABLE(xpi_build,
	AC_HELP_STRING([--with-xpi-build],
		[Whether or not to build an XPI for the plugin]),
	[ENABLE_XPI_BUILD="${enableval}"],
	[ENABLE_XPI_BUILD="no"])
AM_CONDITIONAL(ENABLE_XPI_BUILD, test "x$ENABLE_XPI_BUILD" = "xyes")

AC_OUTPUT([
Makefile
player/Makefile
plugin/Makefile
plugin/xpi/Makefile
plugin/xpi/install.rdf
xulrunner/Makefile
xulrunner/icon-theme-hicolor/Makefile
])

cat <<EOF
${PACKAGE} ${VERSION}
Browser Plugin Directory:  $BROWSER_PLUGIN_DIR_EXPANDED
xulrunner 1.9.2+           $HAVE_XULRUNNER_192
EOF

if test "x$ENABLE_XPI_BUILD" = "xyes"; then
cat <<EOF
Build XPI:                 yes
Target Platform:           $TARGET_PLATFORM
Installation Architecture: $INSTALL_ARCH
EOF
fi

