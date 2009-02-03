dnl automake/autoconf setup
AC_INIT([moonshine], [0.1])
AC_CONFIG_SRCDIR(README)
AC_CANONICAL_SYSTEM
AC_PREREQ(2.13)
AM_CONFIG_HEADER(config.h)
AM_INIT_AUTOMAKE([1.9 dist-bzip2 tar-ustar])
AM_MAINTAINER_MODE

dnl Build config/tools
AC_HEADER_STDC
AC_DISABLE_STATIC
AC_PROG_LIBTOOL
PKG_PROG_PKG_CONFIG

dnl Mozilla checks
MOZILLA_MODULES="libxul-unstable mozilla-plugin"
PKG_CHECK_MODULES(MOZILLA, [$MOZILLA_MODULES])
MOZILLA_CFLAGS="${MOZILLA_CFLAGS} -DINSTALL_PREFIX=\\\"${prefix}\\\""
AC_SUBST(MOZILLA_CFLAGS)

MIN_FIREFOX_VERSION="3.0.*"
MAX_FIREFOX_VERSION="3.1.*"
MIN_GECKO_VERSION="1.9.0"
MAX_GECKO_VERSION="1.9.*"
AC_SUBST([MIN_FIREFOX_VERSION])
AC_SUBST([MAX_FIREFOX_VERSION])
AC_SUBST([MIN_GECKO_VERSION])
AC_SUBST([MAX_GECKO_VERSION])

dnl Other dependency checks
PKG_CHECK_MODULES(GLIB, glib-2.0 >= 2.14 gmodule-2.0 >= 2.14)

AC_SUBST(CFLAGS)

expanded_libdir=`(case $prefix in NONE) prefix=$ac_default_prefix ;; *) ;; esac
	case $exec_prefix in NONE) exec_prefix=$prefix ;; *) ;; esac
    eval echo $libdir)`

AC_ARG_WITH(browser_plugin_dir, 
    AC_HELP_STRING([--with-browser-plugin-dir=<dir>],
	[Directory where Mozilla plugins are installed, defaults to ${libdir}/browser-plugins]), 
    [BROWSER_PLUGIN_DIR="${withval}"; 
        BPD_EXPANDED="${withval}"], 
	[BROWSER_PLUGIN_DIR="${libdir}/browser-plugins"; 
        BPD_EXPANDED="${expanded_libdir}/browser-plugins"])
AC_SUBST(BROWSER_PLUGIN_DIR)

AC_OUTPUT([
Makefile
player/Makefile
plugin/Makefile
xulrunner/Makefile
xulrunner/icon-theme-hicolor/Makefile
])

cat <<EOF
${PACKAGE} ${VERSION}
Browser Plugin Directory: $BPD_EXPANDED
EOF

