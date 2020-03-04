// Number Format ~ %.2f
let nf = new Intl.NumberFormat('en-us', {
	minimumFractionDigits: 0,
	maximumFractionDigits: 2,
});

export function format(n) {
	return nf.format(n);
}

export function zscore(n, mean, stddev) {
	return (n - mean) / stddev;
}

export function clamp(n, bottom = 0.0, top = 1.0) {
	if(n < bottom)
		return bottom;
	if(n > top)
		return top;
	return n;
}


/**
 * Remaps a 0-1 number n to the range of start - end
 *
 * @param {Number} n
 * @param {Number} start
 * @param {Number} end
 *
 * @return {number}
 */
export function remap1(n, start, end) {
	return (end - start) * clamp(n) + start;
}

/**
 * Remaps a number n from start/end1 range to start/end2 range
 *
 * @param {Number} n
 * @param {Number} start1
 * @param {Number} end1
 * @param {Number} start2
 * @param {Number} end2
 *
 * @return {number}
 */
export function remap(n, start1, end1, start2, end2) {
	return start2 + ((end2 - start2) * ((n - start1) / (end1 - start1)));
}

/**
 *
 * @param {number} n
 * @param {Number[]} bands
 * @return {*}
 */
export function snap(n, bands) {
	if(isNaN(n))
		return 0;
	return bands.find((val, idx, bands) => {
		if(n < 0)
			return n <= val;
		if(idx === bands.length - 1)
			return true;
		return n < bands[idx + 1];
	});
}
