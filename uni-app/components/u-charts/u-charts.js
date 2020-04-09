/*
 * uCharts v1.7.0.20190713
 * uni-app平台高性能跨全端图表，支持H5、APP、小程序（微信/支付宝/百度/头条）
 * Copyright (c) 2019 QIUN秋云 https://www.ucharts.cn All rights reserved.
 * Licensed ( http://www.apache.org/licenses/LICENSE-2.0 )
 * 
 * uCharts官方网站
 * https://www.uCharts.cn
 * 
 * 开源地址:
 * https://gitee.com/uCharts/uCharts
 * 
 * uni-app插件市场地址：
 * http://ext.dcloud.net.cn/plugin?id=271
 * 
 * 
 */

'use strict';

var config = {
	yAxisWidth: 15,
	yAxisSplit: 5,
	xAxisHeight: 15,
	xAxisLineHeight: 15,
	legendHeight: 15,
	yAxisTitleWidth: 15,
	padding: 12,
	pixelRatio: 1, //适配H5高分屏
	rotate: false, //横屏模式
	columePadding: 3,
	fontSize: 13,
	//dataPointShape: ['diamond', 'circle', 'triangle', 'rect'],
	dataPointShape: ['circle', 'circle', 'circle', 'circle'], //仿F2图例样式改为圆点
	colors: ['#1890ff', '#2fc25b', '#facc14', '#f04864', '#8543e0', '#90ed7d'],
	pieChartLinePadding: 15,
	pieChartTextPadding: 5,
	xAxisTextPadding: 3,
	titleColor: '#333333',
	titleFontSize: 20,
	subtitleColor: '#999999',
	subtitleFontSize: 15,
	toolTipPadding: 3,
	toolTipBackground: '#000000',
	toolTipOpacity: 0.7,
	toolTipLineHeight: 20,
	radarGridCount: 3,
	radarLabelTextMargin: 15,
	gaugeLabelTextMargin: 15
};

// Object.assign polyfill
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
function assign(target, varArgs) {
	if (target == null) {
		// TypeError if undefined or null
		throw new TypeError('Cannot convert undefined or null to object');
	}

	var to = Object(target);

	for (var index = 1; index < arguments.length; index++) {
		var nextSource = arguments[index];

		if (nextSource != null) {
			// Skip over if undefined or null
			for (var nextKey in nextSource) {
				// Avoid bugs when hasOwnProperty is shadowed
				if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
					to[nextKey] = nextSource[nextKey];
				}
			}
		}
	}
	return to;
}

var util = {
	toFixed: function toFixed(num, limit) {
		limit = limit || 2;
		if (this.isFloat(num)) {
			num = num.toFixed(limit);
		}
		return num;
	},
	isFloat: function isFloat(num) {
		return num % 1 !== 0;
	},
	approximatelyEqual: function approximatelyEqual(num1, num2) {
		return Math.abs(num1 - num2) < 1e-10;
	},
	isSameSign: function isSameSign(num1, num2) {
		return Math.abs(num1) === num1 && Math.abs(num2) === num2 || Math.abs(num1) !== num1 && Math.abs(num2) !== num2;
	},
	isSameXCoordinateArea: function isSameXCoordinateArea(p1, p2) {
		return this.isSameSign(p1.x, p2.x);
	},
	isCollision: function isCollision(obj1, obj2) {
		obj1.end = {};
		obj1.end.x = obj1.start.x + obj1.width;
		obj1.end.y = obj1.start.y - obj1.height;
		obj2.end = {};
		obj2.end.x = obj2.start.x + obj2.width;
		obj2.end.y = obj2.start.y - obj2.height;
		var flag = obj2.start.x > obj1.end.x || obj2.end.x < obj1.start.x || obj2.end.y > obj1.start.y || obj2.start.y <
			obj1.end.y;

		return !flag;
	}
};

//兼容H5点击事件
function getH5Offset(e) {
	e.mp={changedTouches:[]};
	e.mp.changedTouches.push({x:e.offsetX,y:e.offsetY});
	return e;
}

// hex 转 rgba
function hexToRgb(hexValue, opc) {
	var rgx = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	var hex = hexValue.replace(rgx, function(m, r, g, b) {
		return r + r + g + g + b + b;
	});
	var rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	var r = parseInt(rgb[1], 16);
	var g = parseInt(rgb[2], 16);
	var b = parseInt(rgb[3], 16);
	return 'rgba(' + r + ',' + g + ',' + b + ',' + opc + ')';
}

function findRange(num, type, limit) {
	if (isNaN(num)) {
		throw new Error('[wxCharts] unvalid series data!');
	}
	limit = limit || 10;
	type = type ? type : 'upper';
	var multiple = 1;
	while (limit < 1) {
		limit *= 10;
		multiple *= 10;
	}
	if (type === 'upper') {
		num = Math.ceil(num * multiple);
	} else {
		num = Math.floor(num * multiple);
	}
	while (num % limit !== 0) {
		if (type === 'upper') {
			num++;
		} else {
			num--;
		}
	}

	return num / multiple;
}

function calCandleMA(dayArr, nameArr, colorArr, kdata) {
	let seriesTemp = [];
	for (let k = 0; k < dayArr.length; k++) {
		let seriesItem = {
			data: [],
			name: nameArr[k],
			color: colorArr[k]
		};
		for (let i = 0, len = kdata.length; i < len; i++) {
			if (i < dayArr[k]) {
				seriesItem.data.push(null);
				continue;
			}
			let sum = 0;
			for (let j = 0; j < dayArr[k]; j++) {
				sum += kdata[i - j][1];
			}
			seriesItem.data.push(+(sum / dayArr[k]).toFixed(3));
		}
		seriesTemp.push(seriesItem);
	}
	return seriesTemp;
}

function calValidDistance(distance, chartData, config, opts) {

	var dataChartAreaWidth = opts.width - config.padding - chartData.xAxisPoints[0];
	var dataChartWidth = chartData.eachSpacing * opts.categories.length;
	var validDistance = distance;
	if (distance >= 0) {
		validDistance = 0;
	} else if (Math.abs(distance) >= dataChartWidth - dataChartAreaWidth) {
		validDistance = dataChartAreaWidth - dataChartWidth;
	}
	return validDistance;
}

function isInAngleRange(angle, startAngle, endAngle) {
	function adjust(angle) {
		while (angle < 0) {
			angle += 2 * Math.PI;
		}
		while (angle > 2 * Math.PI) {
			angle -= 2 * Math.PI;
		}

		return angle;
	}

	angle = adjust(angle);
	startAngle = adjust(startAngle);
	endAngle = adjust(endAngle);
	if (startAngle > endAngle) {
		endAngle += 2 * Math.PI;
		if (angle < startAngle) {
			angle += 2 * Math.PI;
		}
	}

	return angle >= startAngle && angle <= endAngle;
}

function calRotateTranslate(x, y, h) {
	var xv = x;
	var yv = h - y;

	var transX = xv + (h - yv - xv) / Math.sqrt(2);
	transX *= -1;

	var transY = (h - yv) * (Math.sqrt(2) - 1) - (h - yv - xv) / Math.sqrt(2);

	return {
		transX: transX,
		transY: transY
	};
}

function createCurveControlPoints(points, i) {

	function isNotMiddlePoint(points, i) {
		if (points[i - 1] && points[i + 1]) {
			return points[i].y >= Math.max(points[i - 1].y, points[i + 1].y) || points[i].y <= Math.min(points[i - 1].y, points[
				i + 1].y);
		} else {
			return false;
		}
	}

	var a = 0.2;
	var b = 0.2;
	var pAx = null;
	var pAy = null;
	var pBx = null;
	var pBy = null;
	if (i < 1) {
		pAx = points[0].x + (points[1].x - points[0].x) * a;
		pAy = points[0].y + (points[1].y - points[0].y) * a;
	} else {
		pAx = points[i].x + (points[i + 1].x - points[i - 1].x) * a;
		pAy = points[i].y + (points[i + 1].y - points[i - 1].y) * a;
	}

	if (i > points.length - 3) {
		var last = points.length - 1;
		pBx = points[last].x - (points[last].x - points[last - 1].x) * b;
		pBy = points[last].y - (points[last].y - points[last - 1].y) * b;
	} else {
		pBx = points[i + 1].x - (points[i + 2].x - points[i].x) * b;
		pBy = points[i + 1].y - (points[i + 2].y - points[i].y) * b;
	}

	// fix issue https://github.com/xiaolin3303/wx-charts/issues/79
	if (isNotMiddlePoint(points, i + 1)) {
		pBy = points[i + 1].y;
	}
	if (isNotMiddlePoint(points, i)) {
		pAy = points[i].y;
	}

	return {
		ctrA: {
			x: pAx,
			y: pAy
		},
		ctrB: {
			x: pBx,
			y: pBy
		}
	};
}

function convertCoordinateOrigin(x, y, center) {
	return {
		x: center.x + x,
		y: center.y - y
	};
}

function avoidCollision(obj, target) {
	if (target) {
		// is collision test
		while (util.isCollision(obj, target)) {
			if (obj.start.x > 0) {
				obj.start.y--;
			} else if (obj.start.x < 0) {
				obj.start.y++;
			} else {
				if (obj.start.y > 0) {
					obj.start.y++;
				} else {
					obj.start.y--;
				}
			}
		}
	}
	return obj;
}

function fillSeriesColor(series, config) {
	var index = 0;
	return series.map(function(item) {
		if (!item.color) {
			item.color = config.colors[index];
			index = (index + 1) % config.colors.length;
		}
		return item;
	});
}

function fillSeriesType(series, opts) {
	return series.map(function(item) {
		if (!item.type) {
			item.type = opts.type;
		}
		return item;
	});
}

function getDataRange(minData, maxData) {
	var limit = 0;
	var range = maxData - minData;
	if (range >= 10000) {
		limit = 1000;
	} else if (range >= 1000) {
		limit = 100;
	} else if (range >= 100) {
		limit = 10;
	} else if (range >= 10) {
		limit = 5;
	} else if (range >= 1) {
		limit = 1;
	} else if (range >= 0.1) {
		limit = 0.1;
	} else {
		limit = 0.01;
	}
	return {
		minRange: findRange(minData, 'lower', limit),
		maxRange: findRange(maxData, 'upper', limit)
	};
}

function measureText(text) {
	var fontSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : config.fontSize;

	// wx canvas 未实现measureText方法, 此处自行实现
	// 适配修改初始字体10px为其他大小的方法
	text = String(text);
	var text = text.split('');
	var width = 0;
	for (let i = 0; i < text.length; i++) {
		let item = text[i];
		if (/[a-zA-Z]/.test(item)) {
			width += 7;
		} else if (/[0-9]/.test(item)) {
			width += 5.5;
		} else if (/\./.test(item)) {
			width += 2.7;
		} else if (/-/.test(item)) {
			width += 3.25;
		} else if (/[\u4e00-\u9fa5]/.test(item)) {
			width += 10;
		} else if (/\(|\)/.test(item)) {
			width += 3.73;
		} else if (/\s/.test(item)) {
			width += 2.5;
		} else if (/%/.test(item)) {
			width += 8;
		} else {
			width += 10;
		}
	}
	return width * fontSize / 10;
}

function dataCombine(series) {
	return series.reduce(function(a, b) {
		return (a.data ? a.data : a).concat(b.data);
	}, []);
}

function dataCombineStack(series) {
	var sum = new Array(series[0].data.length);
	for (var j = 0; j < sum.length; j++) {
		sum[j] = 0;
	}
	for (var i = 0; i < series.length; i++) {
		for (var j = 0; j < sum.length; j++) {
			sum[j] += series[i].data[j];
		}
	}
	return series.reduce(function(a, b) {
		return (a.data ? a.data : a).concat(b.data).concat(sum);
	}, []);
}

function getTouches(touches, opts, e) {
	let x, y;
	if (touches.clientX) {
		if (opts.rotate) { //适配横屏
			y = opts.height - touches.clientX * opts.pixelRatio;
			x = (touches.pageY - e.currentTarget.offsetTop - (opts.height / opts.pixelRatio / 2) * (opts.pixelRatio - 1)) *
				opts.pixelRatio;
		} else {
			x = touches.clientX * opts.pixelRatio;
			y = (touches.pageY - e.currentTarget.offsetTop - (opts.height / opts.pixelRatio / 2) * (opts.pixelRatio - 1)) *
				opts.pixelRatio;
		}
	} else {
		if (opts.rotate) { //适配横屏
			y = opts.height - touches.x * opts.pixelRatio;
			x = touches.y * opts.pixelRatio;
		} else {
			x = touches.x * opts.pixelRatio;
			y = touches.y * opts.pixelRatio;
		}
	}
	return {
		x: x,
		y: y
	}
}

function getSeriesDataItem(series, index) {
	var data = [];
	for (let i = 0; i < series.length; i++) {
		let item = series[i];
		if (item.data[index] !== null && typeof item.data[index] !== 'undefined') {
			let seriesItem = {};
			seriesItem.color = item.color;
			seriesItem.type = item.type;
			seriesItem.style = item.style;
			seriesItem.shape = item.shape;
			seriesItem.disableLegend = item.disableLegend;
			seriesItem.name = item.name;
			seriesItem.data = item.format ? item.format(item.data[index]) : item.data[index];
			data.push(seriesItem);
		}
	}
	return data;
}

function getMaxTextListLength(list) {
	var lengthList = list.map(function(item) {
		return measureText(item);
	});
	return Math.max.apply(null, lengthList);
}

function getRadarCoordinateSeries(length) {
	var eachAngle = 2 * Math.PI / length;
	var CoordinateSeries = [];
	for (var i = 0; i < length; i++) {
		CoordinateSeries.push(eachAngle * i);
	}

	return CoordinateSeries.map(function(item) {
		return -1 * item + Math.PI / 2;
	});
}

function getToolTipData(seriesData, calPoints, index, categories) {
	var option = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

	var textList = seriesData.map(function(item) {
		return {
			text: option.format ? option.format(item, categories[index]) : item.name + ': ' + item.data,
			color: item.color
		};
	});
	var validCalPoints = [];
	var offset = {
		x: 0,
		y: 0
	};
	for (let i = 0; i < calPoints.length; i++) {
		let points = calPoints[i];
		if (typeof points[index] !== 'undefined' && points[index] !== null) {
			validCalPoints.push(points[index]);
		}
	}
	for (let i = 0; i < validCalPoints.length; i++) {
		let item = validCalPoints[i];
		offset.x = Math.round(item.x);
		offset.y += item.y;
	}
	offset.y /= validCalPoints.length;
	return {
		textList: textList,
		offset: offset
	};
}

function getMixToolTipData(seriesData, calPoints, index, categories) {
	var option = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
	var textList = seriesData.map(function(item) {
		return {
			text: option.format ? option.format(item, categories[index]) : item.name + ': ' + item.data,
			color: item.color,
			disableLegend: item.disableLegend ? true : false
		};
	});
	textList = textList.filter(function(item) {
		if (item.disableLegend !== true) {
			return item;
		}
	});
	var validCalPoints = [];
	var offset = {
		x: 0,
		y: 0
	};
	for (let i = 0; i < calPoints.length; i++) {
		let points = calPoints[i];
		if (typeof points[index] !== 'undefined' && points[index] !== null) {
			validCalPoints.push(points[index]);
		}
	}
	for (let i = 0; i < validCalPoints.length; i++) {
		let item = validCalPoints[i];
		offset.x = Math.round(item.x);
		offset.y += item.y;
	}
	offset.y /= validCalPoints.length;
	return {
		textList: textList,
		offset: offset
	};
}

function getCandleToolTipData(series, seriesData, calPoints, index, categories, extra) {
	var option = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : {};
	let upColor = extra.color.upFill;
	let downColor = extra.color.downFill;
	//颜色顺序为开盘，收盘，最低，最高
	let color = [upColor, upColor, downColor, upColor];
	var textList = [];
	let text0 = {
		text: categories[index],
		color: null
	};
	textList.push(text0);
	seriesData.map(function(item) {
		//console.log(color)
		if (index == 0 && item.data[1] - item.data[0] < 0) {
			color[1] = downColor;
		} else {
			if (item.data[0] < series[index - 1][1]) {
				color[0] = downColor;
			}
			if (item.data[1] < item.data[0]) {
				color[1] = downColor;
			}
			if (item.data[2] > series[index - 1][1]) {
				color[2] = upColor;
			}
			if (item.data[3] < series[index - 1][1]) {
				color[3] = downColor;
			}
		}

		let text1 = {
			text: '开盘：' + item.data[0],
			color: color[0]
		};
		let text2 = {
			text: '收盘：' + item.data[1],
			color: color[1]
		};
		let text3 = {
			text: '最低：' + item.data[2],
			color: color[2]
		};
		let text4 = {
			text: '最高：' + item.data[3],
			color: color[3]
		};
		textList.push(text1, text2, text3, text4);
	});
	var validCalPoints = [];
	var offset = {
		x: 0,
		y: 0
	};
	for (let i = 0; i < calPoints.length; i++) {
		let points = calPoints[i];
		if (typeof points[index] !== 'undefined' && points[index] !== null) {
			validCalPoints.push(points[index]);
		}
	}
	offset.x = Math.round(validCalPoints[0][0].x);
	return {
		textList: textList,
		offset: offset
	};
}

function findCurrentIndex(currentPoints, xAxisPoints, opts, config) {
	var offset = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
	var currentIndex = -1;
	if (isInExactChartArea(currentPoints, opts, config)) {
		xAxisPoints.forEach(function(item, index) {
			if (currentPoints.x + offset > item) {
				currentIndex = index;
			}
		});
	}

	return currentIndex;
}

