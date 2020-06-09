// ==UserScript==
// @name        CopyThat
// @namespace   ClintPriest.com
// @description When pressing Ctrl-C and while cursor is over
// 					* an <A> tag, copies link as <a>...</a>
// 					* otherwise copies page title and location.href on ctrl-c
//				Otherwise Ctrl-C acts as normal.  Above is not in effect if there is
// 				a page selection or active element
// @include     *
// @exclude		/^https?://docs.google.com/.+$/
// @exclude		/^https?://app.asana.com2
// @version     1.0.4
// @grant       GM_setClipboard
// @grant		GM_getClipboard
// @grant		GM_getResourceText
// @grant		GM_addStyle
// @updateURL	https://raw.githubusercontent.com/cpriest/userscripts/master/CopyThat/CopyThat.user.js
// @resource	CopyThat_Style	https://raw.githubusercontent.com/cpriest/userscripts/master/CopyThat/style.css
// @resource	CopyThat_Panel	https://raw.githubusercontent.com/cpriest/userscripts/master/CopyThat/Panel.htm
// @run-at		document-end
// ==/UserScript==


/**
 *    <! Where Im At: !>
 *        Was in the middle of converting to use ES 6 via Babel, still have some conversions to do
 *
 *    <+ Would like to +>
 *        - Copy Links as actual links, rather than text of html... can GM_setClipboard be used with an element?
 *        - Copy images
 *        - Enter 'selection mode' via ctrl + ctrl or some other combination whereby what's being targeted (initialy :hover, later navigable ala CustomizeYourWeb?? -- U, D) is outlined
 */

const CTRL  = 1,
	  ALT   = 2,
	  SHIFT = 4;

/** Stylesheet Class - Focus & Transition */
const SC_FOCUS   = 'CopyThat_FC',
	  SC_FOCUS_T = 'CopyThat_FCt';

const Selector_NotVisible = ':not([style*="display:none"]):not([style*="display: none"]):not([style*="visibility:hidden"]):not([style*="visibility: hidden"])';
const Selector_FormInputs = 'INPUT[type=text],INPUT[type=password],INPUT[type=search],SELECT,TEXTAREA';

const VK_C         = 'c',
	  VK_V         = 'v',
	  VK_D         = 'd',
	  VK_UP        = KeyboardEvent.DOM_VK_UP,
	  VK_DOWN      = KeyboardEvent.DOM_VK_DOWN,
	  VK_LEFT      = KeyboardEvent.DOM_VK_LEFT,
	  VK_RIGHT     = KeyboardEvent.DOM_VK_RIGHT,
	  VK_HOME      = KeyboardEvent.DOM_VK_HOME,
	  VK_END       = KeyboardEvent.DOM_VK_END,
	  VK_BACKSLASH = KeyboardEvent.DOM_VK_BACK_SLASH;

/** Returns true if the given element is an input field we care about **/
function isInputField(el) {
	return el.tagName == 'TEXTAREA' || (el.tagName == 'INPUT' && [ 'text', 'password' ].indexOf(el.type) != -1);
}

function HighlightInput(el) {
	addStyles();

	function te() {
		this.removeEventListener('transitionend', this);
		this.classList.remove(SC_FOCUS, SC_FOCUS_T);
	}

	el.classList.add(SC_FOCUS);
	setTimeout(() => {
		el.classList.add(SC_FOCUS_T);
		el.addEventListener('transitionend', te);
	}, 10);
}


var gc = this;

