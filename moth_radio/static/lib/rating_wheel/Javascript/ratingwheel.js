var rating_wheel = {};

//TODO delete
alert("V53");

rating_wheel.continuous =
{
	wheel: function(bigR, c, s, fontInfo, catInfo)
	{
		var wheelCon = function(bigR, c, s, fontInfo, catInfo)
		{
			//NOTES
			/*
				bigR = radius of entire plot
				c = number of concept categories ("families")
				s = minimum space between circle and text (pixels)
				fontFam = for text labels, font family name, from CSS standards
				fontSize = for text labels, font size
			*/

			//indicate originally created as discrete wheel
			this.orient = "continuous";
			
			//user-provided parameters
			this.bigR = bigR;
			this.c = c;
			this.s = s;
			this.fontFam = fontInfo.family;
			this.fontSize = fontInfo.size;
			this.catInfo = catInfo;
			
			//default values
			this.centralColor = "white";
			this.effect = [];
			this.effect["select"] = "click";
			this.effect["center"] = 0.20;
			this.effect["preview"] = true; 
			
			var textPos = []; // array of arrays that stores coordinates for each category name textbook as [x, y]
			var arcPoints = []; // array of arrays, where each entry is a point such that index 0=start theta, 1=end theta, 2=cat

			for (var n = 0; n < c; n++)
			{
				var trigVal = ((2 * Math.PI) / c) * n;
				var trigValNext = ((2 * Math.PI) / c) * (n+1);

				var textX = ((bigR + s) * Math.cos(trigVal)) + bigR;
				var textY = ((bigR + s) * Math.sin(trigVal)) + bigR;

				if (textX < 0) {textX = 0; }
				if (textY < 0) {textY = 0; }
				textPos.push([textX, textY]);

				arcPoints.push([trigVal * (180 / Math.PI), (trigValNext * (180 / Math.PI)), n]);	
			}
			
			var textConvert = rating_wheel.etc.toJSON(textPos, "text");
			var arcConvert = rating_wheel.etc.toJSON(arcPoints, "arcs");
			this.allPoints = {arcs:arcConvert, text:textConvert};
		}
		return new wheelCon(bigR, c, s, fontInfo, catInfo);
	}
}

