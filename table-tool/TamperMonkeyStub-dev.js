// ==UserScript==
// @name         table-tool
// @namespace    cmp.tt
// @version      0.1.1
// @description  Provides useful tools for TABLE elements
// @author       Clint Priest
// @match        *://esp.resultsgeneration.com/Reports/*
// @grant        none
// @source
// @license      MIT
// @run-at       document-end
// @homepage     https://github.com/resgen/table-tool
// @require		 https://unpkg.com/hotkeys-js/dist/hotkeys.min.js
// @require		 https://unpkg.com/sprintf-js/dist/sprintf.min.js
// ==/UserScript==


(function() {
	function addScript(src) {
		let x = document.createElement('script');
		x.src = src;
		document.head.appendChild(x);
	}

	addScript('https://unpkg.com/mathjs/dist/math.min.js');
	addScript('https://esp.resultsgeneration.com/table-tool/table-tool-dev.user.js');
})();