class TableOperations {
	Handle(e) {
		if(!isInputField(document.activeElement))
			return false;

		var TD = document.activeElement.parentNode;
		if(TD.tagName !== 'TD')
			return false;

		const _Selector = 'INPUT[type=text], INPUT[type=password]';
		var VisibleRows = TD.parentNode.parentNode.querySelectorAll(':scope > TR' + Selector_NotVisible),
			RowIndex    = Array.from(VisibleRows)
				.indexOf(TD.parentNode),
			RowInputs   = TD.parentNode.querySelectorAll(_Selector),
			InputIndex  = Array.from(RowInputs)
				.indexOf(document.activeElement);

		if(InputIndex < 0)
			return false;

		try {
			var Target = null;
			switch(e.key) {
				case 'd':	// Fill Down 1 cell
				case 'D':	// Fill Down 1 cell
					if(e.mods == CTRL) {
						if(RowIndex + 1 < VisibleRows.length) {
							Target       = VisibleRows[RowIndex + 1].querySelectorAll(_Selector)[InputIndex];
							Target.value = document.activeElement.value;
						}
					} else if(e.mods == CTRL + SHIFT) {
						while(RowIndex + 1 < VisibleRows.length) {
							Target       = VisibleRows[RowIndex + 1].querySelectorAll(_Selector)[InputIndex];
							Target.value = document.activeElement.value;
							RowIndex++;
						}
					}
					break;
				case 'ArrowUp':
					if(RowIndex - 1 >= 0)
						Target = VisibleRows[RowIndex - 1].querySelectorAll(_Selector)[InputIndex];
					break;
				case 'ArrowDown':
					if(RowIndex + 1 < VisibleRows.length)
						Target = VisibleRows[RowIndex + 1].querySelectorAll(_Selector)[InputIndex];
					break;
				case 'ArrowLeft':
					Target = RowInputs[InputIndex - 1];
					break;
				case 'ArrowRight':
					Target = RowInputs[InputIndex + 1];
					break;
				case 'Home':
					Target = VisibleRows[0].querySelectorAll(_Selector)[InputIndex];
					break;
				case 'End':
					Target = VisibleRows[VisibleRows.length - 1].querySelectorAll(_Selector)[InputIndex];
					break;
			}
			if(Target) {
				Target.focus();
				Target.select();
			}
		} catch(e) {
			console.error(e);
		}
		return true;
	}
}

class CycleFormInputs {
	constructor() {
		this.LastInput = undefined;
	}

	/**
	 * Switches to the next non-form input
	 *
	 * @param ae    {DocumentView}    document.activeElement
	 * @param e        {Event}            Event triggering this call
	 * @returns    {Boolean}        True if event was acted upon
	 * @constructor
	 */
	Handle(ae, e) {
		function SwitchTo(el) {
			el.focus();
			if(el.select)
				el.select();
			HighlightInput(el);
			return true;
		}

		/** @param {Array} Forms - All forms on page */
		let Forms = document.querySelectorAll('FORM'), aForm = Forms[0];

		if(ae) {
			for(let f of Forms) {
				if(f.contains(ae)) {
					aForm = f;
					break;
				}
			}
		}
		if(!aForm)
			return false;

		if(([ 'INPUT', 'SELECT', 'TEXTAREA' ].indexOf(e.target.tagName) != -1)) {
			let Inputs = Array.from(aForm.querySelectorAll(Selector_FormInputs)),
				n      = Inputs.indexOf(e.target);

			e.mods & SHIFT
			? n--
			: n++;

			if(n < 0)
				n = Inputs.length - 1;
			else if(n == Inputs.length)
				n = 0;
			return SwitchTo(Inputs[n]);
		}
		return SwitchTo(aForm.querySelector(Selector_FormInputs));
	}
}

class CycleNonFormInputs {
	constructor() {
		/** @type {HTMLElement} LastInput - The last input that was cycled */
		this.LastInput = undefined;
	}

	/**
	 * Find:
	 *    - All inputs that are not contained in a form
	 *    - Any inputs (in a form) with a type of 'search' or (type of 'text' and name of 'q')
	 */
	findInputs() {
		let nfInputs = [];
		let Forms    = document.querySelectorAll('FORM');

		for(let i of document.querySelectorAll('INPUT[type=text], INPUT[type=search]')) {
			let InForm = 0;

			// Detect hidden via display: none
			if(i.offsetParent == null)
				continue;
			if(i.type == 'search' || i.name == 'q' || i.name == '') {
				// Excludes form search
			} else {
				for(let f of Forms) {
					if(InForm += f.contains(i) > 0)
						break;
				}
			}

			if(InForm == 0)
				nfInputs.push(i);
		}
		return nfInputs;
	}

