var lab_e = 0.008856
var lab_k = 903.3
var refU = 0.19784
var refV = 0.46834
var m = [
	    [3.2406, -1.5372, -0.4986],
	    [-0.9689, 1.8758, 0.0415],
	    [0.0557, -0.2040, 1.0570]
	];

function husl_palette(n_colors, h, s, l)
{
	// from Python module, Seaborn
	switch (arguments.length){ // emulate function overloading
	case 0:
		arguments[0] = 6;
		arguments[1] = 0.01;
		arguments[2] = 0.9;
		arguments[3] = 0.65;
	case 1:
		arguments[1] = 0.01;
		arguments[2] = 0.9;
		arguments[3] = 0.65;
	case 2:
		arguments[2] = 0.9;
		arguments[3] = 0.65;
	case 3:
		arguments[3] = 0.65;
	case 4:
	default:
	break;}

	huesPre = linspace(0, 1, n_colors + 1);
	hues = huesPre.slice(0, huesPre.length);

	for (var i = 0; i < hues.length; i++)
	{
		var newVal = hues[i] + h;
		newVal %= 1;
		newVal *= 359;
		hues[i] = newVal;
	}
	s *= 99;
	l *= 99;

	var palette = [];
	for (var i = 0; i < hues.length; i++)
	{
		var rgbArray = husl_to_rgb(hues[i], s, l);
		palette.push(rgbArray);
	}

	return palette;
}
function dark_palette(color, n_colors, reverse, input)
{
	// from Python module, Seaborn

	switch (arguments.length){ // emulate function overloading
	case 0:
		arguments[0] = "#000000";
		arguments[1] = 6;
		arguments[2] = false;
	case 1:
		arguments[1] = 6;
		arguments[2] = false;
	case 2:
		arguments[2] = false;
	case 3:
		arguments[3] = "rgb";
	case 4:
	default:
	break;}

	color = color_to_rgb(color, input);
	var gray = "#222222";
	var colors = [];
	if (reverse) { colors = [color, gray]; }
		else { colors = [gray, color]; }
	return blend_palette(colors, n_colors);
}
function light_palette(color, n_colors, reverse, input)
{
	// from Python module, Seaborn

	switch (arguments.length){ // emulate function overloading
	case 0:
		arguments[0] = "#000000";
		arguments[1] = 6;
		arguments[2] = false;
	case 1:
		arguments[1] = 6;
		arguments[2] = false;
	case 2:
		arguments[2] = false;
	case 3:
		arguments[3] = "rgb";
	case 4:
	default:
	break;}

	color = color_to_rgb(color, input);
	var light = set_hls_values(color, 0, 0.95, 0);
	if (reverse) { colors = [color, light]; }
		else { colors = [light, color]; }
	return blend_palette(colors, n_colors);
}

function husl_to_rgb(h, s, l)
{
	// from Python module, Seaborn
	var asLCH = husl_to_lch([h, s, l]);
	return lch_to_rgb(asLCH[0], asLCH[1], asLCH[2]);
}

function husl_to_lch(triple)
{
	// from Python module, Seaborn
	var H = triple[0];
	var S = triple[1];
	var L = triple[2];

	if (L > 99.9999999) { return [100, 0.0, H]; }
	if (L < 0.00000001) { return [0.0, 0.0, H]; }
	var mx = max_chroma(L, H);
	var C = mx / 100.0 * S;
	return [L, C, H];
}

function lch_to_rgb(l, c, h)
{
	// from Python module, Seaborn
	return xyz_to_rgb(luv_to_xyz(lch_to_luv([l, c, h])));
}

function lch_to_luv(triple)
{
	// from Python module, Seaborn
	var L = triple[0];
	var C = triple[1];
	var H = triple[2];

	var hRad = H / (Math.PI / 180);
	var U = Math.cos(hRad) * C;
	var V = Math.sin(hRad) * C;
	return [L, U, V];
}

