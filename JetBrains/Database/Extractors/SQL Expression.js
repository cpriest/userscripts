'use strict';

/**
 * This script will take the selected cell values and output an SQL expression in the form of:
 * 		`Column`='Value' AND ...		- Single row of cells selected
 * 	-or-
 * 		`Column` IN ('Value',...) 		- Multiple rows of cells selected
 *
 * 	This script unfortunately has to be written to be compatible with Nashorn JS that comes with Java, quite ancient IMO
 */

function eachWithIdx(iterable, f) {
	var i   = iterable.iterator();
	var idx = 0;
	while(i.hasNext()) f(i.next(), idx++);
}

function mapEach(iterable, f) {
	var vs = [];
	eachWithIdx(iterable, function(i) { vs.push(f(i));});
	return vs;
}

var NEWLINE = "\n";

function output() {
	for(var i = 0; i < arguments.length; i++) {
		OUT.append(arguments[i]);
	}
}

function outputLn() {
	for(var i = 0; i < arguments.length; i++) {
		OUT.append(arguments[i] + NEWLINE);
	}
}

var colNames = mapEach(COLUMNS, function(col) { return col.name(); });
var data     = [];

eachWithIdx(ROWS, function(row, rowIdx) {
	eachWithIdx(COLUMNS, function(col, colIdx) {
		if(!data[colIdx])
			data[colIdx] = [];
		data[colIdx].push(FORMATTER.format(row, col));
	});
});

var tGroups = data.reduce(function(acc, cur, idx) {
	if(cur.length === 1)
		acc.push('`' + colNames[idx] + '` = \'' + cur[0] + '\'');
	else
		acc.push('`' + colNames[idx] + '` IN (\'' + cur.join('\',\'') + '\')');
	return acc;
}, []);

outputLn(tGroups.join(' AND '));