	/**
	 * Switches to the next non-form input
	 *
	 * @param ae    {DocumentView}    document.activeElement
	 * @param e     {Event}            Event triggering this call
	 * @returns     {Boolean}        True if event was acted upon
	 */
	Handle(ae, e) {
		/** @param {Array} nfInputs - Global non-form inputs */
		let nfInputs = this.findInputs(),
			x        = undefined;

//		console.log('CycleNonFormInputs', nfInputs);
		if(!nfInputs.length)
			return false;

		if(this.LastInput == undefined && (x = nfInputs.indexOf(ae)) != -1)
			this.LastInput = nfInputs[x];

		if(([ 'INPUT', 'SELECT', 'TEXTAREA' ].indexOf(e.target.tagName) == -1 || ae == this.LastInput ||
		   (e.target.tagName == 'INPUT' && [ 'text', 'search', 'password' ].indexOf(e.target.type) == -1)) ||
		   (e.target.tagName == 'INPUT' && e.target.selectionStart == 0 && e.target.selectionEnd == e.target.value.length)) {
//			console.log(this.LastInput);
			if(this.LastInput != undefined) {
//				console.log('1');
				if(ae == this.LastInput) {
//					console.log('2');
					if(this.LastInput.selectionEnd - this.LastInput.selectionStart == this.LastInput.value.length) {
//						console.log('2.1');
						return this.SwitchTo(nfInputs[nfInputs.indexOf(this.LastInput) + 1] || nfInputs[0]);
					}
//					console.log('2.2');
				} else {
//					console.log('3');
					return this.SwitchTo(this.LastInput);
				}
			} else {
//				console.log('4');
				return this.SwitchTo(nfInputs[0]);
			}
		}
	}

	SwitchTo(el) {
//		console.log('switching');
		el.select();
		this.LastInput = el;
		HighlightInput(el);
		return true;
	}
}

class BackslashHandler {
	Handle(e) {
		let ae = document.activeElement;

		if([ 'INPUT', 'TEXTAREA' ].indexOf(ae.tagName) != -1) {
			if((e.mods == CTRL || e.mods == ALT) && (ae.selectionStart != 0 || ae.selectionEnd != ae.value.length))
				return ae.select() || true;
		}
		if(e.mods & CTRL)
			return (new CycleFormInputs().Handle(ae, e));
		else if(e.mods == 0)
			return (new CycleNonFormInputs().Handle(ae, e));
	}
}


var CopyHandlers = (function() {

	function CopyPageLink(e) {
		// let clip = '<a href="' + elem.href + '">' + elem.textContent + '</a>';
		let clip = `[${ document.title }](${ document.location.href })`;
		CopyToClipboard(clip);
		//ShowPanel('Copied to clipboard:', elem);
		return false;
	}

	function CopyAnchor(e, elem) {
		// let clip = '<a href="' + elem.href + '">' + elem.textContent + '</a>';
		let clip = `[${ elem.textContent }](${ elem.href })`;
		CopyToClipboard(clip);
		animate(elem, 'CopyThat_A_Copied');
		ShowPanel('Copied to clipboard:', elem);
		return false;
	}

	function CopySelect(e, elem) {
		elem = elem.closest('SELECT');

		if(elem.multiple != true) {
			if(elem.selectedOptions.length) {
				CopyToClipboard(elem.selectedOptions[0].text.trim());
				animate(elem, 'CopyThat_A_Copied');
			}
			return true;
		} else {
			let tValues = [];
			for(var opt of elem.options) {
				if(opt.selected)
					tValues.push(opt.textContent.trim());
			}

			CopyToClipboard(tValues.join("\r\n"));
			animate(elem, 'CopyThat_A_Copied');
			return true;
		}
	}

	function CopyTextContent(e, elem) {
		let content = elem.textContent.trim();
		if(content != '') {
			CopyToClipboard(elem.textContent);
		} else {
			CopyPageLink(e);
		}
		animate(elem, 'CopyThat_A_Copied');
		return true;
	}

	function CopyValue(e, elem) {
		CopyToClipboard(elem.value);
		animate(elem, 'CopyThat_A_Copied');
		return true;
	}

	function CopyToClipboard(msg) {
//		console.log('CopyThat: Copied To Clipboard: "%s"', msg);
		GM_setClipboard(msg);
	}

	return {
		'A':        CopyAnchor,
		'SELECT':   CopySelect,
		'OPTION':   CopySelect,
		'OPTGROUP': CopySelect,
		'TD':       CopyTextContent,
		'TR':       CopyTextContent,
		'TH':       CopyTextContent,
		'DIV':      CopyTextContent,
		'P':        CopyTextContent,
		'SPAN':     CopyTextContent,
		'INPUT':    CopyValue,
		'LABEL':    CopyTextContent,
		'PRE':      CopyTextContent,
		'TEXTAREA': CopyValue,
		'BODY':     CopyPageLink,
	}
}());