function luv_to_xyz(triple)
{
	// from Python module, Seaborn
	var L = triple[0];
	var U = triple[1];
	var V = triple[2];

	if (L == 0) { return [0.0, 0.0, 0.0]; }
	var vY = f_inv((L + 16.0) / 116.0);
	var vU = U / (13.0 * L) + refU;
	var vV = V / (13.0 * L) + refV;

	var Y = vY * refY;
	var X = 0.0 - (9.0 * Y * vU) / ((vU - 4.0) * vV - vU * vV);
	var Z = (9.0 * Y - (15.0 * vV * Y) - (vV * X)) / (3.0 * vV);
	return [X, Y, Z];
}

function xyz_to_rgb(triple)
{
	// from Python module, Seaborn 
	//TODO
}

function f_inv(t)
{
	// from Python module, Seaborn
	if (Math.pow(t, 3.0) > lab_e) 
		{ return Math.pow(t, 3.0); }
	else
		{ return ((116.0 * t - 16.0) / lab_k); }
}

function from_linear(c)
{
	// from Python module, Seaborn
	if (c <= 0.0031308) 
		{ return 12.92 * c; }
	else
		{ return (1.055 * Math.pow(c, 1.0 / 2.4) - 0.055); }
}

function dot_product(a, b)
{
	// from Python module, Seaborn
	//TODO
}

function max_chroma(L, H)
{
	// from Python module, Seaborn
	var hRad = H / (Math.PI / 180);
	var sinH = Math.sin(hRad);
	var cosH = Math.sin(hRad);
	var sub1 = Math.pow(L + 16, 3.0) / 1560896.0;
	var sub2;
	if (sub1 > 0.008856) { sub2 = sub1; }
	else { sub2 = L / 903.3; }
	
	var result = Infinity;
	for (var i = 0; i < m.length; i++)
	{
		var m1 = m[i][0];
		var m2 = m[i][1];
		var m3 = m[i][2];

		var top = ((0.99915 * m1 + 1.05122 * m2 + 1.14460 * m3) * sub2);
		var rbottom = (0.86330 * m3 - 0.17266 * m2);
	    var lbottom = (0.12949 * m3 - 0.38848 * m1);
	    var bottom = (rbottom * sinH + lbottom * cosH) * sub2;

	    for (var j = 0; j < 1.0; j++) //TODO is this correct translation?
	    {
			var C = (L * (top - 1.05122 * t) / (bottom + 0.17266 * sinH * t));
			if (C > 0.0 && C < result) { result = C; }
	    }
	}

	return result;
}

function linspace(start, stop, number)
{
	//TODO test this! not a direct translation by any means!
	// based on Python module, NumPy (with more limited functionality)

	// Make sure input is a number.
	if (isNaN(start)) { return null; }
	if (isNaN(stop)) { return null; }
	if (isNaN(number)) { return null; }

	var num = Math.round(number);
	if (num < 0) { num = 0; } //TODO alternatively return error; number MUST be non-negative
	var div = num - 1;

	// Convert possible integers to floats.
	start *= 1.0;
	stop *= 1.0;

	// Return evenly spaced numbers over a specified interval.

	var stepping = (stop - start) / ((num * 1.0)-1);

	var result = [];
	for (var i = 0; i < num; i++)
	{
		result.push(start + (i*stepping));
	}

	return result;
}

function color_to_rgb(color, input)
{
	//from Python module, Seaborn
	//TODO make sure all functions provide appropriate parameters
	var color;
	if (input == "hls") { color = hls_to_rgb(color); }
	else if (input == "husl") { color = husl_to_rgb(color); }
	else if (input == "xkcd") { color = xkcd_rgb[color]; }
	return color
}

function hls_to_rgb(h, l, s)
{
	// from Python
	var m2;
	if (s == 0.0) { return [l, l, l]; }
	if (l <= 0.5) { m2 = l * (1.0*s); }
		else { m2 = l + s - (l*s); }
	var m1 = 2.0*l - m2;
	return [val_ue(m1, m2, h + (1.0/3.0)), val_ue(m1, m2, h), val_ue(m1, m2, h - (1.0/3.0))]; 

}
function val_ue(m1, m2, hue)
{
	// from Python
	hue %= 1.0;
	if (hue < (1.0/6.0))
		{ return m1 + (m2-m1)*hue*6.0; }
	if (hue < 0.5)
		{ return m2; }
	if (hue < (2.0/3.0))
		{ return m1 + (m2-m1)*((2.0/3.0) - hue)*6.0; }
	return m1;
}