function isInExactChartArea(currentPoints, opts, config) {
	return currentPoints.x < opts.width - config.padding && currentPoints.x > config.padding + config.yAxisWidth + config.yAxisTitleWidth &&
		currentPoints.y > config.padding && currentPoints.y < opts.height - config.legendHeight - config.xAxisHeight - config
		.padding;
}

function findRadarChartCurrentIndex(currentPoints, radarData, count) {
	var eachAngleArea = 2 * Math.PI / count;
	var currentIndex = -1;
	if (isInExactPieChartArea(currentPoints, radarData.center, radarData.radius)) {
		var fixAngle = function fixAngle(angle) {
			if (angle < 0) {
				angle += 2 * Math.PI;
			}
			if (angle > 2 * Math.PI) {
				angle -= 2 * Math.PI;
			}
			return angle;
		};

		var angle = Math.atan2(radarData.center.y - currentPoints.y, currentPoints.x - radarData.center.x);
		angle = -1 * angle;
		if (angle < 0) {
			angle += 2 * Math.PI;
		}

		var angleList = radarData.angleList.map(function(item) {
			item = fixAngle(-1 * item);

			return item;
		});

		angleList.forEach(function(item, index) {
			var rangeStart = fixAngle(item - eachAngleArea / 2);
			var rangeEnd = fixAngle(item + eachAngleArea / 2);
			if (rangeEnd < rangeStart) {
				rangeEnd += 2 * Math.PI;
			}
			if (angle >= rangeStart && angle <= rangeEnd || angle + 2 * Math.PI >= rangeStart && angle + 2 * Math.PI <=
				rangeEnd) {
				currentIndex = index;
			}
		});
	}

	return currentIndex;
}

function findPieChartCurrentIndex(currentPoints, pieData) {
	var currentIndex = -1;
	if (isInExactPieChartArea(currentPoints, pieData.center, pieData.radius)) {
		var angle = Math.atan2(pieData.center.y - currentPoints.y, currentPoints.x - pieData.center.x);
		angle = -angle;
		for (var i = 0, len = pieData.series.length; i < len; i++) {
			var item = pieData.series[i];
			if (isInAngleRange(angle, item._start_, item._start_ + item._proportion_ * 2 * Math.PI)) {
				currentIndex = i;
				break;
			}
		}
	}

	return currentIndex;
}

function isInExactPieChartArea(currentPoints, center, radius) {
	return Math.pow(currentPoints.x - center.x, 2) + Math.pow(currentPoints.y - center.y, 2) <= Math.pow(radius, 2);
}

function splitPoints(points) {
	var newPoints = [];
	var items = [];
	points.forEach(function(item, index) {
		if (item !== null) {
			items.push(item);
		} else {
			if (items.length) {
				newPoints.push(items);
			}
			items = [];
		}
	});
	if (items.length) {
		newPoints.push(items);
	}

	return newPoints;
}

function calLegendData(series, opts, config) {
	if (opts.legend === false) {
		return {
			legendList: [],
			legendHeight: 0
		};
	}
	//适配H5高分屏
	var padding = 5 * opts.pixelRatio;
	var marginTop = 8 * opts.pixelRatio;
	var shapeWidth = 15 * opts.pixelRatio;
	var legendList = [];
	var widthCount = 0;
	var currentRow = [];
	for (let i = 0; i < series.length; i++) {
		let item = series[i];
		let itemWidth = 3 * padding + shapeWidth + measureText(item.name || 'undefined');
		if (widthCount + itemWidth > opts.width) {
			legendList.push(currentRow);
			widthCount = itemWidth;
			currentRow = [item];
		} else {
			widthCount += itemWidth;
			currentRow.push(item);
		}
	}
	if (currentRow.length) {
		legendList.push(currentRow);
	}

	return {
		legendList: legendList,
		legendHeight: legendList.length * (config.fontSize + marginTop) + padding
	};
}

function calCategoriesData(categories, opts, config) {
	var result = {
		angle: 0,
		xAxisHeight: config.xAxisHeight
	};

	var _getXAxisPoints = getXAxisPoints(categories, opts, config),
		eachSpacing = _getXAxisPoints.eachSpacing;

	// get max length of categories text


	var categoriesTextLenth = categories.map(function(item) {
		return measureText(item);
	});

	var maxTextLength = Math.max.apply(this, categoriesTextLenth);

	if (opts.xAxis.rotateLabel == true && maxTextLength + 2 * config.xAxisTextPadding > eachSpacing) {
		result.angle = 45 * Math.PI / 180;
		result.xAxisHeight = 2 * config.xAxisTextPadding + maxTextLength * Math.sin(result.angle);
	}

	return result;
}

function getRadarDataPoints(angleList, center, radius, series, opts) {
	var process = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;

	var radarOption = opts.extra.radar || {};
	radarOption.max = radarOption.max || 0;
	var maxData = Math.max(radarOption.max, Math.max.apply(null, dataCombine(series)));

	var data = [];
	for (let i = 0; i < series.length; i++) {
		let each = series[i];
		let listItem = {};
		listItem.color = each.color;
		listItem.data = [];
		each.data.forEach(function(item, index) {
			let tmp = {};
			tmp.angle = angleList[index];

			tmp.proportion = item / maxData;
			tmp.position = convertCoordinateOrigin(radius * tmp.proportion * process * Math.cos(tmp.angle), radius * tmp.proportion *
				process * Math.sin(tmp.angle), center);
			listItem.data.push(tmp);
		});

		data.push(listItem);
	}

	return data;
}

function getPieDataPoints(series, radius) {
	var process = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

	var count = 0;
	var _start_ = 0;
	for (let i = 0; i < series.length; i++) {
		let item = series[i];
		item.data = item.data === null ? 0 : item.data;
		count += item.data;
	}
	for (let i = 0; i < series.length; i++) {
		let item = series[i];
		item.data = item.data === null ? 0 : item.data;
		if (count === 0) {
			item._proportion_ = 1 / series.length * process;
		} else {
			item._proportion_ = item.data / count * process;
		}
		item._radius_=radius;
	}
	for (let i = 0; i < series.length; i++) {
		let item = series[i];
		item._start_ = _start_;
		_start_ += 2 * item._proportion_ * Math.PI;
	}

	return series;
}

function getRoseDataPoints(series, type, minRadius, radius) {
	var process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
	var count = 0;
	var _start_ = 0;
	
	var dataArr=[];
	for (let i = 0; i < series.length; i++) {
		let item = series[i];
		item.data = item.data === null ? 0 : item.data;
		count += item.data;
		dataArr.push(item.data);
	}
	var minData = dataArr.pop();
	var maxData = dataArr.shift();
	var radiusLength = radius - minRadius;
	
	for (let i = 0; i < series.length; i++) {
		let item = series[i];
		item.data = item.data === null ? 0 : item.data;
		if (count === 0 || type == 'area') {
			item._proportion_ = 1 / series.length * process;
		} else {
			item._proportion_ = item.data / count * process;
		}
		item._radius_ = minRadius + radiusLength * ( (item.data - minData)/(maxData-minData) );
	}
	for (let i = 0; i < series.length; i++) {
		let item = series[i];
		item._start_ = _start_;
		_start_ += 2 * item._proportion_ * Math.PI;
	}

	return series;
}

function getArcbarDataPoints(series, arcbarOption) {
	var process = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
	if (process == 1) {
		process = 0.999999;
	}
	for (let i = 0; i < series.length; i++) {
		let item = series[i];
		item.data = item.data === null ? 0 : item.data;
		let totalAngle;
		if (arcbarOption.type == 'default') {
			totalAngle = arcbarOption.startAngle - arcbarOption.endAngle + 1;
		} else {
			totalAngle = 2;
		}
		item._proportion_ = totalAngle * item.data * process + arcbarOption.startAngle;
		if (item._proportion_ >= 2) {
			item._proportion_ = item._proportion_ % 2;
		}
	}
	return series;
}

function getGaugeAxisPoints(categories, startAngle, endAngle) {
	let totalAngle = startAngle - endAngle + 1;
	let tempStartAngle = startAngle;
	for (let i = 0; i < categories.length; i++) {
		categories[i].value = categories[i].value === null ? 0 : categories[i].value;
		categories[i]._startAngle_ = tempStartAngle;
		categories[i]._endAngle_ = totalAngle * categories[i].value + startAngle;
		if (categories[i]._endAngle_ >= 2) {
			categories[i]._endAngle_ = categories[i]._endAngle_ % 2;
		}
		tempStartAngle = categories[i]._endAngle_;
	}
	return categories;
}

function getGaugeDataPoints(series, categories, gaugeOption) {
	let process = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
	for (let i = 0; i < series.length; i++) {
		let item = series[i];
		item.data = item.data === null ? 0 : item.data;
		if (gaugeOption.pointer.color == 'auto') {
			for (let i = 0; i < categories.length; i++) {
				if (item.data <= categories[i].value) {
					item.color = categories[i].color;
					break;
				}
			}
		} else {
			item.color = gaugeOption.pointer.color;
		}
		let totalAngle = gaugeOption.startAngle - gaugeOption.endAngle + 1;
		item._endAngle_ = totalAngle * item.data + gaugeOption.startAngle;
		item._oldAngle_ = gaugeOption.oldAngle;
		if (gaugeOption.oldAngle < gaugeOption.endAngle) {
			item._oldAngle_ += 2;
		}
		if (item.data >= gaugeOption.oldData) {
			item._proportion_ = (item._endAngle_ - item._oldAngle_) * process + gaugeOption.oldAngle;
		} else {
			item._proportion_ = item._oldAngle_ - (item._oldAngle_ - item._endAngle_) * process;
		}
		if (item._proportion_ >= 2) {
			item._proportion_ = item._proportion_ % 2;
		}
	}
	return series;
}


function getPieTextMaxLength(series) {
	series = getPieDataPoints(series);
	let maxLength = 0;
	for (let i = 0; i < series.length; i++) {
		let item = series[i];
		let text = item.format ? item.format(+item._proportion_.toFixed(2)) : util.toFixed(item._proportion_ * 100) + '%';
		maxLength = Math.max(maxLength, measureText(text));
	}

	return maxLength;
}

function fixColumeData(points, eachSpacing, columnLen, index, config, opts) {
	return points.map(function(item) {
		if (item === null) {
			return null;
		}
		item.width = Math.ceil((eachSpacing - 2 * config.columePadding) / columnLen);

		if (opts.extra.column && opts.extra.column.width && +opts.extra.column.width > 0) {
			item.width = Math.min(item.width, +opts.extra.column.width);
		} 
		item.x += (index + 0.5 - columnLen / 2) * item.width;
		return item;
	});
}

function fixColumeMeterData(points, eachSpacing, columnLen, index, config, opts, border) {
	return points.map(function(item) {
		if (item === null) {
			return null;
		}
		item.width = eachSpacing - 2 * config.columePadding;

		if (opts.extra.column && opts.extra.column.width && +opts.extra.column.width > 0) {
			item.width = Math.min(item.width, +opts.extra.column.width);
		} else {
			item.width = Math.min(item.width, 25);
		}
		if (index > 0) {
			item.width -= 2 * border;
		}
		return item;
	});
}

function fixColumeStackData(points, eachSpacing, columnLen, index, config, opts, series) {

	return points.map(function(item, indexn) {

		if (item === null) {
			return null;
		}
		item.width = eachSpacing - 2 * config.columePadding;

		if (opts.extra.column && opts.extra.column.width && +opts.extra.column.width > 0) {
			item.width = Math.min(item.width, +opts.extra.column.width);
		} else {
			item.width = Math.min(item.width, 25);
		}
		return item;
	});
}

function getXAxisPoints(categories, opts, config) {
	var yAxisTotalWidth = config.yAxisWidth + config.yAxisTitleWidth;
	var spacingValid = opts.width - 2 * config.padding - yAxisTotalWidth;
	var dataCount = opts.enableScroll ? Math.min(opts.xAxis.itemCount, categories.length) : categories.length;
	var eachSpacing = spacingValid / dataCount;

	var xAxisPoints = [];
	var startX = config.padding + yAxisTotalWidth;
	var endX = opts.width - config.padding;
	categories.forEach(function(item, index) {
		xAxisPoints.push(startX + index * eachSpacing);
	});
	if (opts.enableScroll === true) {
		xAxisPoints.push(startX + categories.length * eachSpacing);
	} else {
		xAxisPoints.push(endX);
	}

	return {
		xAxisPoints: xAxisPoints,
		startX: startX,
		endX: endX,
		eachSpacing: eachSpacing
	};
}

function getCandleDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config) {
	var process = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 1;

	var points = [];
	var validHeight = opts.height - 2 * config.padding - config.xAxisHeight - config.legendHeight;
	data.forEach(function(item, index) {
		if (item === null) {
			points.push(null);
		} else {
			var cPoints = [];
			item.forEach(function(items, indexs) {
				var point = {};
				point.x = xAxisPoints[index] + Math.round(eachSpacing / 2);
				var value = items.value || items;
				var height = validHeight * (value - minRange) / (maxRange - minRange);
				height *= process;
				point.y = opts.height - config.xAxisHeight - config.legendHeight - Math.round(height) - config.padding;
				cPoints.push(point);
			});
			points.push(cPoints);
		}
	});

	return points;
}

function getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config) {
	var process = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 1;

	var points = [];
	var validHeight = opts.height - 2 * config.padding - config.xAxisHeight - config.legendHeight;
	data.forEach(function(item, index) {
		if (item === null) {
			points.push(null);
		} else {
			var point = {};
			point.color = item.color;
			point.x = xAxisPoints[index] + Math.round(eachSpacing / 2);
			var value = item;
			if (typeof item === 'object' && item !== null) {
				value = item.value
			}
			var height = validHeight * (value - minRange) / (maxRange - minRange);
			height *= process;
			point.y = opts.height - config.xAxisHeight - config.legendHeight - Math.round(height) - config.padding;
			points.push(point);
		}
	});

	return points;
}

function getStackDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, seriesIndex, stackSeries) {
	var process = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 1;
	var points = [];
	var validHeight = opts.height - 2 * config.padding - config.xAxisHeight - config.legendHeight;

	data.forEach(function(item, index) {
		if (item === null) {
			points.push(null);
		} else {
			var point = {};
			point.color = item.color;
			point.x = xAxisPoints[index] + Math.round(eachSpacing / 2);

			if (seriesIndex > 0) {
				var value = 0;
				for (let i = 0; i <= seriesIndex; i++) {
					value += stackSeries[i].data[index];
				}
				var value0 = value - item;
				var height = validHeight * (value - minRange) / (maxRange - minRange);
				var height0 = validHeight * (value0 - minRange) / (maxRange - minRange);
			} else {
				var value = item;
				var height = validHeight * (value - minRange) / (maxRange - minRange);
				var height0 = 0;
			}
			var heightc = height0;
			height *= process;
			heightc *= process;
			point.y = opts.height - config.xAxisHeight - config.legendHeight - Math.round(height) - config.padding;
			point.y0 = opts.height - config.xAxisHeight - config.legendHeight - Math.round(heightc) - config.padding;
			points.push(point);
		}
	});

	return points;
}

function getYAxisTextList(series, opts, config, stack) {
	var data;
	if (stack == 'stack') {
		//data = dataCombine(series);
		data = dataCombineStack(series);
	} else {
		data = dataCombine(series);
	}

	var sorted = [];
	// remove null from data
	data = data.filter(function(item) {
		//return item !== null;
		if (typeof item === 'object' && item !== null) {
			//判断是否为数组
			if (item.constructor == Array) {
				return item !== null;
			} else {
				return item.value !== null;
			}
		} else {
			return item !== null;
		}
	});
	//var minData = Math.min.apply(this, data);
	//var maxData = Math.max.apply(this, data);
	data.map(function(item) {
		if (typeof item === 'object') {
			if (item.constructor == Array) {
				item.map(function(subitem) {
					sorted.push(subitem);
				})
			} else {
				sorted.push(item.value);
			}
		} else {
			sorted.push(item);
		}
		//typeof item === 'object' ? sorted.push(item.value) : sorted.push(item)
	})
	var minData = 0;
	var maxData = 0;
	if (sorted.length > 0) {
		minData = Math.min.apply(this, sorted);
		maxData = Math.max.apply(this, sorted);
	}
	if (typeof opts.yAxis.min === 'number') {
		minData = Math.min(opts.yAxis.min, minData);
	}
	if (typeof opts.yAxis.max === 'number') {
		maxData = Math.max(opts.yAxis.max, maxData);
	}

	// fix issue https://github.com/xiaolin3303/wx-charts/issues/9
	if (minData === maxData) {
		var rangeSpan = maxData || 10;
		//minData -= rangeSpan;
		maxData += rangeSpan;
	}

	var dataRange = getDataRange(minData, maxData);
	var minRange = dataRange.minRange;
	var maxRange = dataRange.maxRange;

	var range = [];
	var eachRange = (maxRange - minRange) / config.yAxisSplit;

	for (var i = 0; i <= config.yAxisSplit; i++) {
		range.push(minRange + eachRange * i);
	}
	return range.reverse();
}

function calYAxisData(series, opts, config) {
	//堆叠图重算Y轴
	var columnstyle = assign({}, opts.extra.column || {
		"type": ""
	});

	var ranges = getYAxisTextList(series, opts, config, columnstyle.type);
	var yAxisWidth = config.yAxisWidth;
	var rangesFormat = ranges.map(function(item) {
		item = util.toFixed(item, 2);
		item = opts.yAxis.format ? opts.yAxis.format(Number(item)) : item;
		yAxisWidth = Math.max(yAxisWidth, measureText(item) + 5);
		return item;
	});
	if (opts.yAxis.disabled === true) {
		yAxisWidth = 0;
	}

	return {
		rangesFormat: rangesFormat,
		ranges: ranges,
		yAxisWidth: yAxisWidth
	};
}

