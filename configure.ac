AC_INIT([moon-mp-plugin],[0.1])
AC_CONFIG_SRCDIR(README)
AC_CANONICAL_SYSTEM

AM_CONFIG_HEADER(config.h)
AM_INIT_AUTOMAKE([tar-ustar])
AM_MAINTAINER_MODE

AC_PROG_CXX
AC_HEADER_STDC
AC_DISABLE_STATIC
AC_PROG_LIBTOOL

PKG_PROG_PKG_CONFIG

dnl
dnl Mozilla checks
dnl
with_mozilla=no

AC_ARG_WITH(ff3,[  --with-ff3=no,yes  If you want to enable the xulrunner 1.9 (Firefox 3) bridge],[],[with_ff3=yes])
if test x$with_ff3 = xyes; then
  FF3_MODULES="libxul-unstable mozilla-plugin mozilla-js"

  PKG_CHECK_EXISTS($FF3_MODULES,
		   [with_ff3=yes],
		   [with_ff3=no
		    ff3_reason="(reason: missing FF3 development packages)"])

  if test x$with_ff3 = xyes; then
    AC_DEFINE([HAVE_GECKO_1_9],[1],[Gecko 1.9 support])
    PKG_CHECK_MODULES(FF3, [$FF3_MODULES])
    dnl Strip out problem libraries (should already be in process space)
    FF3_LIBS="$(echo $FF3_LIBS | sed -e 's/-lmozjs\|-lplds4\|-lplc4\|-lnspr4//g')"
  fi
fi
AM_CONDITIONAL(HAVE_GECKO_1_9,test x$with_ff3 = xyes)

AC_ARG_WITH(ff2,[  --with-ff2=no,yes  If you want to enable the xulrunner 1.8.1 (Firefox 2)],[],[with_ff2=yes])
if test x$with_ff2 = xyes; then
  mozilla_xpcom="libxul-missing"
  mozilla_xpcom_pcs="xpcom mozilla-xpcom firefox-xpcom xulrunner-xpcom"
  for pc in $mozilla_xpcom_pcs; do
    PKG_CHECK_EXISTS($pc,[mozilla_xpcom=$pc])
  done
  mozilla_plugin="plugin-missing"
  mozilla_plugin_pcs="plugin firefox-plugin xulrunner-plugin"
  for pc in $mozilla_plugin_pcs; do
    PKG_CHECK_EXISTS($pc,[mozilla_plugin=$pc])
  done

  if test $mozilla_xpcom = "libxul-missing" -o $mozilla_plugin = "plugin-missing"; then
    with_ff2=no
    ff2_reason="(reason: missing FF2 development packages)"
  else
    PKG_CHECK_MODULES(FF2,[$mozilla_xpcom $mozilla_plugin])
    dnl Strip out problem libraries (should already be in process space)
    FF2_LIBS="$(echo $FF2_LIBS | sed -e 's/-lmozjs\|-lplds4\|-lplc4\|-lnspr4//g')"
  fi
fi
AM_CONDITIONAL(HAVE_GECKO_1_8,test x$with_ff2 = xyes)

if test x$with_ff2 = xyes; then
  with_mozilla=yes
  MIN_FIREFOX_VERSION="1.5"
  if test x$with_ff3 = xyes; then
    MAX_FIREFOX_VERSION="3.0.*"
  else
    MAX_FIREFOX_VERSION="2.0.0.*"
  fi
else
  if test x$with_ff3 = xyes; then
    with_mozilla=yes
    MIN_FIREFOX_VERSION="2.9.*"
    MAX_FIREFOX_VERSION="3.0.*"
  fi
fi
AC_SUBST([MIN_FIREFOX_VERSION])
AC_SUBST([MAX_FIREFOX_VERSION])
AM_CONDITIONAL(HAVE_MOZILLA, test x$with_mozilla = xyes)

dnl 
dnl glib
dnl
PKG_CHECK_MODULES(GLIB,glib-2.0)

dnl
dnl plugin checks
dnl
AC_ARG_ENABLE(user-plugin,[  --enable-user-plugin    Build the plugin installer],
			  [user_plugin=yes
			   AC_DEFINE([PLUGIN_INSTALL],[1],[Load libraries from ~/.mozilla/plugins and build a Mozilla XPInstall file])
			  ],
			  [user_plugin=no
			  ])
AM_CONDITIONAL([PLUGIN_INSTALL],[test x$user_plugin = xyes])

if test x$user_plugin = xyes; then
  if test x$with_ff3 = xno -a x$with_ff2 = xno; then
    AC_MSG_ERROR([Building the plugin installer requires Firefox2 or Firefox3 support.])
  fi
  case "$target_os" in
    *linux* )
    TARGET_PLATFORM="Linux"
    ;;
    * )
    AC_MSG_ERROR([Target os $target_os is unknown.
    Please add the appropriate string to configure.ac.
    See http://developer.mozilla.org/en/docs/OS_TARGET])
    ;;
  esac
  
  case "$target_cpu" in
    i*86 )
    TARGET_PLATFORM="$TARGET_PLATFORM"_x86-gcc3
    INSTALL_ARCH=i586
    ;;
    x86_64 )
    TARGET_PLATFORM="$TARGET_PLATFORM"_x86_64-gcc3
    INSTALL_ARCH=x86_64
    ;;
    powerpc )
    TARGET_PLATFORM="$TARGET_PLATFORM"_ppc-gcc3
    INSTALL_ARCH=ppc
    ;;
    sparc64 )
    TARGET_PLATFORM="$TARGET_PLATFORM"_sparc64-gcc3
    INSTALL_ARCH=sparc
    ;;
    * )
    AC_MSG_ERROR([Target cpu $target_cpu is unknown.
    Please add the appropriate string to configure.ac.
    See http://developer.mozilla.org/en/docs/XPCOM_ABI])
    ;;
  esac
  AC_SUBST(TARGET_PLATFORM)
  AC_SUBST([INSTALL_ARCH])
fi

if test x$with_ff3 = xyes; then
   MOZILLA_CFLAGS=$FF3_CFLAGS
else
   MOZILLA_CFLAGS=$FF2_CFLAGS
fi

MOZILLA_CFLAGS="${MOZILLA_CFLAGS} -DINSTALL_PREFIX=\\\"${prefix}\\\""

AC_SUBST(MOZILLA_CFLAGS)
AC_SUBST(CFLAGS)
AC_SUBST(CXXFLAGS)

AC_OUTPUT([
Makefile
src/Makefile
])

# general configuration info
cat <<EOF

Moonlight Media Player configuration
====================================
EOF

# plugin installer/bridge info
cat <<EOF

  Browser Support:
    Firefox: $with_mozilla
EOF

if test x$with_mozilla = xyes; then
cat <<EOF
      Plugin Installer (.xpi): $user_plugin
        Gecko 1.8 (Firefox 2): $with_ff2 $ff2_reason
        Gecko 1.9 (Firefox 3): $with_ff3 $ff3_reason
EOF
fi

# blank line
cat <<EOF

EOF