function set_hls_values(color, h, l, s)
{
	// from Python module, Seaborn
	//TODO
}

function rgb_to_hls(r, g, b)
{
	// from Python
	var maxc = Math.max(r, g, b);
	var minc = Math.min(r, g, b);
	var maxMinP = maxc + minc;
	var maxMinS = maxc - minc;

	var l = (maxMinP) / 2.0;
	if (minc == maxc) { return [0.0, l, 0.0]; }

	var s;
	if (l <= 0.5) {s = maxMinS / maxMinP; }
	else {s = maxMinS / (2.0 - maxC - minC); }

	var rc = (maxc-r) / (maxMinS);
	var gc = (maxc-g) / (maxMinS);
	var bc = (maxc-b) / (maxMinS);

	var h;
	if (r == maxc) { h = bc-gc; }
	else if (g == maxc) { h = 2.0 + rc - bc; }
	else { h = 4.0 + gc - rc; }
	h = (h/6.0) % 1.0;

	return [h, l, s];
}

function flat_palette(color, n_colors, reverse)
{
	// from Python module, Seaborn

	switch (arguments.length){ // emulate function overloading
	case 0:
		arguments[0] = "#000000";
		arguments[1] = 6;
		arguments[2] = false;
	case 1:
		arguments[1] = 6;
		arguments[2] = false;
	case 2:
		arguments[2] = false;
	case 3:
	default:
	break;}

	color = color_to_rgb(color, "rgb");
	var flat = desaturate(color, 0);
	var colors = [];
	if (reverse) { colors = [color, flat]; }
		else { colors = [flat, color]; }
	return blend_palette(colors, n_colors);

}

function desaturate(color, prop)
{
	// from Python module, Seaborn

	var condition = Boolean(Boolean(prop >= 0) && Boolean(prop <= 1));

	if (!condition)
	{
		prop = 0.5; //TODO possibly raise error: "prop must be between 0 and 1"
	}

	// Converting color to RGB, then to HLS.
	var rgb = convertToRGB(ccolor);
	var hls = rgb_to_hls(rgb[0], rgb[1], rgb[2]);
	var h = hls[0];
	var l = hls[1]; 
	var s = hls[2];

	// Desaturating the saturation channel, then converting back to RGB.
	s *= prop
	var newColor = hls_to_rgb(h, l, s);
	return newColor;
}

function diverging_palette(h_neg, h_pos, s, l, n, center)
{
	// from Python module, Seaborn

	switch (arguments.length){ // emulate function overloading
	case 0:
		arguments[0] = 0;
		arguments[1] = 0;
		arguments[2] = 75;
		arguments[3] = 50;
		arguments[4] = 6;
		arguments[5] = "light";
	case 1:
		arguments[1] = 0;
		arguments[2] = 75;
		arguments[3] = 50;
		arguments[4] = 6;
		arguments[5] = "light";
	case 2:
		arguments[2] = 75;
		arguments[3] = 50;
		arguments[4] = 6;
		arguments[5] = "light";
	case 3:
		arguments[3] = 50;
		arguments[4] = 6;
		arguments[5] = "light";
	case 4:
		arguments[4] = 6;
		arguments[5] = "light";
	case 5:
		arguments[5] = "light";
	case 6:
	default:
	break;}

	var palFuncName = "";
	if (center == "dark") { palFuncName = "dark_palette"; }
	else { palFuncName = "light_palette"; }

	var sep = 10;
	var neg = window[palFuncName]([h_neg, s, l], (128 - (sep/2)), "true", "husl");
	var pos = window[palFuncName]([h_neg, s, l], (128 - (sep/2)), "false", "husl");

	var mid = [[0.95*sep, 0.95*sep, 0.95*sep, 1.0*sep],[0.133*sep, 0.133*sep, 0.133*sep, 1.0*sep]];
	return blend_palette(neg.concat(mid, pos), n);
}