class CopyHandler {
	Handle(e) {
		if(!isInputField(document.activeElement) && !hasDocumentSelection()) {
			let tHoverPath = Array.from(document.querySelectorAll(':hover'))
				.reverse();

			let method = CopyHandlers.BODY;

			if(tHoverPath.length > 0 && CopyHandlers[tHoverPath[0].tagName])
				method = CopyHandlers[tHoverPath[0].tagName];

			if(method && method(e, ...tHoverPath))
				return true;
		}
		return false;
	}
}

var PasteHandlers = (function() {

	function PasteSelect(e, elem) {
		let clipText = e.clipboardData.getData('text/plain');

		if(!clipText)
			return false;

		elem = elem.closest('SELECT');

		if(elem.multiple != true) {
			clipText = clipText.trim();
			for(var opt of elem.options) {
				if(opt.text.trim() == clipText) {
					elem.value = opt.value;
					break;
				}
			}

			animate(elem, 'CopyThat_Pasted');
			return true;
		} else {
			let tValues = clipText
				.split(/[\r\n]+/)
				.map(String.trim);
			for(var opt of elem.options) {
				opt.selected = (tValues.indexOf(opt.textContent.trim()) != -1);
			}

			animate(elem, 'CopyThat_Pasted');
			return true;
		}
	}

	function PasteValue(e, elem) {
		let clipText = e.clipboardData.getData('text/plain');

		if(!clipText)
			return false;

		elem.value = clipText;
		animate(elem, 'CopyThat_Pasted');
		return true;
	}

	return {
		'SELECT':   PasteSelect,
		'OPTGROUP': PasteSelect,
		'OPTION':   PasteSelect,
		'INPUT':    PasteValue,
		'TEXTAREA': PasteValue,
	};
}());

document.addEventListener('paste', function(e) {
	if(!isInputField(document.activeElement) && !hasDocumentSelection()) {
		let tHoverPath = Array.from(document.querySelectorAll(':hover'))
			.reverse();

		if(tHoverPath.length === 0 || !PasteHandlers[tHoverPath[0].tagName])
			return;

		if(PasteHandlers[tHoverPath[0].tagName](e, ...tHoverPath)) {
			e.stopPropagation();
			e.preventDefault();
		}
	}
}, true);

document.addEventListener('copy', function(e) {
//	console.log('copy - ', e);
}, true);

//var CycleInputs_Old = (function() {
//
//	/** @param {Array} nfInputs - Global non-form inputs */
//	var nfInputs = undefined;
//
//	/** @param {Array} Forms - All forms on page */
//	var Forms = undefined;
//
//	/** @param {HTMLElement} LastInput - The last input that was cycled */
//	var LastInput = undefined;