rating_wheel.discrete =
{
	wheel: function(bigR, c, t, p, g, s, q, fontInfo, catInfo)
	{
		var wheelCon = function(bigR, c, t, p, g, s, q, fontInfo, catInfo)
		{
			//NOTES
			/*
				bigR = radius of entire plot
				c = number of concept categories ("families")
				t = number of intensities/levels
				p = ratio of (circle area / next biggest circle area)
				g = gap between category sectors, as [(gap size) / (circle size * c)]
				s = minimum space between intensity levels (pixels)
				q = center "blank" circle size, as percent change from outermost radius size
				fontFam = for text labels, font family name, from CSS standards
				fontSize = for text labels, font size
			*/

			//indicate originally created as discrete wheel
			this.orient = "discrete";
			
			//user-provided parameters
			this.bigR = bigR;
			this.c = c;
			this.t = t;
			this.p = p;
			this.g = g;
			this.s = s;
			this.q = q;
			this.fontFam = fontInfo.family;
			this.fontSize = fontInfo.size;
			this.catInfo = catInfo;

			//default "advanced" values used in calculations
			/*
				values not adjustable in GUI
				precisionR = increments of percentage points to decrease radius
					when checking overlap
				precisionS = increments of percentage points to decrease space
					when checking overspacing
			*/
			this.precisionR = 0.05;
			this.precisionS = 0.05;
			this.spacePadding = 0.1;
			this.expFactor = 1.2;

			//values calculated from parameters
			var sumVal = 0;
			for (i = 0; i < t+1; i++)
			{
				sumVal += 2 * Math.pow(p, i);
			}
			this.r = ((bigR - (s*t) - s) / (sumVal + (1+q)))
			
			this.trigVal = (2 * Math.PI) / this.c;

			//overlap and spacing scaling functions
			this.overspaceScaleCalc = function()
			{
				var obj = this; //is this good?
				//checks over-spacing
				//returns array of position value scaling

				checkSpacing = function(distance, layer, increment)
				{
					var outerRad = obj.r * Math.pow(obj.r, layer);
					var innerRad = obj.r * Math.pow(obj.r, layer+1);
					var maxSpace = outerRad + (obj.s * (1+obj.spacePadding)) + innerRad;

					var distScale = distance * (1 - (increment*obj.precisionS));

					if (distScale <= maxSpace)
					{
						return true;
					}
					else
					{
						return false;
					}
				}

				var scaling = [];
				for (var i = 0; i < this.t + 1; i++)
				{
					var outRad = this.r * Math.pow(this.p, i*this.expFactor);
					var inRad = this.r * Math.pow(this.p, (i+1)*this.expFactor);
					var outZ = rating_wheel.math.summation(i, this.r, this.p, this.s) + this.r;
						if (i == 0) { outZ = this.r + this.s; }
					var inZ = rating_wheel.math.summation(i+1, this.r, this.p, this.s) + this.r;
					
					var outX = (this.bigR - outZ) * Math.cos(this.trigVal);
					var outY = (this.bigR - outZ) * Math.sin(this.trigVal);
					var inX = (this.bigR - inZ) * Math.cos(this.trigVal);
					var inY = (this.bigR - inZ) * Math.sin(this.trigVal)

					var increment = 0;
					var condition = true;
					while (condition)
					{

						var eval = checkSpacing(rating_wheel.math.distance(outX, outY, inX, inY), i, increment);

						if (eval)
						{
							condition = false;
						}
						else
						{
							increment++;
						}
					}

					scaling[i] = 1 - (increment * this.precisionS);

				}
				return scaling;
			}
			this.spacingScl = this.overspaceScaleCalc();

			this.overlapScaleCalc = function()
			{
				var obj = this;
				checkOverlap = function(distance, layer, increment)
				{
					//check for overlapping circles
					var origRad = obj.r * Math.pow(obj.p, layer * obj.expFactor);
					var multiplier = 1 - (increment * obj.precisionR);

					var layerCircum = 0;
					if (layer == 0)
					{
						layerCircum = 2 * Math.PI * (obj.bigR - obj.r);
					}
					else
					{
						layerCircum = 2 * Math.PI * (obj.bigR - rating_wheel.math.summation(layer, obj.r, obj.p, obj.s) - obj.r);
					}

					var gap = obj.g * layerCircum;
					var needSpace = (2 * origRad * multiplier) + gap;

					if (distance >= needSpace)
					{
						return true;
					}
					else
					{
						return false;
					}				
				}

				//returns array of radius scaling
				var scaling = [];
				for (var i = 0; i < this.t + 1; i++)
				{
					var outRad = this.r * Math.pow(this.p, i*this.expFactor);
					var z = rating_wheel.math.summation(i, this.r, this.p, this.s) + this.r;
						if (i == 0) { z = this.r + this.s; }
					
					var x1 = (this.bigR - z) * this.spacingScl[i];
					var y1 = 0;
					var x2 = (this.bigR - z) * Math.cos(this.trigVal) * this.spacingScl[i];
					var y2 = (this.bigR - z) * Math.sin(this.trigVal) * this.spacingScl[i];

					var increment = 0;
					var condition = true;
					while (condition)
					{
						var eval = checkOverlap(rating_wheel.math.distance(x1, y1, x2, y2), i, increment);
						if (eval)
						{
							condition = false;
						}
						else
						{
							increment++;
						}
					}
					scaling[i] = 1 - (increment * this.precisionS);
				}
				return scaling;
			}
			this.radiusScl = this.overlapScaleCalc();
	
			this.points = function()
			{
				var circlePoints = [];
				var textPositions = [];
				for (var n = 0; n < this.c; n++)
				{
					var textX = ((this.bigR + this.s) * Math.cos(this.trigVal*n) * this.spacingScl[0]) + this.bigR;
					var textY = ((this.bigR + this.s) * Math.sin(this.trigVal*n) * this.spacingScl[0]) + this.bigR;

					if (textX < 0) { textX = 0; }
					if (textY < 0) { textY = 0; }
					textPositions.push([textX, textY]);
				
					for (var l = 0; l < this.t+1; l++)
					{
						var radius = this.r * Math.pow(this.p, l*this.expFactor) * this.radiusScl[l];
						var z = rating_wheel.math.summation(l, this.r, this.p, this.s) + this.r;
							if (l == 0) { z = this.r + this.s; }

						var x = ((this.bigR - z) * Math.cos(this.trigVal*n) * this.spacingScl[l]) + this.bigR;
						var y = ((this.bigR - z) * Math.sin(this.trigVal*n) * this.spacingScl[l]) + this.bigR;

						circlePoints.push([radius, x, y, n, l]);
					}			
				}
				var circleConvert = rating_wheel.etc.toJSON(circlePoints, "circles");
				var textConvert = rating_wheel.etc.toJSON(textPositions, "text");
				var allPoints = {circles:circleConvert, text:textConvert};
				return allPoints;
			}
			this.allPoints = this.points();
		};
		return new wheelCon(bigR, c, t, p, g, s, q, fontInfo, catInfo);
	}
}

