#!/bin/bash

# codify.sh by Aaron Bockover
# Copyright (C) 2008 Novell
# Licensed MIT X11
# 
# Turns a set of files into a C header file

function bail () {
	echo "ERROR: $1" 1>&2
	exit 1
}

exec_cmd="$0"

out=$1; shift
inputs=0

out_define="_$(echo $out | 
	tr '[:lower:]' '[:upper:]' | 
	sed 's,[-.],_,g;s,[^A-Z_],,g')"

[[ -z $out ]] && 
	bail "You must specify an output file first"

while (($# > 0)); do
	var=$1
	input=$2
	
	[[ -z $var || ! -f $input ]] && 
		bail "Invalid variable/input file argument pair ($var, $input)"

	[[ $inputs -eq 0 ]] && {
		(echo "/* "
			echo " * $out: auto-generated embedded resources "
			echo " * "
			echo " * This file was created with the command: "
			echo " * "
			echo " *   $ $0 $out \ "
			for ((i=1; i<$#; i+=2)); do
				argset=" *         $(eval "echo \$$i \$$(($i+1))")"
				[[ $i -lt $(($#-1)) ]] && argset="$argset \\"
				echo "$argset"
			done
			echo " */ "
			echo
			echo "#ifndef $out_define"
			echo "#define $out_define"
			echo) > $out
	}

	((inputs++))

	(echo "/* Embedded Resource $inputs ($input) */"
		table=$(hexdump -e '"    " 16/1 "0x%02x, " "\n"' $input | sed -r 's/, 0x[ ,]+.*/, 0x00/')
		echo "static const char $var [] = {"
        echo "$table"
        [[ ${table:$((${#table}-1))} = "," ]] && echo "    0x00"
		echo "};"
		echo) >> $out
	
	shift; shift
done

[[ $inputs -eq 0 ]] && 
	bail "You must specify at least one variable/input file pair"

echo "#endif /* $out_define */" >> $out