//	/**
//	 * Find:
//	 *    - All inputs that are not contained in a form
//	 *    - Any inputs (in a form) with a type of 'search' or (type of 'text' and name of 'q')
//	 */
//	function findInputs() {
//
//		nfInputs = [];
//		Forms    = document.querySelectorAll('FORM');
//
//		let inputs = document.querySelectorAll('INPUT[type=text],INPUT[type=search]');
//
//		for(let i of inputs) {
//			let InForm = 0;
//
//			// Detect hidden via display: none
//			if(i.offsetParent == null)
//				continue;
//
//			if(i.type == 'search' || i.name == 'q' || i.name == '') {
//				// Excludes form search
//			} else {
//				for(let f of Forms) {
//					if(InForm += f.contains(i) > 0)
//						break;
//				}
//			}
//
//			if(InForm == 0)
//				nfInputs.push(i);
//		}
//	}
//	/**
//	 * Switches to the next non-form input
//	 *
//	 * @param ae    {DocumentView}    document.activeElement
//	 * @param e        {Event}            Event triggering this call
//	 * @returns    {Boolean}        True if event was acted upon
//	 * @constructor
//	 */
//	function CycleNonFormInputs(ae, e) {
//		if(nfInputs.length > 0) {
//			let x;
//
//			function SwitchTo(el) {
//				el.select();
//				LastInput = el;
//				HighlightInput(el);
//				return true;
//			}
//
//			if(LastInput == null && (x = nfInputs.indexOf(ae)) != -1)
//				LastInput = nfInputs[x];
//
//			if((['INPUT', 'SELECT', 'TEXTAREA'].indexOf(e.target.tagName) == -1 || ae == LastInput || (e.target.tagName == 'INPUT' && [
//						'text', 'search', 'password'
//					].indexOf(e.target.type) == -1)) || (e.target.tagName == 'INPUT' && e.target.selectionStart == 0 && e.target.selectionEnd == e.target.value.length)) {
//				if(LastInput != null) {
//					if(ae == LastInput) {
//						if(LastInput.selectionEnd - LastInput.selectionStart == LastInput.value.length)
//							return SwitchTo(nfInputs[nfInputs.indexOf(LastInput) + 1] || nfInputs[0]);
//					} else
//						return SwitchTo(LastInput);
//				} else
//					return SwitchTo(nfInputs[0]);
//			}
//		}
//		return false;
//	}
//
//	/**
//	 * Switches to the next non-form input
//	 *
//	 * @param ae    {DocumentView}    document.activeElement
//	 * @param e        {Event}            Event triggering this call
//	 * @returns    {Boolean}        True if event was acted upon
//	 * @constructor
//	 */
//	function CycleFormInputs(ae, e) {
//
//		function SwitchTo(el) {
//			el.focus();
//			if(el.select)
//				el.select();
//			HighlightInput(el);
//			return true;
//		}
//
//		/** Find form to work with */
//		let Forms = document.querySelectorAll('FORM'), aForm = Forms[0];
//
//		if(ae) {
//			for(let f of Forms) {
//				if(f.contains(ae)) {
//					aForm = f;
//					break;
//				}
//			}
//		}
//		if(!aForm)
//			return false;
//
//		if((['INPUT', 'SELECT', 'TEXTAREA'].indexOf(e.target.tagName) != -1)) {
//			let Inputs = Array.from(aForm.querySelectorAll(Selector_FormInputs)),
//				n      = Inputs.indexOf(e.target);
//
//			e.mods & SHIFT
//					? n--
//					: n++;
//
//			if(n < 0)
//				n = Inputs.length - 1;
//			else if(n == Inputs.length)
//				n = 0;
//			return SwitchTo(Inputs[n]);
//		}
//		return SwitchTo(aForm.querySelector(Selector_FormInputs));
//	}

//	function HandleBackslashEvent(e) {
//		nfInputs ||
//			findInputs();
//
//		let ae = document.activeElement;
//
//		if(['INPUT', 'TEXTAREA'].indexOf(ae.tagName) != -1) {
//			if((e.mods == CTRL || e.mods == ALT) && (ae.selectionStart != 0 || ae.selectionEnd != ae.value.length))
//				return ae.select() || true;
//		}
//		if(e.mods & ALT)
//			return CycleFormInputs(ae, e);
//		else if(e.mods == 0)
//			return CycleNonFormInputs(ae, e);
//	}
//
//	return
//		HandleBackslashEvent: HandleBackslashEvent,
//	}
//})();


var styleInserted = false;

var panel = {
	inserted: false,
};

/** Adds the styles to the document if they have not already been added **/
function addStyles() {
	if(!styleInserted) {
		styleInserted = true;
		GM_addStyle(GM_getResourceText('CopyThat_Style'));
	}
}

/** Adds the panel to the document if it has not already been added, sets it's content to content **/
function ShowPanel(header, content) {
	if(!panel.inserted) {
		addStyles();
		panel.inserted      = true;
		let Container       = document.createElement('div');
		Container.innerHTML = GM_getResourceText('CopyThat_Panel');

		document.body.appendChild(Container.firstElementChild);
		panel.Elem    = document.querySelector('div.CopyThat_Panel > div');
		panel.Header  = document.querySelector('div.CopyThat_Panel h5');
		panel.Content = document.querySelector('div.CopyThat_Panel div > div:nth-of-type(1)');
//		panel.Progress = Container.querySelector('div#CopyThat_Panel div > div:nth-of-type(2) > div');
		setTimeout(() => ShowPanel(header, content), 50);	// Defer until re-flow
		return;
	}

//	console.log(panel);

	panel.Header.innerHTML  = header && (typeof header != 'string')
							  ? header.outerHTML
							  : header || '';
	panel.Content.innerHTML = content && (typeof content != 'string')
							  ? content.outerHTML
							  : content || '';
	panel.Elem.classList.add('open');

//	panel.Progress.classList.add('go');
	if(panel.CloseTimer)
		clearTimeout(panel.CloseTimer);
	panel.CloseTimer = setTimeout(() => {
		panel.Elem.classList.remove('open');
//		panel.Progress.classList.remove('go');
		panel.CloseTimer = undefined;
	}, 5000);
}

