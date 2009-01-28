#!/bin/bash

function error () {
	echo "Error: $1" 1>&2
	exit 1
}

function check_autotool_version () {
	which $1 &>/dev/null || {
		error "$1 is not installed, and is required to configure $PACKAGE"
	}

	version=$($1 --version | head -n 1 | cut -f4 -d' ')
	major=$(echo $version | cut -f1 -d.)
	minor=$(echo $version | cut -f2 -d.)
	rev=$(echo $version | cut -f3 -d.)
	major_check=$(echo $2 | cut -f1 -d.)
	minor_check=$(echo $2 | cut -f2 -d.)
	rev_check=$(echo $2 | cut -f3 -d.)

	if [ $major -lt $major_check ]; then
		do_bail=yes
	elif [[ $minor -lt $minor_check && $major = $major_check ]]; then
		do_bail=yes
	elif [[ $rev -lt $rev_check && $minor = $minor_check && $major = $major_check ]]; then
		do_bail=yes
	fi

	if [ x"$do_bail" = x"yes" ]; then
		error "$1 version $2 or better is required to configure $PROJECT"
	fi
}

function run () {
	echo "$@ ..."
	$@ 2>.autogen.log || {
		cat .autogen.log 1>&2
		rm .autogen.log
		error "Could not run $1, which is required to configure $PROJECT"
	}
	rm .autogen.log
}

srcdir=$(dirname $0)
test -z "$srcdir" && srcdir=.

(test -f $srcdir/configure.ac) || {
	error "Directory \"$srcdir\" does not look like the top-level directory"
}

PROJECT=$(awk -F[ '/^[[:space:]]*AC_INIT/{sub(/].*$/, "", $2); print $2}' < $srcdir/configure.ac)

(test -z "$PROJECT") && {
	error "Could not identify project name. AC_INIT([project-name], ...) not found"
}

echo "Generating build environment for $PROJECT ..."

LIBTOOLIZE=$(basename $(which libtoolize || which glibtoolize))

check_autotool_version aclocal 1.9
check_autotool_version automake 1.9
check_autotool_version autoconf 2.53
check_autotool_version $LIBTOOLIZE 1.4.3
check_autotool_version pkg-config 0.14.0

run $LIBTOOLIZE --force --copy --automake
run aclocal $ACLOCAL_FLAGS
run autoconf
run autoheader
test -f config.h.in && touch config.h.in
run automake --gnu --add-missing --force --copy \
	-Wno-portability -Wno-portability

run ./configure --enable-maintainer-mode $@