function calTooltipYAxisData(point, series, opts, config, eachSpacing) {
	var ranges = getYAxisTextList(series, opts, config);
	var spacingValid = opts.height - 2 * config.padding - config.xAxisHeight - config.legendHeight;
	let maxVal = ranges[0];
	let minVal = ranges[ranges.length - 1];
	let minAxis = config.padding;
	let maxAxis = config.padding + spacingValid;
	let item = maxVal - (maxVal - minVal) * (point - minAxis) / (maxAxis - minAxis);
	item = opts.yAxis.format ? opts.yAxis.format(Number(item)) : item;
	return item;
}

function contextRotate(context, opts) {
	if (opts.rotateLock !== true) {
		context.translate(opts.height, 0);
		context.rotate(90 * Math.PI / 180);
	} else if (opts._rotate_ !== true) {
		context.translate(opts.height, 0);
		context.rotate(90 * Math.PI / 180);
		opts._rotate_ = true;
	}
}

function drawPointShape(points, color, shape, context, opts) {
	context.beginPath();
	context.setStrokeStyle("#ffffff");
	context.setLineWidth(1 * opts.pixelRatio);
	context.setFillStyle(color);
	if (shape === 'diamond') {
		points.forEach(function(item, index) {
			if (item !== null) {
				context.moveTo(item.x, item.y - 4.5);
				context.lineTo(item.x - 4.5, item.y);
				context.lineTo(item.x, item.y + 4.5);
				context.lineTo(item.x + 4.5, item.y);
				context.lineTo(item.x, item.y - 4.5);
			}
		});
	} else if (shape === 'circle') {
		points.forEach(function(item, index) {
			if (item !== null) {
				context.moveTo(item.x + 3.5 * opts.pixelRatio, item.y);
				context.arc(item.x, item.y, 4 * opts.pixelRatio, 0, 2 * Math.PI, false);
			}
		});
	} else if (shape === 'rect') {
		points.forEach(function(item, index) {
			if (item !== null) {
				context.moveTo(item.x - 3.5, item.y - 3.5);
				context.rect(item.x - 3.5, item.y - 3.5, 7, 7);
			}
		});
	} else if (shape === 'triangle') {
		points.forEach(function(item, index) {
			if (item !== null) {
				context.moveTo(item.x, item.y - 4.5);
				context.lineTo(item.x - 4.5, item.y + 4.5);
				context.lineTo(item.x + 4.5, item.y + 4.5);
				context.lineTo(item.x, item.y - 4.5);
			}
		});
	}
	context.closePath();
	context.fill();
	context.stroke();
}

function drawRingTitle(opts, config, context) {
	var titlefontSize = opts.title.fontSize || config.titleFontSize;
	var subtitlefontSize = opts.subtitle.fontSize || config.subtitleFontSize;
	var title = opts.title.name || '';
	var subtitle = opts.subtitle.name || '';
	var titleFontColor = opts.title.color || config.titleColor;
	var subtitleFontColor = opts.subtitle.color || config.subtitleColor;
	var titleHeight = title ? titlefontSize : 0;
	var subtitleHeight = subtitle ? subtitlefontSize : 0;
	var margin = 5;
	if (subtitle) {
		var textWidth = measureText(subtitle, subtitlefontSize);
		var startX = (opts.width - textWidth) / 2 + (opts.subtitle.offsetX || 0);
		var startY = ((opts.height - config.legendHeight + subtitlefontSize) / 2) + (opts.subtitle.offsetY || 0);
		if (title) {
			startY -= (titleHeight + margin) / 2;
		}
		context.beginPath();
		context.setFontSize(subtitlefontSize);
		context.setFillStyle(subtitleFontColor);
		context.fillText(subtitle, startX, startY);
		context.closePath();
		context.stroke();
	}
	if (title) {
		var _textWidth = measureText(title, titlefontSize);
		var _startX = (opts.width - _textWidth) / 2 + (opts.title.offsetX || 0);
		var _startY = ((opts.height - config.legendHeight + titlefontSize) / 2) + (opts.title.offsetY || 0);
		if (subtitle) {
			_startY += (subtitleHeight + margin) / 2;
		}
		context.beginPath();
		context.setFontSize(titlefontSize);
		context.setFillStyle(titleFontColor);
		context.fillText(title, _startX, _startY);
		context.closePath();
		context.stroke();
	}
}

function drawPointText(points, series, config, context) {
	// 绘制数据文案
	var data = series.data;
	points.forEach(function(item, index) {
		if (item !== null) {
			//var formatVal = series.format ? series.format(data[index]) : data[index];
			context.beginPath();
			context.setFontSize(series.textSize || config.fontSize);
			context.setFillStyle(series.textColor || '#666666');
			var value = data[index]
			if (typeof data[index] === 'object' && data[index] !== null) {
				value = data[index].value
			}
			var formatVal = series.format ? series.format(value) : value;
			context.fillText(formatVal, item.x - measureText(formatVal,series.textSize || config.fontSize) / 2, item.y - 2);
			context.closePath();
			context.stroke();
		}
	});

}

function drawGaugeLabel(gaugeOption, radius, centerPosition, opts, config, context) {
	radius -= gaugeOption.width / 2 + config.gaugeLabelTextMargin;

	let totalAngle = gaugeOption.startAngle - gaugeOption.endAngle + 1;
	let splitAngle = totalAngle / gaugeOption.splitLine.splitNumber;
	let totalNumber = gaugeOption.endNumber - gaugeOption.startNumber;
	let splitNumber = totalNumber / gaugeOption.splitLine.splitNumber;
	let nowAngle = gaugeOption.startAngle;
	let nowNumber = gaugeOption.startNumber;
	for (let i = 0; i < gaugeOption.splitLine.splitNumber + 1; i++) {
		var pos = {
			x: radius * Math.cos(nowAngle * Math.PI),
			y: radius * Math.sin(nowAngle * Math.PI)
		};
		var labelText = gaugeOption.labelFormat ? gaugeOption.labelFormat(nowNumber) : nowNumber;
		pos.x += centerPosition.x - measureText(labelText) / 2;
		pos.y += centerPosition.y;
		var startX = pos.x;
		var startY = pos.y;
		context.beginPath();
		context.setFontSize(config.fontSize);
		context.setFillStyle(gaugeOption.labelColor || '#666666');
		context.fillText(labelText, startX, startY + config.fontSize / 2);
		context.closePath();
		context.stroke();

		nowAngle += splitAngle;
		if (nowAngle >= 2) {
			nowAngle = nowAngle % 2;
		}
		nowNumber += splitNumber;
	}

}

function drawRadarLabel(angleList, radius, centerPosition, opts, config, context) {
	var radarOption = opts.extra.radar || {};
	radius += config.radarLabelTextMargin;

	angleList.forEach(function(angle, index) {
		var pos = {
			x: radius * Math.cos(angle),
			y: radius * Math.sin(angle)
		};
		var posRelativeCanvas = convertCoordinateOrigin(pos.x, pos.y, centerPosition);
		var startX = posRelativeCanvas.x;
		var startY = posRelativeCanvas.y;
		if (util.approximatelyEqual(pos.x, 0)) {
			startX -= measureText(opts.categories[index] || '') / 2;
		} else if (pos.x < 0) {
			startX -= measureText(opts.categories[index] || '');
		}
		context.beginPath();
		context.setFontSize(config.fontSize);
		context.setFillStyle(radarOption.labelColor || '#666666');
		context.fillText(opts.categories[index] || '', startX, startY + config.fontSize / 2);
		context.closePath();
		context.stroke();
	});

}

function drawPieText(series, opts, config, context, radius, center) {
	var lineRadius = config.pieChartLinePadding;
	var textObjectCollection = [];
	var lastTextObject = null;

	var seriesConvert = series.map(function(item) {
		var arc = 2 * Math.PI - (item._start_ + 2 * Math.PI * item._proportion_ / 2);
		var text = item.format ? item.format(+item._proportion_.toFixed(2)) : util.toFixed(item._proportion_ * 100) + '%';
		var color = item.color;
		var radius = item._radius_;
		return {
			arc: arc,
			text: text,
			color: color,
			radius: radius,
			textColor: item.textColor,
			textSize: item.textSize,
		};
	});
	for (let i = 0; i < seriesConvert.length; i++) {
		let item = seriesConvert[i];
		// line end
		let orginX1 = Math.cos(item.arc) * (item.radius+lineRadius);
		let orginY1 = Math.sin(item.arc) * (item.radius+lineRadius);

		// line start
		let orginX2 = Math.cos(item.arc) * item.radius;
		let orginY2 = Math.sin(item.arc) * item.radius;

		// text start
		let orginX3 = orginX1 >= 0 ? orginX1 + config.pieChartTextPadding : orginX1 - config.pieChartTextPadding;
		let orginY3 = orginY1;
		let textWidth = measureText(item.text);
		let startY = orginY3;

		if (lastTextObject && util.isSameXCoordinateArea(lastTextObject.start, {
				x: orginX3
			})) {
			if (orginX3 > 0) {
				startY = Math.min(orginY3, lastTextObject.start.y);
			} else if (orginX1 < 0) {
				startY = Math.max(orginY3, lastTextObject.start.y);
			} else {
				if (orginY3 > 0) {
					startY = Math.max(orginY3, lastTextObject.start.y);
				} else {
					startY = Math.min(orginY3, lastTextObject.start.y);
				}
			}
		}
		if (orginX3 < 0) {
			orginX3 -= textWidth;
		}

		let textObject = {
			lineStart: {
				x: orginX2,
				y: orginY2
			},
			lineEnd: {
				x: orginX1,
				y: orginY1
			},
			start: {
				x: orginX3,
				y: startY
			},
			width: textWidth,
			height: config.fontSize,
			text: item.text,
			color: item.color,
			textColor: item.textColor,
			textSize: item.textSize
		};
		lastTextObject = avoidCollision(textObject, lastTextObject);
		textObjectCollection.push(lastTextObject);
	}

	for (let i = 0; i < textObjectCollection.length; i++) {
		let item = textObjectCollection[i];
		let lineStartPoistion = convertCoordinateOrigin(item.lineStart.x, item.lineStart.y, center);
		let lineEndPoistion = convertCoordinateOrigin(item.lineEnd.x, item.lineEnd.y, center);
		let textPosition = convertCoordinateOrigin(item.start.x, item.start.y, center);
		context.setLineWidth(1 * opts.pixelRatio);
		context.setFontSize(config.fontSize);
		context.beginPath();
		context.setStrokeStyle(item.color);
		context.setFillStyle(item.color);
		context.moveTo(lineStartPoistion.x, lineStartPoistion.y);
		let curveStartX = item.start.x < 0 ? textPosition.x + item.width : textPosition.x;
		let textStartX = item.start.x < 0 ? textPosition.x - 5 : textPosition.x + 5;
		context.quadraticCurveTo(lineEndPoistion.x, lineEndPoistion.y, curveStartX, textPosition.y);
		context.moveTo(lineStartPoistion.x, lineStartPoistion.y);
		context.stroke();
		context.closePath();
		context.beginPath();
		context.moveTo(textPosition.x + item.width, textPosition.y);
		context.arc(curveStartX, textPosition.y, 2, 0, 2 * Math.PI);
		context.closePath();
		context.fill();
		context.beginPath();
		context.setFontSize(item.textSize||config.fontSize);
		context.setFillStyle(item.textColor||'#666666');
		context.fillText(item.text, textStartX, textPosition.y + 3);
		context.closePath();
		context.stroke();
		context.closePath();
	}
}

function drawToolTipSplitLine(offsetX, opts, config, context) {
	var toolTipOption = opts.extra.tooltip || {};
	toolTipOption.gridType = toolTipOption.gridType == undefined ? 'solid' : toolTipOption.gridType;
	toolTipOption.dashLength = toolTipOption.dashLength == undefined ? 4 : toolTipOption.dashLength;
	var startY = config.padding;
	var endY = opts.height - config.padding - config.xAxisHeight - config.legendHeight;

	if (toolTipOption.gridType == 'dash') {
		context.setLineDash([toolTipOption.dashLength, toolTipOption.dashLength]);
	}
	context.beginPath();
	context.setStrokeStyle(toolTipOption.gridColor || '#cccccc');
	context.setLineWidth(1 * opts.pixelRatio);
	context.moveTo(offsetX, startY);
	context.lineTo(offsetX, endY);
	context.closePath();
	context.stroke();
	context.setLineDash([]);

	if (toolTipOption.xAxisLabel) {
		let labelText = opts.categories[opts.tooltip.index];
		context.setFontSize(config.fontSize);
		let textWidth = context.measureText(labelText).width;

		let textX = offsetX - config.toolTipPadding - 0.5 * textWidth;
		let textY = endY;
		context.beginPath();
		context.setFillStyle(hexToRgb(toolTipOption.labelBgColor || config.toolTipBackground, toolTipOption.labelBgOpacity ||
			config.toolTipOpacity));
		context.setStrokeStyle(toolTipOption.labelBgColor || config.toolTipBackground);
		context.setLineWidth(1 * opts.pixelRatio);
		context.rect(textX, textY, textWidth + 2 * config.toolTipPadding, config.fontSize + 2 * config.toolTipPadding);
		context.closePath();
		context.stroke();
		context.fill();

		context.beginPath();
		context.setFontSize(config.fontSize);
		context.setFillStyle(toolTipOption.labelFontColor || config.fontColor);
		context.fillText(labelText, textX + 2 * config.toolTipPadding, textY + config.toolTipPadding + config.fontSize);
		context.closePath();
		context.stroke();
	}
}

function drawToolTipHorizentalLine(opts, config, context, eachSpacing, xAxisPoints) {
	var toolTipOption = opts.extra.tooltip || {};
	toolTipOption.gridType = toolTipOption.gridType == undefined ? 'solid' : toolTipOption.gridType;
	toolTipOption.dashLength = toolTipOption.dashLength == undefined ? 4 : toolTipOption.dashLength;
	var startX = config.padding + config.yAxisWidth + config.yAxisTitleWidth;
	var endX = opts.width - config.padding;

	if (toolTipOption.gridType == 'dash') {
		context.setLineDash([toolTipOption.dashLength, toolTipOption.dashLength]);
	}
	context.beginPath();
	context.setStrokeStyle(toolTipOption.gridColor || '#cccccc');
	context.setLineWidth(1 * opts.pixelRatio);
	context.moveTo(startX, opts.tooltip.offset.y);
	context.lineTo(endX, opts.tooltip.offset.y);
	context.closePath();
	context.stroke();
	context.setLineDash([]);

	if (toolTipOption.yAxisLabel) {

		let labelText = calTooltipYAxisData(opts.tooltip.offset.y, opts.series, opts, config, eachSpacing);
		context.setFontSize(config.fontSize);
		let textWidth = context.measureText(labelText).width;

		let textX = startX - 2 * config.toolTipPadding - textWidth;
		let textY = opts.tooltip.offset.y;
		context.beginPath();
		context.setFillStyle(hexToRgb(toolTipOption.labelBgColor || config.toolTipBackground, toolTipOption.labelBgOpacity ||
			config.toolTipOpacity));
		context.setStrokeStyle(toolTipOption.labelBgColor || config.toolTipBackground);
		context.setLineWidth(1 * opts.pixelRatio);
		context.rect(textX, textY - 0.5 * config.fontSize - config.toolTipPadding, textWidth + 2 * config.toolTipPadding,
			config.fontSize + 2 * config.toolTipPadding);
		context.closePath();
		context.stroke();
		context.fill();

		context.beginPath();
		context.setFontSize(config.fontSize);
		context.setFillStyle(toolTipOption.labelFontColor || config.fontColor);
		context.fillText(labelText, textX + config.toolTipPadding, textY + 0.5 * config.fontSize);
		context.closePath();
		context.stroke();
	}
}


function drawToolTipSplitArea(offsetX, opts, config, context, eachSpacing) {
	var toolTipOption = opts.extra.tooltip || {
		activeBgColor: '#000000',
		activeBgOpacity: 0.08
	};
	toolTipOption.activeBgColor = toolTipOption.activeBgColor ? toolTipOption.activeBgColor : '#000000';
	toolTipOption.activeBgOpacity = toolTipOption.activeBgOpacity ? toolTipOption.activeBgOpacity : 0.08;
	var startY = config.padding;
	var endY = opts.height - config.padding - config.xAxisHeight - config.legendHeight;
	context.beginPath();
	context.setFillStyle(hexToRgb(toolTipOption.activeBgColor, toolTipOption.activeBgOpacity));
	context.rect(offsetX - eachSpacing / 2, startY, eachSpacing, endY - startY);
	context.closePath();
	context.fill();
}

