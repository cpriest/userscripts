//noinspection ES6UnusedImports
import './Header.js';
import {Preferences }  from './Prefs.js';
import 'style/default.css';
import {TheOneRing} from './TheRing';

(function() {
	'use strict';

	Prefs = new Preferences();

	TOR = new TheOneRing();

	cl('__THE_HASH__');
})(); 


