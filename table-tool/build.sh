#!/bin/bash

MODE="${1:-dev}";

npx userscript-builder --mode ${MODE};

echo;

case $MODE in
	dev)
		OUTFILE="./dist/table-tool.user.js";
		HASH=$(md5sum $OUTFILE);

		echo "Hash is $HASH";
		perl -pi -e "s#__THE_HASH__#$HASH#" $OUTFILE;
		;;
	*)
		OUTFILE="./release/table-tool.user.js";
		echo "non-dev build, removing line with __THE_HASH__";
		perl -pi -e "s#^.*__THE_HASH__.*\$##" $OUTFILE;
		;;
esac;