function drawToolTip(textList, offset, opts, config, context, eachSpacing, xAxisPoints) {
	var toolTipOption = opts.extra.tooltip || {
		bgColor: '#000000',
		bgOpacity: 0.7,
		fontColor: '#FFFFFF'
	};
	toolTipOption.bgColor = toolTipOption.bgColor ? toolTipOption.bgColor : '#000000';
	toolTipOption.bgOpacity = toolTipOption.bgOpacity ? toolTipOption.bgOpacity : 0.7;
	toolTipOption.fontColor = toolTipOption.fontColor ? toolTipOption.fontColor : '#FFFFFF';
	var legendWidth = 4 * opts.pixelRatio;
	var legendMarginRight = 5 * opts.pixelRatio;
	var arrowWidth = 8 * opts.pixelRatio;
	var isOverRightBorder = false;
	if (opts.type == 'line' || opts.type == 'area' || opts.type == 'candle' || opts.type == 'mix') {
		drawToolTipSplitLine(opts.tooltip.offset.x, opts, config, context);
	}

	offset = assign({
		x: 0,
		y: 0
	}, offset);
	offset.y -= 8 * opts.pixelRatio;
	var textWidth = textList.map(function(item) {
		return measureText(item.text);
	});

	var toolTipWidth = legendWidth + legendMarginRight + 4 * config.toolTipPadding + Math.max.apply(null, textWidth);
	var toolTipHeight = 2 * config.toolTipPadding + textList.length * config.toolTipLineHeight;

	// if beyond the right border
	if (offset.x - Math.abs(opts._scrollDistance_) + arrowWidth + toolTipWidth > opts.width) {
		isOverRightBorder = true;
	}

	// draw background rect
	context.beginPath();
	context.setFillStyle(hexToRgb(toolTipOption.bgColor || config.toolTipBackground, toolTipOption.bgOpacity || config.toolTipOpacity));
	if (isOverRightBorder) {
		context.moveTo(offset.x, offset.y + 10 * opts.pixelRatio);
		context.lineTo(offset.x - arrowWidth, offset.y + 10 * opts.pixelRatio - 5 * opts.pixelRatio);
		context.lineTo(offset.x - arrowWidth, offset.y);
		context.lineTo(offset.x - arrowWidth - Math.round(toolTipWidth), offset.y);
		context.lineTo(offset.x - arrowWidth - Math.round(toolTipWidth), offset.y + toolTipHeight);
		context.lineTo(offset.x - arrowWidth, offset.y + toolTipHeight);
		context.lineTo(offset.x - arrowWidth, offset.y + 10 * opts.pixelRatio + 5 * opts.pixelRatio);
		context.lineTo(offset.x, offset.y + 10 * opts.pixelRatio);
	} else {
		context.moveTo(offset.x, offset.y + 10 * opts.pixelRatio);
		context.lineTo(offset.x + arrowWidth, offset.y + 10 * opts.pixelRatio - 5 * opts.pixelRatio);
		context.lineTo(offset.x + arrowWidth, offset.y);
		context.lineTo(offset.x + arrowWidth + Math.round(toolTipWidth), offset.y);
		context.lineTo(offset.x + arrowWidth + Math.round(toolTipWidth), offset.y + toolTipHeight);
		context.lineTo(offset.x + arrowWidth, offset.y + toolTipHeight);
		context.lineTo(offset.x + arrowWidth, offset.y + 10 * opts.pixelRatio + 5 * opts.pixelRatio);
		context.lineTo(offset.x, offset.y + 10 * opts.pixelRatio);
	}

	context.closePath();
	context.fill();

	// draw legend
	textList.forEach(function(item, index) {
		if (item.color !== null) {
			context.beginPath();
			context.setFillStyle(item.color);
			var startX = offset.x + arrowWidth + 2 * config.toolTipPadding;
			var startY = offset.y + (config.toolTipLineHeight - config.fontSize) / 2 + config.toolTipLineHeight * index +
				config.toolTipPadding + 1;
			if (isOverRightBorder) {
				startX = offset.x - toolTipWidth - arrowWidth + 2 * config.toolTipPadding;
			}
			context.fillRect(startX, startY, legendWidth, config.fontSize);
			context.closePath();
		}
	});

	// draw text list

	textList.forEach(function(item, index) {
		var startX = offset.x + arrowWidth + 2 * config.toolTipPadding + legendWidth + legendMarginRight;
		if (isOverRightBorder) {
			startX = offset.x - toolTipWidth - arrowWidth + 2 * config.toolTipPadding + +legendWidth + legendMarginRight;
		}
		var startY = offset.y + (config.toolTipLineHeight - config.fontSize) / 2 + config.toolTipLineHeight * index +
			config.toolTipPadding;
		context.beginPath();
		context.setFontSize(config.fontSize);
		context.setFillStyle(toolTipOption.fontColor);
		context.fillText(item.text, startX, startY + config.fontSize);
		context.closePath();
		context.stroke();
	});
}

function drawYAxisTitle(title, opts, config, context) {
	var startX = config.xAxisHeight + (opts.height - config.xAxisHeight - measureText(title)) / 2;
	context.save();
	context.beginPath();
	context.setFontSize(config.fontSize);
	context.setFillStyle(opts.yAxis.titleFontColor || '#333333');
	context.translate(0, opts.height);
	context.rotate(-90 * Math.PI / 180);
	context.fillText(title, startX, config.padding + 0.5 * config.fontSize);
	context.closePath();
	context.stroke();
	context.restore();
}

function drawColumnDataPoints(series, opts, config, context) {
	var process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
	var columnOption = opts.extra.column || {
		type: {},
		meter: {}
	};
	columnOption.type = columnOption.type == undefined ? 'group' : columnOption.type;
	columnOption.meter = columnOption.meter || {}
	columnOption.meter.border = columnOption.meter.border == undefined ? 4 : columnOption.meter.border;
	columnOption.meter.fillColor = columnOption.meter.fillColor == undefined ? '#FFFFFF' : columnOption.meter.fillColor;
	var _calYAxisData = calYAxisData(series, opts, config),
		ranges = _calYAxisData.ranges;

	var _getXAxisPoints = getXAxisPoints(opts.categories, opts, config),
		xAxisPoints = _getXAxisPoints.xAxisPoints,
		eachSpacing = _getXAxisPoints.eachSpacing;

	var minRange = ranges.pop();
	var maxRange = ranges.shift();
	var calPoints = [];

	context.save();
	if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
		context.translate(opts._scrollDistance_, 0);
	}
	if (opts.tooltip && opts.tooltip.textList && opts.tooltip.textList.length && process === 1) {
		drawToolTipSplitArea(opts.tooltip.offset.x, opts, config, context, eachSpacing);
	}

	series.forEach(function(eachSeries, seriesIndex) {
		var data = eachSeries.data;
		switch (columnOption.type) {
			case 'group':
				var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
				var tooltipPoints = getStackDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config,
					seriesIndex, series, process);
				calPoints.push(tooltipPoints);
				points = fixColumeData(points, eachSpacing, series.length, seriesIndex, config, opts);
				points.forEach(function(item, index) {
					if (item !== null) {
						context.beginPath();
						context.setFillStyle(item.color || eachSeries.color);
						var startX = item.x - item.width / 2 + 1;
						var height = opts.height - item.y - config.padding - config.xAxisHeight - config.legendHeight;
						context.moveTo(startX, item.y);
						context.fillRect(startX, item.y, item.width - 2, height);
						context.closePath();
						context.fill();
					}
				});
				break;
			case 'stack':
				// 绘制堆叠数据图
				var points = getStackDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, seriesIndex,
					series, process);
				calPoints.push(points);
				points = fixColumeStackData(points, eachSpacing, series.length, seriesIndex, config, opts, series);

				points.forEach(function(item, index) {
					if (item !== null) {
						context.beginPath();
						context.setFillStyle(item.color || eachSeries.color);
						var startX = item.x - item.width / 2 + 1;
						var height = opts.height - item.y - config.padding - config.xAxisHeight - config.legendHeight;
						var height0 = opts.height - item.y0 - config.padding - config.xAxisHeight - config.legendHeight;
						if (seriesIndex > 0) {
							height -= height0;
						}
						context.moveTo(startX, item.y);
						context.fillRect(startX, item.y, item.width - 2, height);
						context.closePath();
						context.fill();
					}
				});
				break;
			case 'meter':
				// 绘制温度计数据图
				var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
				calPoints.push(points);
				points = fixColumeMeterData(points, eachSpacing, series.length, seriesIndex, config, opts, columnOption.meter.border);
				if (seriesIndex == 0) {
					points.forEach(function(item, index) {
						if (item !== null) {
							//画背景颜色
							context.beginPath();
							context.setFillStyle(columnOption.meter.fillColor);
							var startX = item.x - item.width / 2 ;
							var height = opts.height - item.y - config.padding - config.xAxisHeight - config.legendHeight;
							context.moveTo(startX, item.y);
							context.fillRect(startX, item.y, item.width, height);
							context.closePath();
							context.fill();
							//画边框线
							if(columnOption.meter.border>0){
								context.beginPath();
								context.setStrokeStyle(eachSeries.color);
								context.setLineWidth(columnOption.meter.border * opts.pixelRatio);
								context.moveTo(startX + columnOption.meter.border*0.5, item.y + height);
								context.lineTo(startX + columnOption.meter.border*0.5, item.y + columnOption.meter.border*0.5);
								context.lineTo(startX + item.width - columnOption.meter.border*0.5, item.y + columnOption.meter.border*0.5);
								context.lineTo(startX + item.width - columnOption.meter.border*0.5, item.y + height);
								context.stroke();
							}
						}
					});
				} else {
					points.forEach(function(item, index) {
						if (item !== null) {
							context.beginPath();
							context.setFillStyle(item.color || eachSeries.color);
							var startX = item.x - item.width / 2;
							var height = opts.height - item.y - config.padding - config.xAxisHeight - config.legendHeight;
							context.moveTo(startX, item.y);
							context.fillRect(startX, item.y, item.width, height);
							context.closePath();
							context.fill();
						}
					});
				}
				break;
		}
	});
	if (opts.dataLabel !== false && process === 1) {
		series.forEach(function(eachSeries, seriesIndex) {
			var data = eachSeries.data;
			switch (columnOption.type) {
				case 'group':
					var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
					points = fixColumeData(points, eachSpacing, series.length, seriesIndex, config, opts);

					drawPointText(points, eachSeries, config, context);
					break;
				case 'stack':
					var points = getStackDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, seriesIndex,
						series, process);
					drawPointText(points, eachSeries, config, context);
					break;
				case 'meter':
					var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
					drawPointText(points, eachSeries, config, context);
					break;
			}
		});
	}

	context.restore();

	return {
		xAxisPoints: xAxisPoints,
		calPoints: calPoints,
		eachSpacing: eachSpacing
	};
}

function drawCandleDataPoints(series, seriesMA, opts, config, context) {
	var process = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
	var candleOption = opts.extra.candle || {
		color: {},
		average: {}
	};
	candleOption.color.upLine = candleOption.color.upLine ? candleOption.color.upLine : '#f04864';
	candleOption.color.upFill = candleOption.color.upFill ? candleOption.color.upFill : '#f04864';
	candleOption.color.downLine = candleOption.color.downLine ? candleOption.color.downLine : '#2fc25b';
	candleOption.color.downFill = candleOption.color.downFill ? candleOption.color.downFill : '#2fc25b';
	candleOption.average.show = candleOption.average.show === true ? true : false;
	candleOption.average.name = candleOption.average.name ? candleOption.average.name : [];
	candleOption.average.day = candleOption.average.day ? candleOption.average.day : [];
	candleOption.average.color = candleOption.average.color ? candleOption.average.color : ['#1890ff', '#2fc25b',
		'#facc14', '#f04864', '#8543e0', '#90ed7d'
	];
	opts.extra.candle = candleOption;

	var _calYAxisData5 = calYAxisData(series, opts, config),
		ranges = _calYAxisData5.ranges;

	var _getXAxisPoints5 = getXAxisPoints(opts.categories, opts, config),
		xAxisPoints = _getXAxisPoints5.xAxisPoints,
		eachSpacing = _getXAxisPoints5.eachSpacing;

	var minRange = ranges.pop();
	var maxRange = ranges.shift();
	var calPoints = [];

	context.save();
	if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
		context.translate(opts._scrollDistance_, 0);
	}
	//画均线
	if (candleOption.average.show) {
		seriesMA.forEach(function(eachSeries, seriesIndex) {
			var data = eachSeries.data;
			var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
			//calPoints.push(points);
			var splitPointList = splitPoints(points);

			splitPointList.forEach(function(points, index) {
				context.beginPath();
				context.setStrokeStyle(eachSeries.color);
				context.setLineWidth(1);
				if (points.length === 1) {
					context.moveTo(points[0].x, points[0].y);
					context.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI);
				} else {
					context.moveTo(points[0].x, points[0].y);
					points.forEach(function(item, index) {
						if (index > 0) {
							var ctrlPoint = createCurveControlPoints(points, index - 1);
							context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x, item
								.y);
						}
					});
					context.moveTo(points[0].x, points[0].y);
				}
				context.closePath();
				context.stroke();
			});
		});
	}
	//画K线
	series.forEach(function(eachSeries, seriesIndex) {
		var data = eachSeries.data;
		var points = getCandleDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
		calPoints.push(points);
		var splitPointList = splitPoints(points);
		splitPointList = splitPointList[0];

		splitPointList.forEach(function(points, index) {
			context.beginPath();
			//如果上涨
			if (data[index][1] - data[index][0] > 0) {
				context.setStrokeStyle(candleOption.color.upLine);
				context.setFillStyle(candleOption.color.upFill);
				context.setLineWidth(1 * opts.pixelRatio);
				context.moveTo(points[3].x, points[3].y); //顶点
				context.lineTo(points[1].x, points[1].y); //收盘中间点
				context.lineTo(points[1].x - eachSpacing / 4, points[1].y); //收盘左侧点
				context.lineTo(points[0].x - eachSpacing / 4, points[0].y); //开盘左侧点
				context.lineTo(points[0].x, points[0].y); //开盘中间点
				context.lineTo(points[2].x, points[2].y); //底点
				context.lineTo(points[0].x, points[0].y); //开盘中间点
				context.lineTo(points[0].x + eachSpacing / 4, points[0].y); //开盘右侧点
				context.lineTo(points[1].x + eachSpacing / 4, points[1].y); //收盘右侧点
				context.lineTo(points[1].x, points[1].y); //收盘中间点
				context.moveTo(points[3].x, points[3].y); //顶点
			} else {
				context.setStrokeStyle(candleOption.color.downLine);
				context.setFillStyle(candleOption.color.downFill);
				context.setLineWidth(1 * opts.pixelRatio);
				context.moveTo(points[3].x, points[3].y); //顶点
				context.lineTo(points[0].x, points[0].y); //开盘中间点
				context.lineTo(points[0].x - eachSpacing / 4, points[0].y); //开盘左侧点
				context.lineTo(points[1].x - eachSpacing / 4, points[1].y); //收盘左侧点
				context.lineTo(points[1].x, points[1].y); //收盘中间点
				context.lineTo(points[2].x, points[2].y); //底点
				context.lineTo(points[1].x, points[1].y); //收盘中间点
				context.lineTo(points[1].x + eachSpacing / 4, points[1].y); //收盘右侧点
				context.lineTo(points[0].x + eachSpacing / 4, points[0].y); //开盘右侧点
				context.lineTo(points[0].x, points[0].y); //开盘中间点
				context.moveTo(points[3].x, points[3].y); //顶点
			}
			context.closePath();
			context.fill();
			context.stroke();
		});
	});


	context.restore();



	return {
		xAxisPoints: xAxisPoints,
		calPoints: calPoints,
		eachSpacing: eachSpacing
	};
}

function drawAreaDataPoints(series, opts, config, context) {
	var process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
	var areaOption = opts.extra.area || {
		type: 'straight',
		opacity: 0.5,
		addLine: false,
		width: 2
	};
	areaOption.type = areaOption.type ? areaOption.type : 'straight';
	areaOption.opacity = areaOption.opacity ? areaOption.opacity : 0.2;
	areaOption.addLine = areaOption.addLine == true ? true : false;
	areaOption.width = areaOption.width ? areaOption.width : 2;
	var _calYAxisData2 = calYAxisData(series, opts, config),
		ranges = _calYAxisData2.ranges;

	var _getXAxisPoints2 = getXAxisPoints(opts.categories, opts, config),
		xAxisPoints = _getXAxisPoints2.xAxisPoints,
		eachSpacing = _getXAxisPoints2.eachSpacing;

	var minRange = ranges.pop();
	var maxRange = ranges.shift();
	var endY = opts.height - config.padding - config.xAxisHeight - config.legendHeight;
	var calPoints = [];

	context.save();
	if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
		context.translate(opts._scrollDistance_, 0);
	}

	if (opts.tooltip && opts.tooltip.textList && opts.tooltip.textList.length && process === 1) {
		drawToolTipSplitLine(opts.tooltip.offset.x, opts, config, context);
	}


	series.forEach(function(eachSeries, seriesIndex) {
		let data = eachSeries.data;
		let points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
		calPoints.push(points);

		let splitPointList = splitPoints(points);

		for (let i = 0; i < splitPointList.length; i++) {
			let points = splitPointList[i];
			// 绘制区域数
			context.beginPath();
			context.setStrokeStyle(hexToRgb(eachSeries.color, areaOption.opacity));
			context.setFillStyle(hexToRgb(eachSeries.color, areaOption.opacity));
			context.setLineWidth(areaOption.width * opts.pixelRatio);
			if (points.length > 1) {
				let firstPoint = points[0];
				let lastPoint = points[points.length - 1];

				context.moveTo(firstPoint.x, firstPoint.y);
				if (areaOption.type === 'curve') {
					points.forEach(function(item, index) {
						if (index > 0) {
							let ctrlPoint = createCurveControlPoints(points, index - 1);
							context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x, item
								.y);
						}
					});
				} else {
					points.forEach(function(item, index) {
						if (index > 0) {
							context.lineTo(item.x, item.y);
						}
					});
				}

				context.lineTo(lastPoint.x, endY);
				context.lineTo(firstPoint.x, endY);
				context.lineTo(firstPoint.x, firstPoint.y);
			} else {
				let item = points[0];
				context.moveTo(item.x - eachSpacing / 2, item.y);
				context.lineTo(item.x + eachSpacing / 2, item.y);
				context.lineTo(item.x + eachSpacing / 2, endY);
				context.lineTo(item.x - eachSpacing / 2, endY);
				context.moveTo(item.x - eachSpacing / 2, item.y);
			}
			context.closePath();
			context.fill();


			//画连线
			if (areaOption.addLine) {
				context.beginPath();
				context.setStrokeStyle(eachSeries.color);
				context.setLineWidth(areaOption.width * opts.pixelRatio);
				if (points.length === 1) {
					context.moveTo(points[0].x, points[0].y);
					context.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI);
				} else {
					context.moveTo(points[0].x, points[0].y);
					if (areaOption.type === 'curve') {
						points.forEach(function(item, index) {
							if (index > 0) {
								let ctrlPoint = createCurveControlPoints(points, index - 1);
								context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x,
									item.y);
							}
						});
					} else {
						points.forEach(function(item, index) {
							if (index > 0) {
								context.lineTo(item.x, item.y);
							}
						});
					}
					context.moveTo(points[0].x, points[0].y);
				}
				context.closePath();
				context.stroke();
			}
		}

		//画点
		if (opts.dataPointShape !== false) {
			var shape = config.dataPointShape[seriesIndex % config.dataPointShape.length];
			drawPointShape(points, eachSeries.color, shape, context, opts);
		}

	});
	if (opts.dataLabel !== false && process === 1) {
		series.forEach(function(eachSeries, seriesIndex) {
			var data = eachSeries.data;
			var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
			drawPointText(points, eachSeries, config, context);
		});
	}

	context.restore();

	return {
		xAxisPoints: xAxisPoints,
		calPoints: calPoints,
		eachSpacing: eachSpacing
	};
}