/** Returns true if the document has a selection **/
function hasDocumentSelection() {
	return document.getSelection()
			   .toString().length > 0;
}

/**
 *
 * @param {Element}    el            The element to animate via the given className
 * @param {String}    className    The className to start the animation
 */
function animate(el, className) {
	addStyles();
	var animEnd = () => {
		el.removeEventListener('animationend', animEnd);
		el.classList.remove(className);
	};
	el.addEventListener('animationend', animEnd);
	el.classList.add(className);
}


/* Capture keydown (over-ride document) phase */
// window.document.addEventListener('keydown', function(e) {
//	try {
//		e.mods = (e.ctrlKey) + (e.altKey << 1) + (e.shiftKey << 2);
//		e.suppress = function suppress() {
//			this.stopPropagation();
//			this.preventDefault();
//		};
//
//		/* Only active on Ctrl + C */
//		if(e.mods == CTRL && e.keyCode == KeyboardEvent.DOM_VK_C) {
//			if(!isInputField(document.activeElement) && !hasDocumentSelection()) {
//				let tHoverPath = Array.from(document.querySelectorAll(':hover'))
//					.reverse();
//
//				if(tHoverPath.length == 0)
//					return;
//
//				if(!CopyHandlers[ tHoverPath[ 0 ].tagName ])
//					return;
//
//				if(CopyHandlers[ tHoverPath[ 0 ].tagName ](e, ...tHoverPath))
//					e.suppress();
//			}
//		}
//
//	} catch(exc) {
//		console.error('GM:CopyLink keydown exception: %o', exc);
//	}
//}, true);

///* Bubble up keyup (no over-ride document) phase */
//window.document.addEventListener('keydown', function(e) {
//	try {
//		/* Only active on Ctrl + C */
//		if(e.mods == CTRL && e.keyCode == VK_C) {
//			if(!isInputField(document.activeElement) && !hasDocumentSelection()) {
//				let clip = '<a href="'+window.location.href+'">'+document.title+'</a>';
//				GM_setClipboard(clip);
//				e.stopPropagation();
//				e.preventDefault();
//
////				console.log('gotcha: %s', clip);
//
//				ShowPanel('Page URL copied to clipboard:', clip);
//				//if(document && document.documentElement)
//				//	animate(document.documentElement, 'CopyThat_PageUrl_Copied');
//
//
////					console.log('keyup: %o', e);
////					console.log('keyup: activeElement=%o', document.activeElement);
//			}
//		}
//	} catch(exc) {
//		console.log('GM:CopyLink keydown exception: %o', exc);
//	}
//}, false);
//

/**
 *  @TODO: Add notion of capture/bubble phase Key Handlers, The current implementation expects all keybindings to be on capture, but an 'unhandled' Ctrl-C should default to 'copy url of page'
 *    after letting the page possibly handle it
 */

/**
 * @note: Because classes are not hoisted, this has to come at the bottom, why did they choose not to hoist!?
 * @type {*[]}
 */

const KeyCommands = [
	{ Class: TableOperations, mods: CTRL, Keys: [ 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End' ], },
	{ Class: TableOperations, mods: CTRL + SHIFT, Keys: [ 'D' ], },
	{ Class: BackslashHandler, Keys: [ '\\' ] },
	{ Class: CopyHandler, mods: CTRL, Keys: [ 'c', ] }
];

new (class KeyCommandRouter {
	constructor() {
		window.document.addEventListener('keydown', this.onKeyDown.bind(this), true);
	}

	onKeyDown(e) {
		e.mods = (e.ctrlKey) + (e.altKey << 1) + (e.shiftKey << 2);
		for(var cmd of KeyCommands) {
			if((cmd.mods || 0) == e.mods && cmd.Keys.indexOf(e.key) != -1) {
				if(!cmd.obj)
					cmd.obj = new cmd.Class();
				if(cmd.obj.Handle(e)) {
					e.stopPropagation();
					e.preventDefault();
					return;
				}
			}
		}
	}
});

/*
 |	Hover over SELECT[multiple] handling
 |		Shows the elements that are selected along with the count
 */

for(let elem of document.querySelectorAll('SELECT[multiple]')) {
	elem.addEventListener('mouseenter', function(e) {
		let tSelected  = Array.prototype.map.call(Array.from(e.target.selectedOptions), (opt) => opt.textContent.trim());
		e.target.title = `Selected: ${ e.target.selectedOptions.length } \n${ tSelected.join("\r\n") }`;
	});
}