function blend_palette(colors, n_colors, input)
{
	// from Python module, Seaborn

	switch (arguments.length){ // emulate function overloading
	case 0:
		arguments[0] = ["black"];
		arguments[1] = 6;
		arguments[2] = "rgb";
	case 1:
		arguments[1] = 6;
		arguments[2] = "rgb";
	case 2:
		arguments[3] = "rgb";
	case 3:
	default:
	break;}

	var colorsRGB = [];
	for (var i = 0; i < colors.length; i++)
	{
		colorsRGB[i] = color_to_rgb(colors[i], input);
	}

	var name = "blend";
	return linearSegmentedColorMapFromList(name, colorsRGB);

}

function linearSegmentedColorMapFromList(name, colors)
{
	// from Python module, Matplotlib, with more limited functionality

	var vals = linsp(0.0, 1.0, colors.length);

	var jsonText = '{ "dictArray" : ['

	for (var i = 0; i < colors.length; i++)
	{
		var r 

		var textToAdd = "";
		if (i != 0)
		{
			// add with start comma; else without
			textToAdd += ', ';
		}
		textToAdd += '{ "red": "' + /*red value*/;
		textToAdd += '", "green": "' + /*green value*/;
		textToAdd += '", "blue": "' + /*blue value*/;
		textToAdd += '", "alpha": "' + /*alpha value*/;
		textToAdd += '" }';

		jsonText += textToAdd;
	}
	jsonText += "] }";

	var cdict = JSON.parse(jsonText).dictArray;

	return linearSegmented(name, cdict, 256, 1.0);

}