function drawLineDataPoints(series, opts, config, context) {
	var process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
	var lineOption = opts.extra.line || {
		type: 'straight',
		width: 2
	};
	lineOption.type = lineOption.type ? lineOption.type : 'straight';
	lineOption.width = lineOption.width ? lineOption.width : 2;
	var _calYAxisData3 = calYAxisData(series, opts, config),
		ranges = _calYAxisData3.ranges;

	var _getXAxisPoints3 = getXAxisPoints(opts.categories, opts, config),
		xAxisPoints = _getXAxisPoints3.xAxisPoints,
		eachSpacing = _getXAxisPoints3.eachSpacing;

	var minRange = ranges.pop();
	var maxRange = ranges.shift();
	var calPoints = [];

	context.save();
	if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
		context.translate(opts._scrollDistance_, 0);
	}

	if (opts.tooltip && opts.tooltip.textList && opts.tooltip.textList.length && process === 1) {
		drawToolTipSplitLine(opts.tooltip.offset.x, opts, config, context);
	}

	series.forEach(function(eachSeries, seriesIndex) {
		var data = eachSeries.data;
		var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
		calPoints.push(points);
		var splitPointList = splitPoints(points);

		splitPointList.forEach(function(points, index) {
			context.beginPath();
			context.setStrokeStyle(eachSeries.color);
			context.setLineWidth(lineOption.width * opts.pixelRatio);
			if (points.length === 1) {
				context.moveTo(points[0].x, points[0].y);
				context.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI);
			} else {
				context.moveTo(points[0].x, points[0].y);
				if (lineOption.type === 'curve') {
					points.forEach(function(item, index) {
						if (index > 0) {
							var ctrlPoint = createCurveControlPoints(points, index - 1);
							context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x, item
								.y);
						}
					});
				} else {
					points.forEach(function(item, index) {
						if (index > 0) {
							context.lineTo(item.x, item.y);
						}
					});
				}
				context.moveTo(points[0].x, points[0].y);
			}
			context.closePath();
			context.stroke();
		});

		if (opts.dataPointShape !== false) {
			var shape = config.dataPointShape[seriesIndex % config.dataPointShape.length];
			drawPointShape(points, eachSeries.color, shape, context, opts);
		}
	});
	if (opts.dataLabel !== false && process === 1) {
		series.forEach(function(eachSeries, seriesIndex) {
			var data = eachSeries.data;
			var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
			drawPointText(points, eachSeries, config, context);
		});
	}

	context.restore();

	return {
		xAxisPoints: xAxisPoints,
		calPoints: calPoints,
		eachSpacing: eachSpacing
	};
}

function drawMixDataPoints(series, opts, config, context) {
	var process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;

	var _calYAxisData6 = calYAxisData(series, opts, config),
		ranges = _calYAxisData6.ranges;

	var _getXAxisPoints6 = getXAxisPoints(opts.categories, opts, config),
		xAxisPoints = _getXAxisPoints6.xAxisPoints,
		eachSpacing = _getXAxisPoints6.eachSpacing;

	var minRange = ranges.pop();
	var maxRange = ranges.shift();
	var endY = opts.height - config.padding - config.xAxisHeight - config.legendHeight;
	var calPoints = [];

	var columnIndex = 0;
	var columnLength = 0;
	series.forEach(function(eachSeries, seriesIndex) {
		if (eachSeries.type == 'column') {
			columnLength += 1;
		}
	});
	context.save();
	if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
		context.translate(opts._scrollDistance_, 0);
	}

	if (opts.tooltip && opts.tooltip.textList && opts.tooltip.textList.length && process === 1) {
		drawToolTipSplitLine(opts.tooltip.offset.x, opts, config, context);
	}

	series.forEach(function(eachSeries, seriesIndex) {
		var data = eachSeries.data;
		var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
		calPoints.push(points);

		// 绘制柱状数据图
		if (eachSeries.type == 'column') {
			points = fixColumeData(points, eachSpacing, columnLength, columnIndex, config, opts);
			points.forEach(function(item, index) {
				if (item !== null) {
					context.beginPath();
					context.setFillStyle(item.color || eachSeries.color);
					var startX = item.x - item.width / 2 + 1;
					var height = opts.height - item.y - config.padding - config.xAxisHeight - config.legendHeight;
					context.moveTo(startX, item.y);
					context.rect(startX, item.y, item.width - 2, height);
					context.closePath();
					context.fill();
				}
			});
			columnIndex += 1;
		}

		//绘制区域图数据

		if (eachSeries.type == 'area') {
			let splitPointList = splitPoints(points);
			for (let i = 0; i < splitPointList.length; i++) {
				let points = splitPointList[i];
				// 绘制区域数据
				context.beginPath();
				context.setStrokeStyle(eachSeries.color);
				context.setFillStyle(eachSeries.color);
				context.setGlobalAlpha(0.2);
				context.setLineWidth(2 * opts.pixelRatio);
				if (points.length > 1) {
					var firstPoint = points[0];
					let lastPoint = points[points.length - 1];
					context.moveTo(firstPoint.x, firstPoint.y);
					if (eachSeries.style === 'curve') {
						points.forEach(function(item, index) {
							if (index > 0) {
								var ctrlPoint = createCurveControlPoints(points, index - 1);
								context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x,
									item.y);
							}
						});
					} else {
						points.forEach(function(item, index) {
							if (index > 0) {
								context.lineTo(item.x, item.y);
							}
						});
					}
					context.lineTo(lastPoint.x, endY);
					context.lineTo(firstPoint.x, endY);
					context.lineTo(firstPoint.x, firstPoint.y);
				} else {
					let item = points[0];
					context.moveTo(item.x - eachSpacing / 2, item.y);
					context.lineTo(item.x + eachSpacing / 2, item.y);
					context.lineTo(item.x + eachSpacing / 2, endY);
					context.lineTo(item.x - eachSpacing / 2, endY);
					context.moveTo(item.x - eachSpacing / 2, item.y);
				}
				context.closePath();
				context.fill();
				context.setGlobalAlpha(1);
			}
		}
		
		// 绘制折线数据图
		if (eachSeries.type == 'line') {
			var splitPointList = splitPoints(points);
			splitPointList.forEach(function(points, index) {
				context.beginPath();
				context.setStrokeStyle(eachSeries.color);
				context.setLineWidth(2 * opts.pixelRatio);
				if (points.length === 1) {
					context.moveTo(points[0].x, points[0].y);
					context.arc(points[0].x, points[0].y, 1, 0, 2 * Math.PI);
				} else {
					context.moveTo(points[0].x, points[0].y);
					if (eachSeries.style == 'curve') {
						points.forEach(function(item, index) {
							if (index > 0) {
								var ctrlPoint = createCurveControlPoints(points, index - 1);
								context.bezierCurveTo(ctrlPoint.ctrA.x, ctrlPoint.ctrA.y, ctrlPoint.ctrB.x, ctrlPoint.ctrB.y, item.x,
									item.y);
							}
						});
					} else {
						points.forEach(function(item, index) {
							if (index > 0) {
								context.lineTo(item.x, item.y);
							}
						});
					}
					context.moveTo(points[0].x, points[0].y);
				}
				context.closePath();
				context.stroke();
			});
		}

		// 绘制点数据图
		if (eachSeries.type == 'point') {
			points.forEach(function(pointsa, index) {
				if(pointsa){
					context.beginPath();
					context.setFillStyle(eachSeries.color);
					context.setStrokeStyle('#FFFFFF');
					context.setLineWidth(1 * opts.pixelRatio);
					context.moveTo(pointsa.x + 3.5 * opts.pixelRatio, pointsa.y);
					context.arc(pointsa.x, pointsa.y, 4* opts.pixelRatio, 0, 2 * Math.PI);
					context.closePath();
					context.fill();
					context.stroke();
				}
			});
		}

		if (eachSeries.addPoint == true && eachSeries.type !== 'column') {
			var shape = config.dataPointShape[seriesIndex % config.dataPointShape.length];
			drawPointShape(points, eachSeries.color, shape, context, opts);
		}
	});
	if (opts.dataLabel !== false && process === 1) {
		var columnIndex = 0;
		series.forEach(function(eachSeries, seriesIndex) {
			var data = eachSeries.data;
			var points = getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process);
			if (eachSeries.type !== 'column') {
				drawPointText(points, eachSeries, config, context);
			} else {
				points = fixColumeData(points, eachSpacing, columnLength, columnIndex, config, opts);
				drawPointText(points, eachSeries, config, context);
				columnIndex += 1;
			}

		});
	}

	context.restore();

	return {
		xAxisPoints: xAxisPoints,
		calPoints: calPoints,
		eachSpacing: eachSpacing
	};
}

function drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints) {
	var toolTipOption = opts.extra.tooltip || {};
	if (toolTipOption.horizentalLine && opts.tooltip && process === 1 && (opts.type == 'line' || opts.type == 'area' ||
			opts.type == 'column' || opts.type == 'candle' || opts.type == 'mix')) {
		drawToolTipHorizentalLine(opts, config, context, eachSpacing, xAxisPoints)
	}
	context.save();
	if (opts._scrollDistance_ && opts._scrollDistance_ !== 0 && opts.enableScroll === true) {
		context.translate(opts._scrollDistance_, 0);
	}
	if (opts.tooltip && opts.tooltip.textList && opts.tooltip.textList.length && process === 1) {
		drawToolTip(opts.tooltip.textList, opts.tooltip.offset, opts, config, context, eachSpacing, xAxisPoints);
	}
	context.restore();

}

function drawXAxis(categories, opts, config, context) {

	var _getXAxisPoints4 = getXAxisPoints(categories, opts, config),
		xAxisPoints = _getXAxisPoints4.xAxisPoints,
		startX = _getXAxisPoints4.startX,
		endX = _getXAxisPoints4.endX,
		eachSpacing = _getXAxisPoints4.eachSpacing;

	var startY = opts.height - config.padding - config.xAxisHeight - config.legendHeight;
	var endY = config.padding;


	//绘制滚动条
	if (opts.enableScroll && opts.xAxis.scrollShow) {
		var scrollY = opts.height - config.padding - config.legendHeight + 6 * opts.pixelRatio;
		var scrollScreenWidth = endX - startX;
		var scrollTotalWidth = eachSpacing * (xAxisPoints.length - 1);
		var scrollWidth = scrollScreenWidth * scrollScreenWidth / scrollTotalWidth;
		var scrollLeft = 0;
		if (opts._scrollDistance_) {
			scrollLeft = -opts._scrollDistance_ * (scrollScreenWidth) / scrollTotalWidth;
		}
		context.beginPath();
		context.setLineCap('round');
		context.setLineWidth(6 * opts.pixelRatio);
		context.setStrokeStyle(opts.xAxis.scrollBackgroundColor || "#EFEBEF");
		context.moveTo(startX, scrollY);
		context.lineTo(endX, scrollY);
		context.stroke();
		context.closePath();
		context.beginPath();
		context.setLineCap('round');
		context.setLineWidth(6 * opts.pixelRatio);
		context.setStrokeStyle(opts.xAxis.scrollColor || "#A6A6A6");
		context.moveTo(startX + scrollLeft, scrollY);
		context.lineTo(startX + scrollLeft + scrollWidth, scrollY);
		context.stroke();
		context.setLineCap('butt');
		context.closePath();
	}

	context.save();

	if (opts._scrollDistance_ && opts._scrollDistance_ !== 0) {
		context.translate(opts._scrollDistance_, 0);
	}

	context.beginPath();
	context.setStrokeStyle(opts.xAxis.gridColor || "#cccccc");
	context.setLineCap('butt');
	context.setLineWidth(1 * opts.pixelRatio);
	if (opts.xAxis.gridType == 'dash') {
		context.setLineDash([opts.xAxis.dashLength, opts.xAxis.dashLength]);
	}
	if (opts.xAxis.disableGrid !== true) {
		if (opts.xAxis.type === 'calibration') {
			xAxisPoints.forEach(function(item, index) {
				if (index > 0) {
					context.moveTo(item - eachSpacing / 2, startY);
					context.lineTo(item - eachSpacing / 2, startY + 4 * opts.pixelRatio);
				}
			});
		} else {
			opts.xAxis.gridEval = opts.xAxis.gridEval || 1; 
			xAxisPoints.forEach(function(item, index) {
				if(index % opts.xAxis.gridEval == 0){
					context.moveTo(item, startY);
					context.lineTo(item, endY);
				}
			});
		}
	}
	context.closePath();
	context.stroke();
	context.setLineDash([]);

	//不绘制X轴
	if (opts.xAxis.disabled !== true) {
		// 对X轴列表做抽稀处理
		let validWidth = opts.width - 2 * config.padding - config.yAxisWidth - config.yAxisTitleWidth;
		//默认全部显示X轴标签
		let maxXAxisListLength = categories.length;
		//如果设置了X轴单屏数量
		if (opts.xAxis.labelCount) {
			//如果设置X轴密度
			if (opts.xAxis.itemCount) {
				maxXAxisListLength = Math.ceil(categories.length / opts.xAxis.itemCount * opts.xAxis.labelCount);
			} else {
				maxXAxisListLength = opts.xAxis.labelCount;
			}
			maxXAxisListLength -= 1;
		}

		let ratio = Math.ceil(categories.length / maxXAxisListLength);

		let newCategories = [];
		let cgLength = categories.length;
		for (let i = 0; i < cgLength; i++) {
			if (i % ratio !== 0) {
				newCategories.push("");
			} else {
				newCategories.push(categories[i]);
			}
		}
		newCategories[cgLength - 1] = categories[cgLength - 1];
		/*
		categories = categories.map(function (item, index) {
			return index % ratio !== 0 ? '' : item;
		});*/

		var xAxisFontSize = opts.xAxis.fontSize || config.fontSize;
		if (config._xAxisTextAngle_ === 0) {
			newCategories.forEach(function(item, index) {
				var offset = eachSpacing / 2 - measureText(item,xAxisFontSize) / 2;
				context.beginPath();
				context.setFontSize(xAxisFontSize);
				context.setFillStyle(opts.xAxis.fontColor || '#666666');
				context.fillText(item, xAxisPoints[index] + offset, startY + xAxisFontSize + 5);
				context.closePath();
				context.stroke();
			});

		} else {
			newCategories.forEach(function(item, index) {
				context.save();
				context.beginPath();
				context.setFontSize(xAxisFontSize);
				context.setFillStyle(opts.xAxis.fontColor || '#666666');
				var textWidth = measureText(item);
				var offset = eachSpacing / 2 - textWidth;

				var _calRotateTranslate = calRotateTranslate(xAxisPoints[index] + eachSpacing / 2, startY + xAxisFontSize / 2 + 5, opts.height),
					transX = _calRotateTranslate.transX,
					transY = _calRotateTranslate.transY;

				context.rotate(-1 * config._xAxisTextAngle_);
				context.translate(transX, transY);
				context.fillText(item, xAxisPoints[index] + offset, startY + xAxisFontSize + 5);
				context.closePath();
				context.stroke();
				context.restore();
			});
		}
	}
	context.restore();

}

