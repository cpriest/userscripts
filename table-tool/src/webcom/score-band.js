import {html, LitElement} from 'lit-element/lit-element.js';

export default class ScoreBand extends LitElement {

	static get properties() {
		return {
			bands:  { type: Array },
			scale:  { type: Number },
			colors: { type: Array },
		};
	}

	constructor() {
		super();
		this.bands  = [];
		this.scale  = 1.0;
		this.colors = [];
	}

	/**
	 * Returns a lit-html `TemplateResult`
	 */
	render() {
		return html`
			<!-- template content -->
			<STYLE>
				:host { display: inline-block; width: 200px; height: 100%; font-family: Verdana, sans-serif; font-size: 9px; font-weight: bold; }
				/*DIV { padding: 0px 4px; }*/
				DIV#main { display: flex; justify-content: space-between; padding: 0px; box-sizing: border-box; height: 100%; }
				DIV#main > DIV { display: inline-block; height: 100%; }
				DIV#main > DIV > SPAN { display: inline-block;  position: relative; top: 3px; }
				DIV#main > DIV > SPAN > SPAN { position: relative; }
			</STYLE>
			<DIV id="main">
				${this.bands.map((i, idx) => html`
					<div style="${this.getBandStyle(idx)}">
						<span>
							<span style="left: ${(Math.sign(i) * -1 * 50)}%;">${this.format(i * this.scale)}</span>
						</span>
					</div>
				`)}
			</DIV>
		`;
	}

	/**
	 * Returns the flex size for the given band index
	 * @param {number} idx
	 * @return {number}
	 */
	getFlexSize(idx) {
		if(idx == 0 || idx == this.bands.length - 1)
			return Math.abs(this.bands[idx] * this.scale);
		if(this.bands[idx] == 0) {
			return Math.abs(this.bands[idx-1] * this.scale) + Math.abs(this.bands[idx+1] * this.scale);
		}
		return Math.abs(this.bands[idx] * this.scale);
	}

	/**
	 * Gets the inline style for the given band index
	 * @param {number} idx
	 * @return {string}
	 */
	getBandStyle(idx) {
		let styles = [];

		if(this.bands[idx] < 0)
			styles.push(`text-align: right;`);
		else if(this.bands[idx] > 0)
			styles.push(`text-align: left;`);
		else
			styles.push(`text-align: center;`);

		styles.push(`flex: ${this.getFlexSize(idx)};`);
		styles.push(`background-color: ${this.colors[idx]};`)

		return styles.join(' ');
	}

	format(i) {
		if(i == 0)
			return 0;

		return new Intl.NumberFormat('en-us', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 1,
		}).format(i);
	}
}

// Register the new element with the browser.
customElements.define('score-band', ScoreBand);