rating_wheel.render =
{

	finddiv: function()
	{
		//NOTES: can change this value to change the div that is designated for the rating_wheel
		var targetID = "rating_wheel";
		
		var targetDiv = d3.select("body").selectAll("div").filter(function()
		{
			return d3.select(this).attr("id") == targetID;
		});
		return targetDiv;
	},

	go: function(wheelObj)
	{
		var orient = wheelObj.orient;
		
		if (orient == "discrete")
		{
			rating_wheel.render.discrete(wheelObj);
		}
		else if (orient == "continuous")
		{
			rating_wheel.render.continuous(wheelObj);
		}
		else
		{
			//TODO error?
		}
	},

	continuous: function(wheelObj)
	{
		var divToPlace = rating_wheel.render.finddiv();
		var svgContainer = divToPlace.append("svg");
		var arcData = wheelObj.allPoints.arcs;
		var textData = wheelObj.allPoints.text;
		var catInfo = wheelObj.catInfo;
				
		var texts = svgContainer.append("g")
			.selectAll("text")
			.data(textData)
			.enter().append("text");
		var textsAtt = texts
			.text(function (d, i) {
				return catInfo[i].name; })
			.attr("x", function (d, i) { return d.x;})
			.attr("y", function (d) { return d.y; })
			.style("fill", "black")
			.style("font-family", wheelObj.fontFam)
			.style("font-size", wheelObj.fontSize);

		var maxTextHeight = 0;
		var maxTextWidth = 0;		
		texts.each(function() 
		{
		    if (this.getBBox().height > maxTextHeight)
		    {
		    	maxTextHeight = this.getBBox().height;
		    }
		    if (this.getBBox().width > maxTextWidth)
		    {
		    	maxTextWidth = this.getBBox().width;
		    }
		});
		
		var svgContainerTransform = svgContainer
			.attr("width", (wheelObj.bigR * 2) + 3*maxTextWidth)
			.attr("height", (wheelObj.bigR * 2) + 3*maxTextHeight);

		var fourthOfCats = Math.round((wheelObj.c+1)/4);
		var textsTransform = texts
			.attr("x", function(d, i) {
				var thisWidth = this.getBBox().width / 2;
				if (i > fourthOfCats && i < wheelObj.c - fourthOfCats)
				{
					var difference = -thisWidth + maxTextWidth/2;
					return d.x + difference;
				}
				else if (i != fourthOfCats && i != wheelObj.c - fourthOfCats)
				{
					var summed = thisWidth + maxTextWidth/2;
					return d.x + summed;
				}
				else
				{
					return d.x + (maxTextWidth*0.75 - thisWidth);
				}
			})
			.attr("y", function(d, i) {
				return d.y + maxTextHeight;
			});

		var overallCenterX = wheelObj.bigR + (maxTextWidth*0.75);
		var overallCenterY = wheelObj.bigR + maxTextHeight;
		
		// create gradients for each category
		var gradients = svgContainer.append("defs");
		for (var i = 0; i < wheelObj.c; i++)
		{
			var colorName = "coloration-" + i; //gradient going from main color to central color

			//coloration
			var coloration = gradients.append("radialGradient")
				.attr("id", colorName)
				.attr("cx", "50%")
				.attr("fx", "50%")
				.attr("cy", "50%")
				.attr("fy", "50%")
				.attr("r", "45%")
				.attr("spreadMethod", "pad");
			coloration.append("stop")
				.attr("offset", "0%")
				.attr("stop-color", wheelObj.centralColor)
				.attr("stop-opacity", 1);
			coloration.append("stop")
				.attr("offset", "100%")
				.attr("stop-color", catInfo[i].color)
				.attr("stop-opacity", 1);
		}		
		
		// draw arcs representing each category's sector, for on-hover use
		var rotRad = Math.PI / 2; // rotation (in rad) beyond default d3 arc function
		var arcClipsFull = svgContainer.append("defs")
			.selectAll("clipPath")
			.data(arcData).enter()
			.append("clipPath")
			.attr("id", function(d, i)
				{
					return "clip-full-" + i;
				});
		arcClipsFull.each(function(d, i)
		{
			var thisClip = d3.select(this);
			
			var fullArc = d.end - d.start;
			var newStart = d.start - (fullArc/2);
			var newEnd = d.end - (fullArc/2);
			newStart *= (Math.PI / 180);
			newEnd *= (Math.PI / 180);

			var newArc = d3.arc()
				.innerRadius(0)
				.outerRadius(wheelObj.bigR - wheelObj.s)
				.startAngle(newStart + rotRad)
				.endAngle(newEnd + rotRad);

			var thisArc = thisClip.append("path")
				.attr("d", newArc());
		});
		var transString = "translate(" + (wheelObj.bigR + (maxTextWidth*0.75)) + "," + (wheelObj.bigR + maxTextHeight) + ")";
		arcClipsFull.attr("transform", transString);
		
		var ratingArcs = svgContainer.append("g");
		var arcColors = ratingArcs
			.selectAll("circle")
			.data(arcData).enter()
			.append("circle")
			.attr("cx", overallCenterX)
			.attr("cy", overallCenterY)
			.attr("r", wheelObj.bigR)
			.style("clip-path", function(d, i)
				{
					return "url(#clip-full-" + i + ")";
				})
			.style("fill", function(d, i)
				{
					return "url(#coloration-" + i + ")";
				})
			.style("fill-opacity", 1);
		var preview = ratingArcs
			.append("circle")
			.attr("cx", overallCenterX)
			.attr("cy", overallCenterY)
			.attr("r", wheelObj.bigR*0.5)
			.attr("id", "preview")
			.style("fill", "none")
			.style("stroke", "black")
			.style("stroke-width", 3);
		var arcTrack = ratingArcs
			.selectAll("path")
			.data(arcData).enter()
			.append("path")
			.attr("d", function(d, i)
				{
					var fullArc = d.end - d.start;
					var newStart = d.start - (fullArc/2);
					var newEnd = d.end - (fullArc/2);
					newStart *= (Math.PI / 180);
					newEnd *= (Math.PI / 180);

					var newArc = d3.arc()
						.innerRadius(0)
						.outerRadius(wheelObj.bigR + wheelObj.s)
						.startAngle(newStart + rotRad)
						.endAngle(newEnd + rotRad);

					return newArc();
				})
			.style("fill", "black")
			.style("fill-opacity", 0)
			.attr("transform", transString);
			//TODO: mouse events go on these ones

		rating_wheel.render.selectCont(arcTrack, wheelObj);
	},
	
	discrete: function(wheelObj)
	{
		var divToPlace = rating_wheel.render.finddiv();
		var svgContainer = divToPlace.append("svg");
		var circleData = wheelObj.allPoints.circles;
		var textData = wheelObj.allPoints.text;
		var catInfo = wheelObj.catInfo;

		var circles = svgContainer.append("g")
			.selectAll("circle")
			.data(circleData)
			.enter().append("circle");
		var circlesAtt = circles
			.attr("cx", function (d) { return d.x_pos; })
			.attr("cy", function (d) { return d.y_pos; })
			.attr("r", function (d) { return d.radius; })
			.style("fill", function (d) {
				return catInfo[d.cat].color; });
		
		var texts = svgContainer.append("g")
			.selectAll("text")
			.data(textData)
			.enter().append("text");
		var textsAtt = texts
			.text(function (d, i) {
				return catInfo[i].name; })
			.attr("x", function (d, i) { return d.x;})
			.attr("y", function (d) { return d.y; })
			.style("fill", "black")
			.style("font-family", wheelObj.fontFam)
			.style("font-size", wheelObj.fontSize);

		var maxTextHeight = 0;
		var maxTextWidth = 0;
		texts.each(function() 
		{
		    if (this.getBBox().height > maxTextHeight)
		    {
		    	maxTextHeight = this.getBBox().height;
		    }
		    if (this.getBBox().width > maxTextWidth)
		    {
		    	maxTextWidth = this.getBBox().width;
		    }
		});

		var svgContainerTransform = svgContainer
			.attr("width", (wheelObj.bigR * 2) + wheelObj.r + 3*maxTextWidth)
			.attr("height", (wheelObj.bigR * 2) + wheelObj.r + 3*maxTextHeight);

		var fourthOfCats = Math.round((wheelObj.c+1)/4);
		var textsTransform = texts
			.attr("x", function(d, i) {
				var thisWidth = this.getBBox().width / 2;
				if (i > fourthOfCats && i < wheelObj.c - fourthOfCats)
				{
					var difference = -thisWidth + maxTextWidth/2;
					return d.x + difference;
				}
				else if (i != fourthOfCats && i != wheelObj.c - fourthOfCats)
				{
					var summed = thisWidth + maxTextWidth/2;
					return d.x + summed;
				}
				else
				{
					return d.x + (maxTextWidth*0.75 - thisWidth);
				}
			})
			.attr("y", function(d, i) {
				return d.y + maxTextHeight;
			});
		
		var circlesTransform = circles
			.attr("cx", function(d, i)
				{
					return d.x_pos + (maxTextWidth*0.75);
				})
			.attr("cy", function(d, i)
				{
					return d.y_pos + maxTextHeight;
				});
	},
	
	selectCont: function(arcTrackObj, wheelObj)
	{
		var selectVal = wheelObj.effect.select;
		var previewVal = wheelObj.effect.preview;

		var activeCatTrack = -1;

		var circlePrev = d3.selectAll("circle").filter(function(d)
		{
			return d3.select(this).attr("id") == "preview";
		});
		if (!previewVal)
		{
			circlePrev.remove();
		}

		var move = (function()
		{
			return function(d)
			{
				var coords = d3.mouse(this);
				var newR = rating_wheel.math.distance(coords[0], coords[1], 0, 0);
					if (newR > (wheelObj.bigR - wheelObj.s)) 
						{ newR = wheelObj.bigR - wheelObj.s; }
					else if (newR < wheelObj.bigR * wheelObj.effect.center)
						{ newR = wheelObj.bigR * wheelObj.effect.center; }

				if (selectVal == "drag")
				{
					if (activeCatTrack != -1)
					{
						var circleCat = d3.selectAll("circle").filter(function(d)
						{
							if (d3.select(this).attr("id") != "preview")
							{
								return d.cat == activeCatTrack;
							}
						});
						circleCat.attr("r", newR);
					}
				}

				if (previewVal)
				{
					circlePrev.attr("r", newR);
					if (circlePrev.attr("r") > wheelObj.bigR - wheelObj.r) { circlePrev.attr("r", wheelObj.bigR - wheelObj.r); }
				}
			}
		})();

		var click = (function()
		{
			return function(d)
			{
				var coords = d3.mouse(this);
				var newR = rating_wheel.math.distance(coords[0], coords[1], 0, 0);
					if (newR > (wheelObj.bigR - wheelObj.s)) 
						{ newR = wheelObj.bigR - wheelObj.s; }
					else if (newR < wheelObj.bigR * wheelObj.effect.center)
						{ newR = wheelObj.bigR * wheelObj.effect.center; }

				if (selectVal == "click")
				{
					var thisData = d3.select(this).datum();
					var thisCat = thisData.cat;

					var circleCat = d3.selectAll("circle").filter(function(d)
						{
							if (d3.select(this).attr("id") != "preview")
							{
								return d.cat == thisCat;
							}
						});
					circleCat.attr("r", newR);
				}
			}
		})();

		var down = (function()
		{
			return function(d)
			{
				if(selectVal == "drag")
				{
					activeCatTrack = d.cat;
				}				
			}
		})();
		var up = (function()
		{
			return function(d)
			{
				if(selectVal == "drag")
				{
					activeCatTrack = -1;
				}
			}
		})();

		arcTrackObj
			.on("mousedown", down)
			.on("mousemove", move)
			.on("mouseup", up)
			.on("click", click);
	}
}