function drawYAxisGrid(categories, opts, config, context) {
	if (opts.yAxis.disableGrid === true) {
		return;
	}
	var spacingValid = opts.height - 2 * config.padding - config.xAxisHeight - config.legendHeight;
	var eachSpacing = Math.floor(spacingValid / config.yAxisSplit);
	var yAxisTotalWidth = config.yAxisWidth + config.yAxisTitleWidth;
	var startX = config.padding + yAxisTotalWidth;
	var _getXAxisPoints4 = getXAxisPoints(categories, opts, config),
		xAxisPoints = _getXAxisPoints4.xAxisPoints,
		xAxiseachSpacing = _getXAxisPoints4.eachSpacing;
	var TotalWidth = xAxiseachSpacing * (xAxisPoints.length - 1);
	var endX = startX + TotalWidth;

	var points = [];
	for (var i = 0; i < config.yAxisSplit; i++) {
		points.push(config.padding + eachSpacing * i);
	}
	points.push(config.padding + eachSpacing * config.yAxisSplit + 2);

	context.save();
	if (opts._scrollDistance_ && opts._scrollDistance_ !== 0) {
		context.translate(opts._scrollDistance_, 0);
	}

	if (opts.yAxis.gridType == 'dash') {
		context.setLineDash([opts.yAxis.dashLength, opts.yAxis.dashLength]);
	}
	context.beginPath();
	context.setStrokeStyle(opts.yAxis.gridColor || "#cccccc");

	context.setLineWidth(1 * opts.pixelRatio);
	points.forEach(function(item, index) {
		context.moveTo(startX, item);
		context.lineTo(endX, item);
	});
	context.closePath();
	context.stroke();
	context.setLineDash([]);

	context.restore();
}

function drawYAxis(series, opts, config, context) {
	if (opts.yAxis.disabled === true) {
		return;
	}

	var _calYAxisData4 = calYAxisData(series, opts, config),
		rangesFormat = _calYAxisData4.rangesFormat;

	var yAxisTotalWidth = config.yAxisWidth + config.yAxisTitleWidth;

	var spacingValid = opts.height - 2 * config.padding - config.xAxisHeight - config.legendHeight;
	var eachSpacing = Math.floor(spacingValid / config.yAxisSplit);
	var startX = config.padding + yAxisTotalWidth;
	var endX = opts.width - config.padding;
	var endY = opts.height - config.padding - config.xAxisHeight - config.legendHeight + config.xAxisTextPadding;

	// set YAxis background
	context.beginPath();
	context.setFillStyle(opts.background || '#ffffff');
	if (opts._scrollDistance_ < 0) {
		context.fillRect(0, 0, startX, endY + config.xAxisHeight);
	}
	context.fillRect(endX, 0, opts.width, endY + config.xAxisHeight);
	context.closePath();
	context.stroke();

	var points = [];
	for (var i = 0; i <= config.yAxisSplit; i++) {
		points.push(config.padding + eachSpacing * i);
	}

	var yAxisFontSize = opts.yAxis.fontSize || config.fontSize;
	rangesFormat.forEach(function(item, index) {
		var pos = points[index] ? points[index] : endY;
		context.beginPath();
		context.setFontSize(yAxisFontSize);
		context.setFillStyle(opts.yAxis.fontColor || '#666666');
		context.fillText(item, config.padding + config.yAxisTitleWidth, pos + yAxisFontSize / 2);
		context.closePath();
		context.stroke();
	});


	if (opts.yAxis.title) {
		drawYAxisTitle(opts.yAxis.title, opts, config, context);
	}
}

function drawLegend(series, opts, config, context) {
	if (opts.legend === false) {
		return;
	}
	// each legend shape width 15px
	// the spacing between shape and text in each legend is the `padding`
	// each legend spacing is the `padding`
	// legend margin top `config.padding`

	var _calLegendData = calLegendData(series, opts, config),
		legendList = _calLegendData.legendList;

	var padding = 5 * opts.pixelRatio;
	var marginTop = 10 * opts.pixelRatio;
	var shapeWidth = 15 * opts.pixelRatio;
	legendList.forEach(function(itemList, listIndex) {
		var width = 0;
		for (let i = 0; i < itemList.length; i++) {
			let item = itemList[i];
			item.name = item.name || 'undefined';
			width += 3 * padding + measureText(item.name) + shapeWidth;
		}
		var startX = (opts.width - width) / 2 + padding;
		var startY = opts.height - config.padding - config.legendHeight + listIndex * (config.fontSize + marginTop) +
			padding + marginTop;

		context.setFontSize(config.fontSize);
		for (let i = 0; i < itemList.length; i++) {
			let item = itemList[i];
			switch (opts.type) {
				case 'line':
					context.beginPath();
					context.setLineWidth(1 * opts.pixelRatio);
					context.setStrokeStyle(item.color);
					context.setFillStyle(item.color);
					context.moveTo(startX + 7.5 * opts.pixelRatio, startY + 5 * opts.pixelRatio);
					context.arc(startX + 7.5 * opts.pixelRatio, startY + 5 * opts.pixelRatio, 6 * opts.pixelRatio, 0, 2 * Math.PI);
					context.closePath();
					context.fill();
					context.stroke();
					break;
				case 'pie':
					context.beginPath();
					context.setLineWidth(1 * opts.pixelRatio);
					context.setStrokeStyle(item.color);
					context.setFillStyle(item.color);
					context.moveTo(startX + 7.5 * opts.pixelRatio, startY + 5 * opts.pixelRatio);
					context.arc(startX + 7.5 * opts.pixelRatio, startY + 5 * opts.pixelRatio, 6 * opts.pixelRatio, 0, 2 * Math.PI);
					context.closePath();
					context.fill();
					context.stroke();
					break;
				case 'ring':
				case 'rose':
					context.beginPath();
					context.setLineWidth(1 * opts.pixelRatio);
					context.setStrokeStyle(item.color);
					context.setFillStyle(item.color);
					context.moveTo(startX + 7.5 * opts.pixelRatio, startY + 5 * opts.pixelRatio);
					context.arc(startX + 7.5 * opts.pixelRatio, startY + 5 * opts.pixelRatio, 6 * opts.pixelRatio, 0, 2 * Math.PI);
					context.closePath();
					context.fill();
					context.stroke();
					break;
					//圆弧进度图不显示图例
				case 'gauge':
					break;
				case 'arcbar':
					break;
				default:
					context.beginPath();
					context.setLineWidth(1 * opts.pixelRatio);
					context.setStrokeStyle(item.color);
					context.setFillStyle(item.color);
					context.moveTo(startX, startY);
					context.fillRect(startX, startY, 15 * opts.pixelRatio, 10 * opts.pixelRatio);
					context.closePath();
					context.fill();
					context.stroke();
			}
			startX += padding + shapeWidth;
			context.beginPath();
			context.setFontSize(config.fontSize);
			context.setFillStyle(opts.extra.legendTextColor || '#333333');
			context.fillText(item.name, startX, startY + 6 * opts.pixelRatio + 3 * opts.pixelRatio);
			context.closePath();
			context.stroke();
			startX += measureText(item.name) + 2 * padding;
		}
	});
}

function drawPieDataPoints(series, opts, config, context) {
	var process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;

	var pieOption = opts.extra.pie || {};
	var centerPosition = {
		x: opts.width / 2,
		y: (opts.height - config.legendHeight) / 2
	};
	var radius = Math.min(centerPosition.x - config.pieChartLinePadding - config.pieChartTextPadding - config._pieTextMaxLength_,
		centerPosition.y - config.pieChartLinePadding - config.pieChartTextPadding);
	if (opts.dataLabel) {
		radius -= 10;
	} else {
		radius -= 2 * config.padding;
	}
	series = getPieDataPoints(series, radius, process);

	var activeRadius = config.pieChartLinePadding / 2;

	series = series.map(function(eachSeries) {
		eachSeries._start_ += (pieOption.offsetAngle || 0) * Math.PI / 180;
		return eachSeries;
	});
	series.forEach(function(eachSeries, seriesIndex) {
		if (opts.tooltip) {
			if (opts.tooltip.index == seriesIndex) {
				context.beginPath();
				context.setFillStyle(hexToRgb(eachSeries.color, opts.extra.pie.activeOpacity || 0.5));
				context.moveTo(centerPosition.x, centerPosition.y);
				context.arc(centerPosition.x, centerPosition.y, eachSeries._radius_+activeRadius, eachSeries._start_, eachSeries._start_ + 2 *
					eachSeries._proportion_ * Math.PI);
				context.closePath();
				context.fill();
			}
		}
		context.beginPath();
		context.setLineWidth(2 * opts.pixelRatio);
		context.lineJoin = "round";
		context.setStrokeStyle('#ffffff');
		context.setFillStyle(eachSeries.color);
		context.moveTo(centerPosition.x, centerPosition.y);
		context.arc(centerPosition.x, centerPosition.y, eachSeries._radius_, eachSeries._start_, eachSeries._start_ + 2 * eachSeries._proportion_ *
			Math.PI);
		context.closePath();
		context.fill();
		if (opts.disablePieStroke !== true) {
			context.stroke();
		}
	});

	if (opts.type === 'ring') {
		var innerPieWidth = radius * 0.6;
		if (typeof opts.extra.pie.ringWidth === 'number' && opts.extra.pie.ringWidth > 0) {
			innerPieWidth = Math.max(0, radius - opts.extra.pie.ringWidth);
		}
		context.beginPath();
		context.setFillStyle(opts.background || '#ffffff');
		context.moveTo(centerPosition.x, centerPosition.y);
		context.arc(centerPosition.x, centerPosition.y, innerPieWidth, 0, 2 * Math.PI);
		context.closePath();
		context.fill();
	}

	if (opts.dataLabel !== false && process === 1) {
		var valid = false;
		for (var i = 0, len = series.length; i < len; i++) {
			if (series[i].data > 0) {
				valid = true;
				break;
			}
		}

		if (valid) {
			drawPieText(series, opts, config, context, radius, centerPosition);
		}
	}

	if (process === 1 && opts.type === 'ring') {
		drawRingTitle(opts, config, context);
	}

	return {
		center: centerPosition,
		radius: radius,
		series: series
	};
}

function drawRoseDataPoints(series, opts, config, context) {
	var process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;

	var roseOption = opts.extra.rose || {};
	roseOption.type = roseOption.type || 'area';
	var centerPosition = {
		x: opts.width / 2,
		y: (opts.height - config.legendHeight) / 2
	};
	var radius = Math.min(centerPosition.x - config.pieChartLinePadding - config.pieChartTextPadding - config._pieTextMaxLength_,
		centerPosition.y - config.pieChartLinePadding - config.pieChartTextPadding);
	if (opts.dataLabel) {
		radius -= 10;
	} else {
		radius -= 2 * config.padding;
	}
	var minRadius = roseOption.minRadius || radius*0.5;
	
	series = getRoseDataPoints(series, roseOption.type, minRadius, radius, process);

	var activeRadius = config.pieChartLinePadding / 2;


	series = series.map(function(eachSeries) {
		eachSeries._start_ += (roseOption.offsetAngle || 0) * Math.PI / 180;
		return eachSeries;
	});
	
	series.forEach(function(eachSeries, seriesIndex) {
		if (opts.tooltip) {
			if (opts.tooltip.index == seriesIndex) {
				context.beginPath();
				context.setFillStyle(hexToRgb(eachSeries.color, roseOption.activeOpacity || 0.5));
				context.moveTo(centerPosition.x, centerPosition.y);
				context.arc(centerPosition.x, centerPosition.y, activeRadius+eachSeries._radius_, eachSeries._start_, eachSeries._start_ + 2 * eachSeries._proportion_ * Math.PI);
				context.closePath();
				context.fill();
			}
		}
		context.beginPath();
		context.setLineWidth(2 * opts.pixelRatio);
		context.lineJoin = "round";
		context.setStrokeStyle('#ffffff');
		context.setFillStyle(eachSeries.color);
		context.moveTo(centerPosition.x, centerPosition.y);
		context.arc(centerPosition.x, centerPosition.y, eachSeries._radius_ , eachSeries._start_, eachSeries._start_ + 2 * eachSeries._proportion_ *Math.PI);
		context.closePath();
		context.fill();
		if (opts.disablePieStroke !== true) {
			context.stroke();
		}
	});


	if (opts.dataLabel !== false && process === 1) {
		// fix https://github.com/xiaolin3303/wx-charts/issues/132
		var valid = false;
		for (var i = 0, len = series.length; i < len; i++) {
			if (series[i].data > 0) {
				valid = true;
				break;
			}
		}

		if (valid) {
			drawPieText(series, opts, config, context, radius, centerPosition);
		}
	}

	return {
		center: centerPosition,
		radius: radius,
		series: series
	};
}

function drawArcbarDataPoints(series, opts, config, context) {
	var process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;

	var arcbarOption = opts.extra.arcbar || {};
	arcbarOption.startAngle = arcbarOption.startAngle ? arcbarOption.startAngle : 0.75;
	arcbarOption.endAngle = arcbarOption.endAngle ? arcbarOption.endAngle : 0.25;
	arcbarOption.type = arcbarOption.type ? arcbarOption.type : 'default';

	series = getArcbarDataPoints(series, arcbarOption, process);
	var centerPosition = {
		x: opts.width / 2,
		y: (opts.height) / 2
	};
	var radius = Math.min(centerPosition.x, centerPosition.y);

	if (typeof arcbarOption.width === 'number' && arcbarOption.width > 0) {
		arcbarOption.width = arcbarOption.width;
	} else {
		arcbarOption.width = 12 * opts.pixelRatio;
	}
	radius -= config.padding + arcbarOption.width / 2;

	//背景颜色
	context.setLineWidth(arcbarOption.width); // 设置圆环的宽度
	context.setStrokeStyle(arcbarOption.backgroundColor || '#E9E9E9'); // 设置圆环的颜色
	context.setLineCap('round'); // 设置圆环端点的形状
	context.beginPath(); //开始一个新的路径
	if (arcbarOption.type == 'default') {
		context.arc(centerPosition.x, centerPosition.y, radius, arcbarOption.startAngle * Math.PI, arcbarOption.endAngle *
			Math.PI, false);
	} else {
		context.arc(centerPosition.x, centerPosition.y, radius, 0, 2 * Math.PI, false);
	}

	context.stroke(); //对当前路径进行描边

	for (let i = 0; i < series.length; i++) {
		let eachSeries = series[i];
		context.setLineWidth(arcbarOption.width);
		context.setStrokeStyle(eachSeries.color);
		context.setLineCap('round');
		context.beginPath();
		context.arc(centerPosition.x, centerPosition.y, radius, arcbarOption.startAngle * Math.PI, eachSeries._proportion_ *
			Math.PI, false);
		context.stroke();
	}
	drawRingTitle(opts, config, context);
	return {
		center: centerPosition,
		radius: radius,
		series: series
	};
}

function drawGaugeDataPoints(categories, series, opts, config, context) {
	var process = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
	var gaugeOption = opts.extra.gauge || {};
	gaugeOption.startAngle = gaugeOption.startAngle ? gaugeOption.startAngle : 0.75;
	if (gaugeOption.oldAngle == undefined) {
		gaugeOption.oldAngle = gaugeOption.startAngle;
	}
	if (gaugeOption.oldData == undefined) {
		gaugeOption.oldData = 0;
	}
	gaugeOption.endAngle = gaugeOption.endAngle ? gaugeOption.endAngle : 0.25;
	categories = getGaugeAxisPoints(categories, gaugeOption.startAngle, gaugeOption.endAngle);
	var centerPosition = {
		x: opts.width / 2,
		y: (opts.height) / 2
	};
	var radius = Math.min(centerPosition.x, centerPosition.y);
	if (typeof gaugeOption.width === 'number' && gaugeOption.width > 0) {
		gaugeOption.width = gaugeOption.width;
	} else {
		gaugeOption.width = 15 * opts.pixelRatio;
	}
	radius -= config.padding + gaugeOption.width / 2;
	var innerRadius = radius - gaugeOption.width;



	//画背景
	context.setLineWidth(gaugeOption.width);
	context.setLineCap('butt');
	for (let i = 0; i < categories.length; i++) {
		let eachCategories = categories[i];
		context.beginPath();
		context.setStrokeStyle(eachCategories.color);
		context.arc(centerPosition.x, centerPosition.y, radius, eachCategories._startAngle_ * Math.PI, eachCategories._endAngle_ *
			Math.PI, false);
		context.stroke();
	}
	context.save();

	//画刻度线
	let totalAngle = gaugeOption.startAngle - gaugeOption.endAngle + 1;
	gaugeOption.splitLine.fixRadius = gaugeOption.splitLine.fixRadius ? gaugeOption.splitLine.fixRadius : 0;
	gaugeOption.splitLine.splitNumber = gaugeOption.splitLine.splitNumber ? gaugeOption.splitLine.splitNumber : 10;
	gaugeOption.splitLine.width = gaugeOption.splitLine.width ? gaugeOption.splitLine.width : 15 * opts.pixelRatio;
	gaugeOption.splitLine.color = gaugeOption.splitLine.color ? gaugeOption.splitLine.color : '#FFFFFF';
	gaugeOption.splitLine.childNumber = gaugeOption.splitLine.childNumber ? gaugeOption.splitLine.childNumber : 5;
	gaugeOption.splitLine.childWidth = gaugeOption.splitLine.childWidth ? gaugeOption.splitLine.childWidth : 5 * opts.pixelRatio;

	let splitAngle = totalAngle / gaugeOption.splitLine.splitNumber;
	let childAngle = totalAngle / gaugeOption.splitLine.splitNumber / gaugeOption.splitLine.childNumber;
	let startX = -radius - gaugeOption.width * 0.5 - gaugeOption.splitLine.fixRadius;
	let endX = -radius - gaugeOption.width * 0.5 - gaugeOption.splitLine.fixRadius + gaugeOption.splitLine.width;
	let childendX = -radius - gaugeOption.width * 0.5 - gaugeOption.splitLine.fixRadius + gaugeOption.splitLine.childWidth;

	context.translate(centerPosition.x, centerPosition.y);
	context.rotate((gaugeOption.startAngle - 1) * Math.PI);

	for (let i = 0; i < gaugeOption.splitLine.splitNumber + 1; i++) {
		context.beginPath();
		context.setStrokeStyle(gaugeOption.splitLine.color);
		context.setLineWidth(2 * opts.pixelRatio);
		context.moveTo(startX, 0);
		context.lineTo(endX, 0);
		context.stroke();
		context.rotate(splitAngle * Math.PI);
	}
	context.restore();

	context.save();
	context.translate(centerPosition.x, centerPosition.y);
	context.rotate((gaugeOption.startAngle - 1) * Math.PI);

	for (let i = 0; i < gaugeOption.splitLine.splitNumber * gaugeOption.splitLine.childNumber + 1; i++) {
		context.beginPath();
		context.setStrokeStyle(gaugeOption.splitLine.color);
		context.setLineWidth(1 * opts.pixelRatio);
		context.moveTo(startX, 0);
		context.lineTo(childendX, 0);
		context.stroke();
		context.rotate(childAngle * Math.PI);
	}
	context.restore();

	//画指针
	gaugeOption.pointer.width = gaugeOption.pointer.width ? gaugeOption.pointer.width : 15 * opts.pixelRatio;
	if (gaugeOption.pointer.color == undefined || gaugeOption.pointer.color == 'auto') {
		gaugeOption.pointer.color == 'auto';
	} else {
		gaugeOption.pointer.color == gaugeOption.pointer.color;
	}
	series = getGaugeDataPoints(series, categories, gaugeOption, process);

	for (let i = 0; i < series.length; i++) {
		let eachSeries = series[i];
		context.save();
		context.translate(centerPosition.x, centerPosition.y);
		context.rotate((eachSeries._proportion_ - 1) * Math.PI);
		context.beginPath();
		context.setFillStyle(eachSeries.color);
		context.moveTo(gaugeOption.pointer.width, 0);
		context.lineTo(0, -gaugeOption.pointer.width / 2);
		context.lineTo(-innerRadius, 0);
		context.lineTo(0, gaugeOption.pointer.width / 2);
		context.lineTo(gaugeOption.pointer.width, 0);
		context.closePath();
		context.fill();
		context.beginPath();
		context.setFillStyle('#FFFFFF');
		context.arc(0, 0, gaugeOption.pointer.width / 6, 0, 2 * Math.PI, false);
		context.fill();
		context.restore();
	}

	if (opts.dataLabel !== false) {
		drawGaugeLabel(gaugeOption, radius, centerPosition, opts, config, context);
	}

	drawRingTitle(opts, config, context);

	if (process === 1 && opts.type === 'gauge') {
		gaugeOption.oldAngle = series[0]._proportion_;
		gaugeOption.oldData = series[0].data;
	}
	return {
		center: centerPosition,
		radius: radius,
		innerRadius: innerRadius,
		categories: categories,
		totalAngle: totalAngle
	};
}

