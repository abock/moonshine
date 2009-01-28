dnl automake/autoconf setup
AC_INIT([moon-mp-plugin], [0.1])
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
MOZILLA_MODULES="libxul-unstable mozilla-plugin mozilla-js"
PKG_CHECK_MODULES(MOZILLA, [$MOZILLA_MODULES])
dnl Strip out problem libraries (should already be in process space)
MOZILLA_LIBS="$(echo $FF3_LIBS | sed -e 's/-lmozjs\|-lplds4\|-lplc4\|-lnspr4//g')"
MOZILLA_CFLAGS="${MOZILLA_CFLAGS} -DINSTALL_PREFIX=\\\"${prefix}\\\""
AC_SUBST(MOZILLA_CFLAGS)

MIN_FIREFOX_VERSION="3.0.*"
MAX_FIREFOX_VERSION="3.1.*"
AC_SUBST([MIN_FIREFOX_VERSION])
AC_SUBST([MAX_FIREFOX_VERSION])

dnl Other dependency checks
PKG_CHECK_MODULES(GLIB, glib-2.0 >= 2.14 gmodule-2.0 >= 2.14)

AC_SUBST(CFLAGS)

AC_OUTPUT([
Makefile
src/Makefile
])
