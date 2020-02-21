// ==UserScript==
// @name         table-tool-dev
// @namespace    cmp.tt
// @version      1.0-dev.0
// @description  Provides useful tools for TABLE elements
// @author       Clint Priest
// @match        *://esp.resultsgeneration.com/Reports/*
// @grant        none
// @source
// @license      MIT
// @run-at       document-end
// @homepage     https://github.com/resgen/table-tool
// ==/UserScript==


(function() {
	function addScript(src) {
		let x = document.createElement('script');
		x.src = src;
		document.head.appendChild(x);
	}

	addScript('https://localhost:8080/table-tool.user.js');
})();