function drawRadarDataPoints(series, opts, config, context) {
	var process = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;

	var radarOption = opts.extra.radar || {};
	var coordinateAngle = getRadarCoordinateSeries(opts.categories.length);
	var centerPosition = {
		x: opts.width / 2,
		y: (opts.height - config.legendHeight) / 2
	};

	var radius = Math.min(centerPosition.x - (getMaxTextListLength(opts.categories) + config.radarLabelTextMargin),
		centerPosition.y - config.radarLabelTextMargin);

	radius -= config.padding;

	// draw grid
	context.beginPath();
	context.setLineWidth(1 * opts.pixelRatio);
	context.setStrokeStyle(radarOption.gridColor || "#cccccc");
	coordinateAngle.forEach(function (angle) {
	    var pos = convertCoordinateOrigin(radius * Math.cos(angle), radius * Math.sin(angle), centerPosition);
	    context.moveTo(centerPosition.x, centerPosition.y);
	    context.lineTo(pos.x, pos.y);
	});
	context.stroke();
	context.closePath();

	// draw split line grid

	var _loop = function _loop(i) {
		var startPos = {};
		context.beginPath();
		context.setLineWidth(1 * opts.pixelRatio);
		context.setStrokeStyle(radarOption.gridColor || "#cccccc");
		coordinateAngle.forEach(function (angle, index) {
		    var pos = convertCoordinateOrigin(radius / config.radarGridCount * i * Math.cos(angle), radius / config.radarGridCount * i * Math.sin(angle), centerPosition);
		    if (index === 0) {
		        startPos = pos;
		        context.moveTo(pos.x, pos.y);
		    } else {
		        context.lineTo(pos.x, pos.y);
		    }
		});
		context.lineTo(startPos.x, startPos.y);
		context.stroke();
		context.closePath();
	};

	for (var i = 1; i <= config.radarGridCount; i++) {
		_loop(i);
	}

	var radarDataPoints = getRadarDataPoints(coordinateAngle, centerPosition, radius, series, opts, process);

	radarDataPoints.forEach(function(eachSeries, seriesIndex) {
		// 绘制区域数据
		context.beginPath();
		context.setFillStyle(eachSeries.color);
		context.setGlobalAlpha(0.3);
		eachSeries.data.forEach(function(item, index) {
			if (index === 0) {
				context.moveTo(item.position.x, item.position.y);
			} else {
				context.lineTo(item.position.x, item.position.y);
			}
		});
		context.closePath();
		context.fill();
		context.setGlobalAlpha(1);

		if (opts.dataPointShape !== false) {
			var shape = config.dataPointShape[seriesIndex % config.dataPointShape.length];
			var points = eachSeries.data.map(function(item) {
				return item.position;
			});
			drawPointShape(points, eachSeries.color, shape, context, opts);
		}
	});
	// draw label text
	drawRadarLabel(coordinateAngle, radius, centerPosition, opts, config, context);

	return {
		center: centerPosition,
		radius: radius,
		angleList: coordinateAngle
	};
}

function drawCanvas(opts, context) {
	context.draw();
}

var Timing = {
	easeIn: function easeIn(pos) {
		return Math.pow(pos, 3);
	},

	easeOut: function easeOut(pos) {
		return Math.pow(pos - 1, 3) + 1;
	},

	easeInOut: function easeInOut(pos) {
		if ((pos /= 0.5) < 1) {
			return 0.5 * Math.pow(pos, 3);
		} else {
			return 0.5 * (Math.pow(pos - 2, 3) + 2);
		}
	},

	linear: function linear(pos) {
		return pos;
	}
};

function Animation(opts) {
	this.isStop = false;
	opts.duration = typeof opts.duration === 'undefined' ? 1000 : opts.duration;
	opts.timing = opts.timing || 'linear';

	var delay = 17;

	var createAnimationFrame = function createAnimationFrame() {

		if (typeof requestAnimationFrame !== 'undefined') {
			return requestAnimationFrame;
		} else if (typeof setTimeout !== 'undefined') {

			return function(step, delay) {
				setTimeout(function() {
					var timeStamp = +new Date();
					step(timeStamp);
				}, delay);
			};
		} else {

			return function(step) {
				step(null);
			};
		}
	};
	var animationFrame = createAnimationFrame();
	var startTimeStamp = null;

	var _step = function step(timestamp) {

		if (timestamp === null || this.isStop === true) {
			opts.onProcess && opts.onProcess(1);
			opts.onAnimationFinish && opts.onAnimationFinish();
			return;
		}
		if (startTimeStamp === null) {
			startTimeStamp = timestamp;
		}
		if (timestamp - startTimeStamp < opts.duration) {
			var process = (timestamp - startTimeStamp) / opts.duration;
			var timingFunction = Timing[opts.timing];
			process = timingFunction(process);

			opts.onProcess && opts.onProcess(process);
			animationFrame(_step, delay);
		} else {
			opts.onProcess && opts.onProcess(1);
			opts.onAnimationFinish && opts.onAnimationFinish();
		}
	};
	_step = _step.bind(this);
	animationFrame(_step, delay);
}

// stop animation immediately
// and tigger onAnimationFinish
Animation.prototype.stop = function() {
	this.isStop = true;
};

function drawCharts(type, opts, config, context) {
	var _this = this;
	var series = opts.series;
	var categories = opts.categories;
	series = fillSeriesColor(series, config);
	series = fillSeriesType(series, opts);
	let seriesMA = null;
	
	if (type == 'candle') {
		let average = assign({}, opts.extra.candle.average);
		if (average.show) {
			seriesMA = calCandleMA(average.day, average.name, average.color, series[0].data);
			opts.seriesMA = seriesMA;
		}
	}

	var _calLegendData = calLegendData(series, opts, config),
		legendHeight = _calLegendData.legendHeight;

	config.legendHeight = legendHeight;

	var _calYAxisData = calYAxisData(series, opts, config),
		yAxisWidth = _calYAxisData.yAxisWidth;

	config.yAxisWidth = yAxisWidth;
	if (categories && categories.length) {
		var _calCategoriesData = calCategoriesData(categories, opts, config),
			xAxisHeight = _calCategoriesData.xAxisHeight,
			angle = _calCategoriesData.angle;

		config.xAxisHeight = xAxisHeight;
		config._xAxisTextAngle_ = angle;
	}
	if (type === 'pie' || type === 'ring' || type === 'rose') {
		config._pieTextMaxLength_ = opts.dataLabel === false ? 0 : getPieTextMaxLength(series);
	}

	var duration = opts.animation ? opts.duration : 0;
	this.animationInstance && this.animationInstance.stop();

	switch (type) {
		case 'line':
			this.animationInstance = new Animation({
				timing: 'easeIn',
				duration: duration,
				onProcess: function onProcess(process) {
					context.clearRect(0, 0, opts.width, opts.height);
					if (opts.rotate) {
						contextRotate(context, opts);
					}
					drawYAxisGrid(categories, opts, config, context);
					drawXAxis(categories, opts, config, context);
					var _drawLineDataPoints = drawLineDataPoints(series, opts, config, context, process),
						xAxisPoints = _drawLineDataPoints.xAxisPoints,
						calPoints = _drawLineDataPoints.calPoints,
						eachSpacing = _drawLineDataPoints.eachSpacing;

					_this.chartData.xAxisPoints = xAxisPoints;
					_this.chartData.calPoints = calPoints;
					_this.chartData.eachSpacing = eachSpacing;
					drawLegend(opts.series, opts, config, context);
					drawYAxis(series, opts, config, context);
					drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints);
					drawCanvas(opts, context);

				},
				onAnimationFinish: function onAnimationFinish() {
					_this.event.trigger('renderComplete');
				}
			});

			break;
		case 'mix':
			this.animationInstance = new Animation({
				timing: 'easeIn',
				duration: duration,
				onProcess: function onProcess(process) {
					context.clearRect(0, 0, opts.width, opts.height);
					if (opts.rotate) {
						contextRotate(context, opts);
					}
					drawYAxisGrid(categories, opts, config, context);
					drawXAxis(categories, opts, config, context);
					var _drawMixDataPoints = drawMixDataPoints(series, opts, config, context, process),
						xAxisPoints = _drawMixDataPoints.xAxisPoints,
						calPoints = _drawMixDataPoints.calPoints,
						eachSpacing = _drawMixDataPoints.eachSpacing;

					_this.chartData.xAxisPoints = xAxisPoints;
					_this.chartData.calPoints = calPoints;
					_this.chartData.eachSpacing = eachSpacing;
					drawLegend(opts.series, opts, config, context);
					drawYAxis(series, opts, config, context);
					drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints);
					drawCanvas(opts, context);
				},
				onAnimationFinish: function onAnimationFinish() {
					_this.event.trigger('renderComplete');
				}
			});

			break;
		case 'column':
			this.animationInstance = new Animation({
				timing: 'easeIn',
				duration: duration,
				onProcess: function onProcess(process) {
					context.clearRect(0, 0, opts.width, opts.height);
					if (opts.rotate) {
						contextRotate(context, opts);
					}
					drawYAxisGrid(categories, opts, config, context);
					drawXAxis(categories, opts, config, context);
					var _drawColumnDataPoints = drawColumnDataPoints(series, opts, config, context, process),
						xAxisPoints = _drawColumnDataPoints.xAxisPoints,
						calPoints = _drawColumnDataPoints.calPoints,
						eachSpacing = _drawColumnDataPoints.eachSpacing;
					_this.chartData.xAxisPoints = xAxisPoints;
					_this.chartData.calPoints = calPoints;
					_this.chartData.eachSpacing = eachSpacing;
					drawLegend(opts.series, opts, config, context);
					drawYAxis(series, opts, config, context);
					drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints);
					drawCanvas(opts, context);
				},
				onAnimationFinish: function onAnimationFinish() {
					_this.event.trigger('renderComplete');
				}
			});
			break;
		case 'area':
			this.animationInstance = new Animation({
				timing: 'easeIn',
				duration: duration,
				onProcess: function onProcess(process) {
					context.clearRect(0, 0, opts.width, opts.height);
					if (opts.rotate) {
						contextRotate(context, opts);
					}
					drawYAxisGrid(categories, opts, config, context);
					drawXAxis(categories, opts, config, context);
					var _drawAreaDataPoints = drawAreaDataPoints(series, opts, config, context, process),
						xAxisPoints = _drawAreaDataPoints.xAxisPoints,
						calPoints = _drawAreaDataPoints.calPoints,
						eachSpacing = _drawAreaDataPoints.eachSpacing;

					_this.chartData.xAxisPoints = xAxisPoints;
					_this.chartData.calPoints = calPoints;
					_this.chartData.eachSpacing = eachSpacing;
					drawLegend(opts.series, opts, config, context);
					drawYAxis(series, opts, config, context);
					drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints);

					drawCanvas(opts, context);
				},
				onAnimationFinish: function onAnimationFinish() {
					_this.event.trigger('renderComplete');
				}
			});
			break;
		case 'ring':
		case 'pie':
			this.animationInstance = new Animation({
				timing: 'easeInOut',
				duration: duration,
				onProcess: function onProcess(process) {
					context.clearRect(0, 0, opts.width, opts.height);
					if (opts.rotate) {
						contextRotate(context, opts);
					}
					_this.chartData.pieData = drawPieDataPoints(series, opts, config, context, process);
					drawLegend(opts.series, opts, config, context);
					drawToolTipBridge(opts, config, context, process);
					drawCanvas(opts, context);
				},
				onAnimationFinish: function onAnimationFinish() {
					_this.event.trigger('renderComplete');
				}
			});
			break;
		case 'rose':
			this.animationInstance = new Animation({
				timing: 'easeInOut',
				duration: duration,
				onProcess: function onProcess(process) {
					context.clearRect(0, 0, opts.width, opts.height);
					if (opts.rotate) {
						contextRotate(context, opts);
					}
					_this.chartData.pieData = drawRoseDataPoints(series, opts, config, context, process);
					drawLegend(opts.series, opts, config, context);
					drawToolTipBridge(opts, config, context, process);
					drawCanvas(opts, context);
				},
				onAnimationFinish: function onAnimationFinish() {
					_this.event.trigger('renderComplete');
				}
			});
			break;
		case 'radar':
			this.animationInstance = new Animation({
				timing: 'easeInOut',
				duration: duration,
				onProcess: function onProcess(process) {
					context.clearRect(0, 0, opts.width, opts.height);
					if (opts.rotate) {
						contextRotate(context, opts);
					}
					_this.chartData.radarData = drawRadarDataPoints(series, opts, config, context, process);
					drawLegend(opts.series, opts, config, context);
					drawToolTipBridge(opts, config, context, process);
					drawCanvas(opts, context);
				},
				onAnimationFinish: function onAnimationFinish() {
					_this.event.trigger('renderComplete');
				}
			});
			break;
		case 'arcbar':
			this.animationInstance = new Animation({
				timing: 'easeInOut',
				duration: duration,
				onProcess: function onProcess(process) {
					context.clearRect(0, 0, opts.width, opts.height);
					if (opts.rotate) {
						contextRotate(context, opts);
					}
					_this.chartData.arcbarData = drawArcbarDataPoints(series, opts, config, context, process);
					drawCanvas(opts, context);
				},
				onAnimationFinish: function onAnimationFinish() {
					_this.event.trigger('renderComplete');
				}
			});
			break;
		case 'gauge':
			this.animationInstance = new Animation({
				timing: 'easeInOut',
				duration: duration,
				onProcess: function onProcess(process) {
					context.clearRect(0, 0, opts.width, opts.height);
					if (opts.rotate) {
						contextRotate(context, opts);
					}
					_this.chartData.gaugeData = drawGaugeDataPoints(categories, series, opts, config, context, process);
					drawCanvas(opts, context);
				},
				onAnimationFinish: function onAnimationFinish() {
					_this.event.trigger('renderComplete');
				}
			});
			break;
		case 'candle':
			this.animationInstance = new Animation({
				timing: 'easeIn',
				duration: duration,
				onProcess: function onProcess(process) {
					context.clearRect(0, 0, opts.width, opts.height);
					if (opts.rotate) {
						contextRotate(context, opts);
					}
					drawYAxisGrid(categories, opts, config, context);
					drawXAxis(categories, opts, config, context);
					var _drawCandleDataPoints = drawCandleDataPoints(series, seriesMA, opts, config, context, process),
						xAxisPoints = _drawCandleDataPoints.xAxisPoints,
						calPoints = _drawCandleDataPoints.calPoints,
						eachSpacing = _drawCandleDataPoints.eachSpacing;

					_this.chartData.xAxisPoints = xAxisPoints;
					_this.chartData.calPoints = calPoints;
					_this.chartData.eachSpacing = eachSpacing;
					if (seriesMA) {
						drawLegend(seriesMA, opts, config, context);
					} else {
						drawLegend(opts.series, opts, config, context);
					}
					drawYAxis(series, opts, config, context);
					drawToolTipBridge(opts, config, context, process, eachSpacing, xAxisPoints);
					drawCanvas(opts, context);
				},
				onAnimationFinish: function onAnimationFinish() {
					_this.event.trigger('renderComplete');
				}
			});
			break;
	}
}

