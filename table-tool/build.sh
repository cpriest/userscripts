#!/bin/bash

OUTFILE="./dist/table-tool.user.js";

MODE="${1:-dev}";

npx userscript-builder --mode ${MODE};

echo;

case $MODE in
	dev)
		HASH=$(md5sum $OUTFILE);

		echo "Hash is $HASH";
		perl -pi -e "s#__THE_HASH__#$HASH#" $OUTFILE;
		;;
	*)
		echo "non-dev build, removing line with __THE__HASH__";
		perl -pi -e "s#^.*__THE_HASH__.*\$##" $OUTFILE;
		;;
esac;