rating_wheel.math =
{
	summation: function(l,r,p,s)
	{
		var result = 0;
		for (var k = 0; k < l+1; k++)
		{
			var term = 2 * r * Math.pow(p, k);
			result += term;
		}
		result += s * (l-1);
		result += Math.pow(p, l-1);
		return result;
	},

	distance: function(x1, y1, x2, y2)
	{
		// finds distance between points (x1, y1) and (x2, y2)
		return Math.pow((Math.pow((x2-x1), 2) + Math.pow((y2-y1), 2)), 0.5);
	}
}

rating_wheel.etc =
{
	toJSON: function(thisArray, identifier)
	{
		var jsonText = '{ "entries" : [';
		//identifier accepted as "circles" or "text"
		if (identifier == "circles")
		{
			for (var iter = 0; iter < thisArray.length; iter++)
			{
				var toAdd = '{ "radius":' + thisArray[iter][0];
				toAdd += ' , "x_pos":' + thisArray[iter][1];
				toAdd += ' , "y_pos":' + thisArray[iter][2];
				toAdd += ' , "cat":' + thisArray[iter][3];
				toAdd += ' , "intens":' + thisArray[iter][4];
				if (iter == thisArray.length - 1)
				{
					toAdd += "} ";
				}
				else
				{
					toAdd += '}, ';
				}
				jsonText += toAdd;
			}
		}
		else if (identifier == "text")
		{
			for (var iter = 0; iter < thisArray.length; iter++)
			{
				var toAdd = '{ "x":' + thisArray[iter][0];
				toAdd += ' , "y":' + thisArray[iter][1];
				if (iter == thisArray.length - 1)
				{
					toAdd += "} ";
				}
				else
				{
					toAdd += '}, ';
				}
				jsonText += toAdd;
			}			
		}
		else if (identifier == "arcs")
		{
			for (var iter = 0; iter < thisArray.length; iter++)
			{
				var toAdd = '{ "start":' + thisArray[iter][0];
				toAdd += ' , "end":' + thisArray[iter][1];
				toAdd += ' , "cat":' + thisArray[iter][2];
				if (iter == thisArray.length - 1)
				{
					toAdd += "} ";
				}
				else
				{
					toAdd += '}, ';
				}
				jsonText += toAdd;
			}
		}
		
		jsonText += ']}';
		var jsonObj = JSON.parse(jsonText);
		return jsonObj.entries;
	},
	
	font: function(size, family)
	{
		//renders font information as an array usable by "create"

		//TODO: check validity of family input
		var familyCorr = family; //TODO: remove after fix

		return {size:size, family:familyCorr};
	},

	categories: function(names, colors)
	{
		//renders category information as an array usable by "create"
		if (names.length == null || colors.length == null)
		{
			// if these are not arrays
			return null;
		}
		else if (names.length != colors.length)
		{
			// if these are not of equal size
			return null;
		}
		else
		{
			var combined = [];
			for (var i = 0; i < names.length; i++)
			{
				//TODO: check validity of color input
				var colorCorr = colors[i]; //TODO: remove after fix

				combined.push({name: names[i], color: colorCorr});
			}
			return combined;
		}
	}
}