// simple event implement

function Event() {
	this.events = {};
}

Event.prototype.addEventListener = function(type, listener) {
	this.events[type] = this.events[type] || [];
	this.events[type].push(listener);
};

Event.prototype.trigger = function() {
	for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
		args[_key] = arguments[_key];
	}

	var type = args[0];
	var params = args.slice(1);
	if (!!this.events[type]) {
		this.events[type].forEach(function(listener) {
			try {
				listener.apply(null, params);
			} catch (e) {
				// console.error(e);
			}
		});
	}
};

var Charts = function Charts(opts) {
	opts.pixelRatio = opts.pixelRatio ? opts.pixelRatio : 1;
	opts.fontSize = opts.fontSize ? opts.fontSize * opts.pixelRatio : 13 * opts.pixelRatio;
	opts.title = assign({}, opts.title);
	opts.subtitle = assign({}, opts.subtitle);
	opts.yAxis = assign({}, {
		gridType:'solid',
		dashLength:4 * opts.pixelRatio
	},opts.yAxis);
	opts.xAxis = assign({}, {
		rotateLabel:false,
		type:'calibration',
		gridType:'solid',
		dashLength:4 * opts.pixelRatio,
		scrollAlign:'left'
	},opts.xAxis);
	opts.extra = assign({}, opts.extra);
	opts.rotate = opts.rotate ? true : false;
	opts.animation = opts.animation ? true : false;
	var config$$1 = assign({}, config);
	config$$1.yAxisTitleWidth = opts.yAxis.disabled !== true && opts.yAxis.title ? config$$1.yAxisTitleWidth : 0;
	if (opts.type == 'pie' || opts.type == 'ring' ) {
		config$$1.pieChartLinePadding = opts.dataLabel === false ? 0 : opts.extra.pie.labelWidth*opts.pixelRatio || config$$1.pieChartLinePadding *opts.pixelRatio;
	}
	if (opts.type == 'rose' ) {
		config$$1.pieChartLinePadding = opts.dataLabel === false ? 0 : opts.extra.rose.labelWidth*opts.pixelRatio || config$$1.pieChartLinePadding *opts.pixelRatio;
	}
	config$$1.pieChartTextPadding = opts.dataLabel === false ? 0 : config$$1.pieChartTextPadding * opts.pixelRatio;
	config$$1.yAxisSplit = opts.yAxis.splitNumber ? opts.yAxis.splitNumber : config.yAxisSplit;
	//屏幕旋转
	config$$1.rotate = opts.rotate;
	if (opts.rotate) {
		let tempWidth = opts.width;
		let tempHeight = opts.height;
		opts.width = tempHeight;
		opts.height = tempWidth;
	}

	//适配高分屏
	config$$1.yAxisWidth = config.yAxisWidth * opts.pixelRatio;
	config$$1.xAxisHeight = config.xAxisHeight * opts.pixelRatio;
	if (opts.enableScroll && opts.xAxis.scrollShow) {
		config$$1.xAxisHeight += 6 * opts.pixelRatio;
	}
	config$$1.xAxisLineHeight = config.xAxisLineHeight * opts.pixelRatio;
	config$$1.legendHeight = config.legendHeight * opts.pixelRatio;
	config$$1.padding = config.padding * opts.pixelRatio;
	config$$1.fontSize = opts.fontSize;
	config$$1.titleFontSize = config.titleFontSize * opts.pixelRatio;
	config$$1.subtitleFontSize = config.subtitleFontSize * opts.pixelRatio;
	config$$1.toolTipPadding = config.toolTipPadding * opts.pixelRatio;
	config$$1.toolTipLineHeight = config.toolTipLineHeight * opts.pixelRatio;
	config$$1.columePadding = config.columePadding * opts.pixelRatio;

	this.opts = opts;
	this.config = config$$1;
	opts.$this = opts.$this ? opts.$this : this;
	this.context = uni.createCanvasContext(opts.canvasId, opts.$this);
	/* 兼容原生H5
	this.context = document.getElementById(opts.canvasId).getContext("2d");
	this.context.setStrokeStyle = function(e){ return this.strokeStyle=e; }
	this.context.setLineWidth = function(e){ return this.lineWidth=e; }
	this.context.setLineCap = function(e){ return this.lineCap=e; }
	this.context.setFontSize = function(e){ return this.font=e+"px sans-serif"; }
	this.context.setFillStyle = function(e){ return this.fillStyle=e; }
	this.context.draw = function(){ }
	*/
	this.chartData = {};
	this.event = new Event();

	this.scrollOption = {
		currentOffset: 0,
		startTouchX: 0,
		distance: 0,
		lastMoveTime: 0
	};

	//计算右对齐偏移距离
	if (opts.enableScroll && opts.xAxis.scrollAlign == 'right') {
		let _calYAxisData = calYAxisData(opts.series, opts, config$$1),
			yAxisWidth = _calYAxisData.yAxisWidth;
		config$$1.yAxisWidth = yAxisWidth;
		let offsetLeft = 0;
		let _getXAxisPoints0 = getXAxisPoints(opts.categories, opts, config$$1),
			xAxisPoints = _getXAxisPoints0.xAxisPoints,
			startX = _getXAxisPoints0.startX,
			endX = _getXAxisPoints0.endX,
			eachSpacing = _getXAxisPoints0.eachSpacing;
		let totalWidth = eachSpacing * (xAxisPoints.length - 1);
		let screenWidth = endX - startX;
		offsetLeft = screenWidth - totalWidth;
		this.scrollOption = {
			currentOffset: offsetLeft,
			startTouchX: offsetLeft,
			distance: 0,
			lastMoveTime: 0
		};
		opts._scrollDistance_ = offsetLeft;
	}

	drawCharts.call(this, opts.type, opts, config$$1, this.context);
};

Charts.prototype.updateData = function() {
	let data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	this.opts = assign({}, this.opts, data);
	let scrollPosition = data.scrollPosition || 'current';
	switch (scrollPosition) {
		case 'current':
			this.opts._scrollDistance_ = this.scrollOption.currentOffset;
			break;
		case 'left':
			this.opts._scrollDistance_ = 0;
			this.scrollOption = {
				currentOffset: 0,
				startTouchX: 0,
				distance: 0,
				lastMoveTime: 0
			};
			break;
		case 'right':
			let _calYAxisData = calYAxisData(this.opts.series, this.opts, this.config),
				yAxisWidth = _calYAxisData.yAxisWidth;
			this.config.yAxisWidth = yAxisWidth;
			let offsetLeft = 0;
			let _getXAxisPoints0 = getXAxisPoints(this.opts.categories, this.opts, this.config),
				xAxisPoints = _getXAxisPoints0.xAxisPoints,
				startX = _getXAxisPoints0.startX,
				endX = _getXAxisPoints0.endX,
				eachSpacing = _getXAxisPoints0.eachSpacing;
			let totalWidth = eachSpacing * (xAxisPoints.length - 1);
			let screenWidth = endX - startX;
			offsetLeft = screenWidth - totalWidth;
			this.scrollOption = {
				currentOffset: offsetLeft,
				startTouchX: offsetLeft,
				distance: 0,
				lastMoveTime: 0
			};
			this.opts._scrollDistance_ = offsetLeft;
			break;
	}
	drawCharts.call(this, this.opts.type, this.opts, this.config, this.context);
};

Charts.prototype.zoom = function() {
	var val = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.opts.xAxis.itemCount;
	if (this.opts.enableScroll !== true) {
		// console.log('请启用滚动条后使用！')
		return;
	}
	//当前屏幕中间点
	let centerPoint = Math.round(Math.abs(this.scrollOption.currentOffset) / this.chartData.eachSpacing) + Math.round(
		this.opts.xAxis.itemCount / 2);
	this.opts.animation = false;
	this.opts.xAxis.itemCount = val.itemCount;
	//重新计算x轴偏移距离
	let _calYAxisData = calYAxisData(this.opts.series, this.opts, this.config),
		yAxisWidth = _calYAxisData.yAxisWidth;
	this.config.yAxisWidth = yAxisWidth;
	let offsetLeft = 0;
	let _getXAxisPoints0 = getXAxisPoints(this.opts.categories, this.opts, this.config),
		xAxisPoints = _getXAxisPoints0.xAxisPoints,
		startX = _getXAxisPoints0.startX,
		endX = _getXAxisPoints0.endX,
		eachSpacing = _getXAxisPoints0.eachSpacing;
	let centerLeft = eachSpacing * centerPoint;
	let screenWidth = endX - startX;
	let MaxLeft = screenWidth - eachSpacing * (xAxisPoints.length - 1);
	offsetLeft = screenWidth / 2 - centerLeft;
	if (offsetLeft > 0) {
		offsetLeft = 0;
	}
	if (offsetLeft < MaxLeft) {
		offsetLeft = MaxLeft;
	}
	this.scrollOption = {
		currentOffset: offsetLeft,
		startTouchX: offsetLeft,
		distance: 0,
		lastMoveTime: 0
	};
	this.opts._scrollDistance_ = offsetLeft;

	drawCharts.call(this, this.opts.type, this.opts, this.config, this.context);
};

Charts.prototype.stopAnimation = function() {
	this.animationInstance && this.animationInstance.stop();
};

Charts.prototype.addEventListener = function(type, listener) {
	this.event.addEventListener(type, listener);
};

Charts.prototype.getCurrentDataIndex = function(e) {
	var touches = null;
	if(e.changedTouches){
		touches = e.changedTouches[0];
	}else{
		touches = e.mp.changedTouches[0];
	}
	if (touches) {
		var _touches$ = getTouches(touches, this.opts, e);
		if (this.opts.type === 'pie' || this.opts.type === 'ring' || this.opts.type === 'rose') {
			return findPieChartCurrentIndex({
				x: _touches$.x,
				y: _touches$.y
			}, this.chartData.pieData);
		} else if (this.opts.type === 'radar') {
			return findRadarChartCurrentIndex({
				x: _touches$.x,
				y: _touches$.y
			}, this.chartData.radarData, this.opts.categories.length);
		} else {
			return findCurrentIndex({
				x: _touches$.x,
				y: _touches$.y
			}, this.chartData.xAxisPoints, this.opts, this.config, Math.abs(this.scrollOption.currentOffset));
		}
	}
	return -1;
};

Charts.prototype.showToolTip = function(e) {
	var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	var touches = null;
	if(e.changedTouches){
		touches = e.changedTouches[0];
	}else{
		touches = e.mp.changedTouches[0];
	}
	if(!touches){
		// console.log("touchError");
		return;
	}
	var _touches$ = getTouches(touches, this.opts, e);

	if (this.opts.type === 'line' || this.opts.type === 'area' || this.opts.type === 'column') {
		var index = this.getCurrentDataIndex(e);
		var currentOffset = this.scrollOption.currentOffset;

		var opts = assign({}, this.opts, {
			_scrollDistance_: currentOffset,
			animation: false
		});
		if (index > -1) {

			var seriesData = getSeriesDataItem(this.opts.series, index);
			if (seriesData.length !== 0) {
				var _getToolTipData = getToolTipData(seriesData, this.chartData.calPoints, index, this.opts.categories, option),
					textList = _getToolTipData.textList,
					offset = _getToolTipData.offset;
				offset.y = _touches$.y;
				opts.tooltip = {
					textList: textList,
					offset: offset,
					option: option,
					index: index
				};
			}
		}
		drawCharts.call(this, opts.type, opts, this.config, this.context);
	}
	if (this.opts.type === 'mix') {

		var index = this.getCurrentDataIndex(e);
		var currentOffset = this.scrollOption.currentOffset;

		var opts = assign({}, this.opts, {
			_scrollDistance_: currentOffset,
			animation: false
		});
		if (index > -1) {
			var seriesData = getSeriesDataItem(this.opts.series, index);
			if (seriesData.length !== 0) {
				var _getMixToolTipData = getMixToolTipData(seriesData, this.chartData.calPoints, index, this.opts.categories,option),
					textList = _getMixToolTipData.textList,
					offset = _getMixToolTipData.offset;
				offset.y = _touches$.y;
				opts.tooltip = {
					textList: textList,
					offset: offset,
					option: option,
					index: index
				};
			}
		}
		drawCharts.call(this, opts.type, opts, this.config, this.context);
	}
	if (this.opts.type === 'candle') {

		var index = this.getCurrentDataIndex(e);
		var currentOffset = this.scrollOption.currentOffset;

		var opts = assign({}, this.opts, {
			_scrollDistance_: currentOffset,
			animation: false
		});
		if (index > -1) {
			var seriesData = getSeriesDataItem(this.opts.series, index);
			if (seriesData.length !== 0) {
				var _getToolTipData = getCandleToolTipData(this.opts.series[0].data, seriesData, this.chartData.calPoints, index,this.opts.categories, this.opts.extra.candle, option),
					textList = _getToolTipData.textList,
					offset = _getToolTipData.offset;
				offset.y = _touches$.y;
				opts.tooltip = {
					textList: textList,
					offset: offset,
					option: option,
					index: index
				};
			}
		}
		drawCharts.call(this, opts.type, opts, this.config, this.context);
	}
	if (this.opts.type === 'pie' || this.opts.type === 'ring' || this.opts.type === 'rose') {
		var index = this.getCurrentDataIndex(e);
		var currentOffset = this.scrollOption.currentOffset;

		var opts = assign({}, this.opts, {
			_scrollDistance_: currentOffset,
			animation: false
		});
		if (index > -1) {

			var seriesData = this.opts.series[index];
			var textList = [{
				text: option.format ? option.format(seriesData) : seriesData.name + ': ' + seriesData.data,
				color: seriesData.color
			}];
			var offset = {
				x: _touches$.x,
				y: _touches$.y
			};

			opts.tooltip = {
				textList: textList,
				offset: offset,
				option: option,
				index: index
			};
		}
		drawCharts.call(this, opts.type, opts, this.config, this.context);
	}
	if (this.opts.type === 'radar') {
		var index = this.getCurrentDataIndex(e);
		var currentOffset = this.scrollOption.currentOffset;
	
		var opts = assign({}, this.opts, {
			_scrollDistance_: currentOffset,
			animation: false
		});
		if (index > -1) {
	
			var seriesData = getSeriesDataItem(this.opts.series, index);
			if (seriesData.length !== 0) {
				var textList = seriesData.map(function(item) {
						return {
							text: option.format ? option.format(item) : item.name + ': ' + item.data,
							color: item.color
						};
				});
				var offset = {
					x: _touches$.x,
					y: _touches$.y
				};
				opts.tooltip = {
					textList: textList,
					offset: offset,
					option: option,
					index: index
				};
			}
		}
		drawCharts.call(this, opts.type, opts, this.config, this.context);
	}
};

Charts.prototype.translate = function(distance) {
	this.scrollOption = {
		currentOffset: distance,
		startTouchX: distance,
		distance: 0,
		lastMoveTime: 0
	};
	let opts = assign({}, this.opts, {
		_scrollDistance_: distance,
		animation: false
	});
	drawCharts.call(this, this.opts.type, opts, this.config, this.context);
};

Charts.prototype.scrollStart = function(e) {
	var touches = null;
	if(e.changedTouches){
		touches = e.changedTouches[0];
	}else{
		touches = e.mp.changedTouches[0];
	}
	var _touches$ = getTouches(touches, this.opts, e);
	if (touches && this.opts.enableScroll === true) {
		this.scrollOption.startTouchX = _touches$.x;
	}
};

Charts.prototype.scroll = function(e) {
	if (this.scrollOption.lastMoveTime === 0) {
		this.scrollOption.lastMoveTime = Date.now();
	}
	let Limit = this.opts.extra.touchMoveLimit || 20;
	let currMoveTime = Date.now();
	let duration = currMoveTime - this.scrollOption.lastMoveTime;
	if (duration < Math.floor(1000 / Limit)) return;

	this.scrollOption.lastMoveTime = currMoveTime;

	var touches = null;
	if(e.changedTouches){
		touches = e.changedTouches[0];
	}else{
		touches = e.mp.changedTouches[0];
	}
	var _touches$ = getTouches(touches, this.opts, e);
	if (touches && this.opts.enableScroll === true) {
		var _distance;
		_distance = _touches$.x - this.scrollOption.startTouchX;
		var currentOffset = this.scrollOption.currentOffset;

		var validDistance = calValidDistance(currentOffset + _distance, this.chartData, this.config, this.opts);

		this.scrollOption.distance = _distance = validDistance - currentOffset;
		var opts = assign({}, this.opts, {
			_scrollDistance_: currentOffset + _distance,
			animation: false
		});
		drawCharts.call(this, opts.type, opts, this.config, this.context);
		return currentOffset + _distance;
	}
};

Charts.prototype.scrollEnd = function(e) {
	if (this.opts.enableScroll === true) {
		var _scrollOption = this.scrollOption,
			currentOffset = _scrollOption.currentOffset,
			distance = _scrollOption.distance;

		this.scrollOption.currentOffset = currentOffset + distance;
		this.scrollOption.distance = 0;
	}
};
if ( typeof module === "object" && typeof module.exports === "object" ) {
	module.exports = Charts;
	//export default Charts;//建议使用nodejs的module导出方式，如报错请使用export方式导出
}