function cubehelix_palette(n_colors, start, rot, gamma, hue, light, dark, reverse)
{
	// from Python module, Seaborn

	switch (arguments.length){ // emulate function overloading
	case 0:
		arguments[0] = 6;
		arguments[1] = 0;
		arguments[2] = 0.4;
		arguments[3] = 1.0;
		arguments[4] = 0.8;
		arguments[5] = 0.85;
		arguments[6] = 0.15;
		arguments[7] = false; 
	case 1:
		arguments[1] = 0;
		arguments[2] = 0.4;
		arguments[3] = 1.0;
		arguments[4] = 0.8;
		arguments[5] = 0.85;
		arguments[6] = 0.15;
		arguments[7] = false;
	case 2:
		arguments[2] = 0.4;
		arguments[3] = 1.0;
		arguments[4] = 0.8;
		arguments[5] = 0.85;
		arguments[6] = 0.15;
		arguments[7] = false;
	case 3:
		arguments[3] = 1.0;
		arguments[4] = 0.8;
		arguments[5] = 0.85;
		arguments[6] = 0.15;
		arguments[7] = false;
	case 4:
		arguments[4] = 0.8;
		arguments[5] = 0.85;
		arguments[6] = 0.15;
		arguments[7] = false;
	case 5:
		arguments[5] = 0.85;
		arguments[6] = 0.15;
		arguments[7] = false;
	case 6:
		arguments[6] = "0.15";
		arguments[7] = false; 
	case 7:
		arguments[7] = false; 
	case 8:
	default:
	break;}

	// this block (creation of rgbArray) from Python module, Matplotlib
	function get_color(po, p1) //TODO what is x?
	{
		var xg = Math.pow(x, gamma);
		var amplitude = (hue * xg * (1-xg)) / 2;
		var phi = 2 * Math.PI * ((start/3) + rot * x);
		return (xg + amplitude * (p0*Math.cos(phi) + p1*Math.sin(phi)));
	}

	//TODO this is incorrect: get_color is actually supposed to function as a "closure," i.e. a function that returns a function
	//so "red" in the array is actually a FUNCTION that TAKES x, as created by get_color(-0.14, 1.78)
	//rather than hard values
	var rgbArray = [(get_color(-0.14861, 1.78277)), //red		// result of mpl._cm.cubehelix(gamma, s, r, h)
		(get_color(-0.29277, -0.90649)),			// green
		(get_color(-1.97294, 0.0))];				// blue

	var cmap = linearSegmented("cubehelix", cdict);
	var x = linspace(light, dark, n_colors);

	//TODO basically all of this
	var pal;
	/*
	pal = cmap(x)[:, :3].tolist()      // [:] means whole string, [:3] means beginning up to but not including 3
    if reverse:
        pal = pal[::-1]
	*/

	return pal;

}
/*

/* //TODO remaining functions to translate/figure out
//ALSO NEED TO FIND
colorConverter.to_rgba(color) (from Matplotlib) ((JENNA SAYS: will call this convertToRGBA))
LinearSegmentedColormap(name, cdict, N, gamma) (from Matplob lib) ((JENNA SAYS: will call this linearSegmented))
//end need to find


color brewer palettes

def xyz_to_rgb(triple):
    xyz = map(lambda row: dot_product(row, triple), m)
    return list(map(from_linear, xyz))
def dot_product(a, b):
   	return sum(map(operator.mul, a, b))
def set_hls_values(color, h=None, l=None, s=None): ((JENNA SAYS: for JS implementation, setting h/l/s defaults to 0's))
    rgb = mplcol.colorConverter.to_rgb(color)
    vals = list(colorsys.rgb_to_hls(*rgb))
    for i, val in enumerate([h, l, s]):
        if val is not None:
            vals[i] = val

    rgb = colorsys.hls_to_rgb(*vals)
    return rgb


// defining colorConverter.to_rgb() ((JENNA SAYS: will call this convertToRGB))
// from Python module, Matplotlib
def to_rgb(self, arg):
        """
        Returns an *RGB* tuple of three floats from 0-1.

        *arg* can be an *RGB* or *RGBA* sequence or a string in any of
        several forms:

            1) a letter from the set 'rgbcmykw'
            2) a hex color string, like '#00FFFF'
            3) a standard name, like 'aqua'
            4) a string representation of a float, like '0.4',
               indicating gray on a 0-1 scale

        if *arg* is *RGBA*, the *A* will simply be discarded.
        """
        # Gray must be a string to distinguish 3-4 grays from RGB or RGBA.

        try:
            return self.cache[arg]
        except KeyError:
            pass
        except TypeError:  # could be unhashable rgb seq
            arg = tuple(arg)
            try:
                return self.cache[arg]
            except KeyError:
                pass
            except TypeError:
                raise ValueError(
                    'to_rgb: arg "%s" is unhashable even inside a tuple'
                    % (str(arg),))

        try:
            if cbook.is_string_like(arg):
                argl = arg.lower()
                color = self.colors.get(argl, None)
                if color is None:
                    str1 = cnames.get(argl, argl)
                    if str1.startswith('#'):
                        color = hex2color(str1)
                    else:
                        fl = float(argl)
                        if fl < 0 or fl > 1:
                            raise ValueError(
                                'gray (string) must be in range 0-1')
                        color = (fl,)*3
            elif cbook.iterable(arg):
                if len(arg) > 4 or len(arg) < 3:
                    raise ValueError(
                        'sequence length is %d; must be 3 or 4' % len(arg))
                color = tuple(arg[:3])
                if [x for x in color if (float(x) < 0) or (x > 1)]:
                    # This will raise TypeError if x is not a number.
                    raise ValueError(
                        'number in rbg sequence outside 0-1 range')
            else:
                raise ValueError(
                    'cannot convert argument to rgb sequence')

            self.cache[arg] = color

        except (KeyError, ValueError, TypeError) as exc:
            raise ValueError(
                'to_rgb: Invalid rgb arg "%s"\n%s' % (str(arg), exc))
            # Error messages could be improved by handling TypeError
            # separately; but this should be rare and not too hard
            # for the user to figure out as-is.
        return color
*/