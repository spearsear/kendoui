/*!
 * Copyright 2016 Telerik AD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function (f, define) {
    define('kendo.core', ['jquery'], f);
}(function () {
    var __meta__ = {
        id: 'core',
        name: 'Core',
        category: 'framework',
        description: 'The core of the Kendo framework.'
    };
    (function ($, window, undefined) {
        var kendo = window.kendo = window.kendo || { cultures: {} }, extend = $.extend, each = $.each, isArray = $.isArray, proxy = $.proxy, noop = $.noop, math = Math, Template, JSON = window.JSON || {}, support = {}, percentRegExp = /%/, formatRegExp = /\{(\d+)(:[^\}]+)?\}/g, boxShadowRegExp = /(\d+(?:\.?)\d*)px\s*(\d+(?:\.?)\d*)px\s*(\d+(?:\.?)\d*)px\s*(\d+)?/i, numberRegExp = /^(\+|-?)\d+(\.?)\d*$/, FUNCTION = 'function', STRING = 'string', NUMBER = 'number', OBJECT = 'object', NULL = 'null', BOOLEAN = 'boolean', UNDEFINED = 'undefined', getterCache = {}, setterCache = {}, slice = [].slice;
        kendo.version = '2016.3.610'.replace(/^\s+|\s+$/g, '');
        function Class() {
        }
        Class.extend = function (proto) {
            var base = function () {
                }, member, that = this, subclass = proto && proto.init ? proto.init : function () {
                    that.apply(this, arguments);
                }, fn;
            base.prototype = that.prototype;
            fn = subclass.fn = subclass.prototype = new base();
            for (member in proto) {
                if (proto[member] != null && proto[member].constructor === Object) {
                    fn[member] = extend(true, {}, base.prototype[member], proto[member]);
                } else {
                    fn[member] = proto[member];
                }
            }
            fn.constructor = subclass;
            subclass.extend = that.extend;
            return subclass;
        };
        Class.prototype._initOptions = function (options) {
            this.options = deepExtend({}, this.options, options);
        };
        var isFunction = kendo.isFunction = function (fn) {
            return typeof fn === 'function';
        };
        var preventDefault = function () {
            this._defaultPrevented = true;
        };
        var isDefaultPrevented = function () {
            return this._defaultPrevented === true;
        };
        var Observable = Class.extend({
            init: function () {
                this._events = {};
            },
            bind: function (eventName, handlers, one) {
                var that = this, idx, eventNames = typeof eventName === STRING ? [eventName] : eventName, length, original, handler, handlersIsFunction = typeof handlers === FUNCTION, events;
                if (handlers === undefined) {
                    for (idx in eventName) {
                        that.bind(idx, eventName[idx]);
                    }
                    return that;
                }
                for (idx = 0, length = eventNames.length; idx < length; idx++) {
                    eventName = eventNames[idx];
                    handler = handlersIsFunction ? handlers : handlers[eventName];
                    if (handler) {
                        if (one) {
                            original = handler;
                            handler = function () {
                                that.unbind(eventName, handler);
                                original.apply(that, arguments);
                            };
                            handler.original = original;
                        }
                        events = that._events[eventName] = that._events[eventName] || [];
                        events.push(handler);
                    }
                }
                return that;
            },
            one: function (eventNames, handlers) {
                return this.bind(eventNames, handlers, true);
            },
            first: function (eventName, handlers) {
                var that = this, idx, eventNames = typeof eventName === STRING ? [eventName] : eventName, length, handler, handlersIsFunction = typeof handlers === FUNCTION, events;
                for (idx = 0, length = eventNames.length; idx < length; idx++) {
                    eventName = eventNames[idx];
                    handler = handlersIsFunction ? handlers : handlers[eventName];
                    if (handler) {
                        events = that._events[eventName] = that._events[eventName] || [];
                        events.unshift(handler);
                    }
                }
                return that;
            },
            trigger: function (eventName, e) {
                var that = this, events = that._events[eventName], idx, length;
                if (events) {
                    e = e || {};
                    e.sender = that;
                    e._defaultPrevented = false;
                    e.preventDefault = preventDefault;
                    e.isDefaultPrevented = isDefaultPrevented;
                    events = events.slice();
                    for (idx = 0, length = events.length; idx < length; idx++) {
                        events[idx].call(that, e);
                    }
                    return e._defaultPrevented === true;
                }
                return false;
            },
            unbind: function (eventName, handler) {
                var that = this, events = that._events[eventName], idx;
                if (eventName === undefined) {
                    that._events = {};
                } else if (events) {
                    if (handler) {
                        for (idx = events.length - 1; idx >= 0; idx--) {
                            if (events[idx] === handler || events[idx].original === handler) {
                                events.splice(idx, 1);
                            }
                        }
                    } else {
                        that._events[eventName] = [];
                    }
                }
                return that;
            }
        });
        function compilePart(part, stringPart) {
            if (stringPart) {
                return '\'' + part.split('\'').join('\\\'').split('\\"').join('\\\\\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '\'';
            } else {
                var first = part.charAt(0), rest = part.substring(1);
                if (first === '=') {
                    return '+(' + rest + ')+';
                } else if (first === ':') {
                    return '+$kendoHtmlEncode(' + rest + ')+';
                } else {
                    return ';' + part + ';$kendoOutput+=';
                }
            }
        }
        var argumentNameRegExp = /^\w+/, encodeRegExp = /\$\{([^}]*)\}/g, escapedCurlyRegExp = /\\\}/g, curlyRegExp = /__CURLY__/g, escapedSharpRegExp = /\\#/g, sharpRegExp = /__SHARP__/g, zeros = [
                '',
                '0',
                '00',
                '000',
                '0000'
            ];
        Template = {
            paramName: 'data',
            useWithBlock: true,
            render: function (template, data) {
                var idx, length, html = '';
                for (idx = 0, length = data.length; idx < length; idx++) {
                    html += template(data[idx]);
                }
                return html;
            },
            compile: function (template, options) {
                var settings = extend({}, this, options), paramName = settings.paramName, argumentName = paramName.match(argumentNameRegExp)[0], useWithBlock = settings.useWithBlock, functionBody = 'var $kendoOutput, $kendoHtmlEncode = kendo.htmlEncode;', fn, parts, idx;
                if (isFunction(template)) {
                    return template;
                }
                functionBody += useWithBlock ? 'with(' + paramName + '){' : '';
                functionBody += '$kendoOutput=';
                parts = template.replace(escapedCurlyRegExp, '__CURLY__').replace(encodeRegExp, '#=$kendoHtmlEncode($1)#').replace(curlyRegExp, '}').replace(escapedSharpRegExp, '__SHARP__').split('#');
                for (idx = 0; idx < parts.length; idx++) {
                    functionBody += compilePart(parts[idx], idx % 2 === 0);
                }
                functionBody += useWithBlock ? ';}' : ';';
                functionBody += 'return $kendoOutput;';
                functionBody = functionBody.replace(sharpRegExp, '#');
                try {
                    fn = new Function(argumentName, functionBody);
                    fn._slotCount = Math.floor(parts.length / 2);
                    return fn;
                } catch (e) {
                    throw new Error(kendo.format('Invalid template:\'{0}\' Generated code:\'{1}\'', template, functionBody));
                }
            }
        };
        function pad(number, digits, end) {
            number = number + '';
            digits = digits || 2;
            end = digits - number.length;
            if (end) {
                return zeros[digits].substring(0, end) + number;
            }
            return number;
        }
        (function () {
            var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = {
                    '\b': '\\b',
                    '\t': '\\t',
                    '\n': '\\n',
                    '\f': '\\f',
                    '\r': '\\r',
                    '"': '\\"',
                    '\\': '\\\\'
                }, rep, toString = {}.toString;
            if (typeof Date.prototype.toJSON !== FUNCTION) {
                Date.prototype.toJSON = function () {
                    var that = this;
                    return isFinite(that.valueOf()) ? pad(that.getUTCFullYear(), 4) + '-' + pad(that.getUTCMonth() + 1) + '-' + pad(that.getUTCDate()) + 'T' + pad(that.getUTCHours()) + ':' + pad(that.getUTCMinutes()) + ':' + pad(that.getUTCSeconds()) + 'Z' : null;
                };
                String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function () {
                    return this.valueOf();
                };
            }
            function quote(string) {
                escapable.lastIndex = 0;
                return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
                    var c = meta[a];
                    return typeof c === STRING ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                }) + '"' : '"' + string + '"';
            }
            function str(key, holder) {
                var i, k, v, length, mind = gap, partial, value = holder[key], type;
                if (value && typeof value === OBJECT && typeof value.toJSON === FUNCTION) {
                    value = value.toJSON(key);
                }
                if (typeof rep === FUNCTION) {
                    value = rep.call(holder, key, value);
                }
                type = typeof value;
                if (type === STRING) {
                    return quote(value);
                } else if (type === NUMBER) {
                    return isFinite(value) ? String(value) : NULL;
                } else if (type === BOOLEAN || type === NULL) {
                    return String(value);
                } else if (type === OBJECT) {
                    if (!value) {
                        return NULL;
                    }
                    gap += indent;
                    partial = [];
                    if (toString.apply(value) === '[object Array]') {
                        length = value.length;
                        for (i = 0; i < length; i++) {
                            partial[i] = str(i, value) || NULL;
                        }
                        v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';
                        gap = mind;
                        return v;
                    }
                    if (rep && typeof rep === OBJECT) {
                        length = rep.length;
                        for (i = 0; i < length; i++) {
                            if (typeof rep[i] === STRING) {
                                k = rep[i];
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                }
                            }
                        }
                    } else {
                        for (k in value) {
                            if (Object.hasOwnProperty.call(value, k)) {
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                }
                            }
                        }
                    }
                    v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';
                    gap = mind;
                    return v;
                }
            }
            if (typeof JSON.stringify !== FUNCTION) {
                JSON.stringify = function (value, replacer, space) {
                    var i;
                    gap = '';
                    indent = '';
                    if (typeof space === NUMBER) {
                        for (i = 0; i < space; i += 1) {
                            indent += ' ';
                        }
                    } else if (typeof space === STRING) {
                        indent = space;
                    }
                    rep = replacer;
                    if (replacer && typeof replacer !== FUNCTION && (typeof replacer !== OBJECT || typeof replacer.length !== NUMBER)) {
                        throw new Error('JSON.stringify');
                    }
                    return str('', { '': value });
                };
            }
        }());
        (function () {
            var dateFormatRegExp = /dddd|ddd|dd|d|MMMM|MMM|MM|M|yyyy|yy|HH|H|hh|h|mm|m|fff|ff|f|tt|ss|s|zzz|zz|z|"[^"]*"|'[^']*'/g, standardFormatRegExp = /^(n|c|p|e)(\d*)$/i, literalRegExp = /(\\.)|(['][^']*[']?)|(["][^"]*["]?)/g, commaRegExp = /\,/g, EMPTY = '', POINT = '.', COMMA = ',', SHARP = '#', ZERO = '0', PLACEHOLDER = '??', EN = 'en-US', objectToString = {}.toString;
            kendo.cultures['en-US'] = {
                name: EN,
                numberFormat: {
                    pattern: ['-n'],
                    decimals: 2,
                    ',': ',',
                    '.': '.',
                    groupSize: [3],
                    percent: {
                        pattern: [
                            '-n %',
                            'n %'
                        ],
                        decimals: 2,
                        ',': ',',
                        '.': '.',
                        groupSize: [3],
                        symbol: '%'
                    },
                    currency: {
                        name: 'US Dollar',
                        abbr: 'USD',
                        pattern: [
                            '($n)',
                            '$n'
                        ],
                        decimals: 2,
                        ',': ',',
                        '.': '.',
                        groupSize: [3],
                        symbol: '$'
                    }
                },
                calendars: {
                    standard: {
                        days: {
                            names: [
                                'Sunday',
                                'Monday',
                                'Tuesday',
                                'Wednesday',
                                'Thursday',
                                'Friday',
                                'Saturday'
                            ],
                            namesAbbr: [
                                'Sun',
                                'Mon',
                                'Tue',
                                'Wed',
                                'Thu',
                                'Fri',
                                'Sat'
                            ],
                            namesShort: [
                                'Su',
                                'Mo',
                                'Tu',
                                'We',
                                'Th',
                                'Fr',
                                'Sa'
                            ]
                        },
                        months: {
                            names: [
                                'January',
                                'February',
                                'March',
                                'April',
                                'May',
                                'June',
                                'July',
                                'August',
                                'September',
                                'October',
                                'November',
                                'December'
                            ],
                            namesAbbr: [
                                'Jan',
                                'Feb',
                                'Mar',
                                'Apr',
                                'May',
                                'Jun',
                                'Jul',
                                'Aug',
                                'Sep',
                                'Oct',
                                'Nov',
                                'Dec'
                            ]
                        },
                        AM: [
                            'AM',
                            'am',
                            'AM'
                        ],
                        PM: [
                            'PM',
                            'pm',
                            'PM'
                        ],
                        patterns: {
                            d: 'M/d/yyyy',
                            D: 'dddd, MMMM dd, yyyy',
                            F: 'dddd, MMMM dd, yyyy h:mm:ss tt',
                            g: 'M/d/yyyy h:mm tt',
                            G: 'M/d/yyyy h:mm:ss tt',
                            m: 'MMMM dd',
                            M: 'MMMM dd',
                            s: 'yyyy\'-\'MM\'-\'ddTHH\':\'mm\':\'ss',
                            t: 'h:mm tt',
                            T: 'h:mm:ss tt',
                            u: 'yyyy\'-\'MM\'-\'dd HH\':\'mm\':\'ss\'Z\'',
                            y: 'MMMM, yyyy',
                            Y: 'MMMM, yyyy'
                        },
                        '/': '/',
                        ':': ':',
                        firstDay: 0,
                        twoDigitYearMax: 2029
                    }
                }
            };
            function findCulture(culture) {
                if (culture) {
                    if (culture.numberFormat) {
                        return culture;
                    }
                    if (typeof culture === STRING) {
                        var cultures = kendo.cultures;
                        return cultures[culture] || cultures[culture.split('-')[0]] || null;
                    }
                    return null;
                }
                return null;
            }
            function getCulture(culture) {
                if (culture) {
                    culture = findCulture(culture);
                }
                return culture || kendo.cultures.current;
            }
            kendo.culture = function (cultureName) {
                var cultures = kendo.cultures, culture;
                if (cultureName !== undefined) {
                    culture = findCulture(cultureName) || cultures[EN];
                    culture.calendar = culture.calendars.standard;
                    cultures.current = culture;
                } else {
                    return cultures.current;
                }
            };
            kendo.findCulture = findCulture;
            kendo.getCulture = getCulture;
            kendo.culture(EN);
            function formatDate(date, format, culture) {
                culture = getCulture(culture);
                var calendar = culture.calendars.standard, days = calendar.days, months = calendar.months;
                format = calendar.patterns[format] || format;
                return format.replace(dateFormatRegExp, function (match) {
                    var minutes;
                    var result;
                    var sign;
                    if (match === 'd') {
                        result = date.getDate();
                    } else if (match === 'dd') {
                        result = pad(date.getDate());
                    } else if (match === 'ddd') {
                        result = days.namesAbbr[date.getDay()];
                    } else if (match === 'dddd') {
                        result = days.names[date.getDay()];
                    } else if (match === 'M') {
                        result = date.getMonth() + 1;
                    } else if (match === 'MM') {
                        result = pad(date.getMonth() + 1);
                    } else if (match === 'MMM') {
                        result = months.namesAbbr[date.getMonth()];
                    } else if (match === 'MMMM') {
                        result = months.names[date.getMonth()];
                    } else if (match === 'yy') {
                        result = pad(date.getFullYear() % 100);
                    } else if (match === 'yyyy') {
                        result = pad(date.getFullYear(), 4);
                    } else if (match === 'h') {
                        result = date.getHours() % 12 || 12;
                    } else if (match === 'hh') {
                        result = pad(date.getHours() % 12 || 12);
                    } else if (match === 'H') {
                        result = date.getHours();
                    } else if (match === 'HH') {
                        result = pad(date.getHours());
                    } else if (match === 'm') {
                        result = date.getMinutes();
                    } else if (match === 'mm') {
                        result = pad(date.getMinutes());
                    } else if (match === 's') {
                        result = date.getSeconds();
                    } else if (match === 'ss') {
                        result = pad(date.getSeconds());
                    } else if (match === 'f') {
                        result = math.floor(date.getMilliseconds() / 100);
                    } else if (match === 'ff') {
                        result = date.getMilliseconds();
                        if (result > 99) {
                            result = math.floor(result / 10);
                        }
                        result = pad(result);
                    } else if (match === 'fff') {
                        result = pad(date.getMilliseconds(), 3);
                    } else if (match === 'tt') {
                        result = date.getHours() < 12 ? calendar.AM[0] : calendar.PM[0];
                    } else if (match === 'zzz') {
                        minutes = date.getTimezoneOffset();
                        sign = minutes < 0;
                        result = math.abs(minutes / 60).toString().split('.')[0];
                        minutes = math.abs(minutes) - result * 60;
                        result = (sign ? '+' : '-') + pad(result);
                        result += ':' + pad(minutes);
                    } else if (match === 'zz' || match === 'z') {
                        result = date.getTimezoneOffset() / 60;
                        sign = result < 0;
                        result = math.abs(result).toString().split('.')[0];
                        result = (sign ? '+' : '-') + (match === 'zz' ? pad(result) : result);
                    }
                    return result !== undefined ? result : match.slice(1, match.length - 1);
                });
            }
            function formatNumber(number, format, culture) {
                culture = getCulture(culture);
                var numberFormat = culture.numberFormat, decimal = numberFormat[POINT], precision = numberFormat.decimals, pattern = numberFormat.pattern[0], literals = [], symbol, isCurrency, isPercent, customPrecision, formatAndPrecision, negative = number < 0, integer, fraction, integerLength, fractionLength, replacement = EMPTY, value = EMPTY, idx, length, ch, hasGroup, hasNegativeFormat, decimalIndex, sharpIndex, zeroIndex, hasZero, hasSharp, percentIndex, currencyIndex, startZeroIndex, start = -1, end;
                if (number === undefined) {
                    return EMPTY;
                }
                if (!isFinite(number)) {
                    return number;
                }
                if (!format) {
                    return culture.name.length ? number.toLocaleString() : number.toString();
                }
                formatAndPrecision = standardFormatRegExp.exec(format);
                if (formatAndPrecision) {
                    format = formatAndPrecision[1].toLowerCase();
                    isCurrency = format === 'c';
                    isPercent = format === 'p';
                    if (isCurrency || isPercent) {
                        numberFormat = isCurrency ? numberFormat.currency : numberFormat.percent;
                        decimal = numberFormat[POINT];
                        precision = numberFormat.decimals;
                        symbol = numberFormat.symbol;
                        pattern = numberFormat.pattern[negative ? 0 : 1];
                    }
                    customPrecision = formatAndPrecision[2];
                    if (customPrecision) {
                        precision = +customPrecision;
                    }
                    if (format === 'e') {
                        return customPrecision ? number.toExponential(precision) : number.toExponential();
                    }
                    if (isPercent) {
                        number *= 100;
                    }
                    number = round(number, precision);
                    negative = number < 0;
                    number = number.split(POINT);
                    integer = number[0];
                    fraction = number[1];
                    if (negative) {
                        integer = integer.substring(1);
                    }
                    value = groupInteger(integer, 0, integer.length, numberFormat);
                    if (fraction) {
                        value += decimal + fraction;
                    }
                    if (format === 'n' && !negative) {
                        return value;
                    }
                    number = EMPTY;
                    for (idx = 0, length = pattern.length; idx < length; idx++) {
                        ch = pattern.charAt(idx);
                        if (ch === 'n') {
                            number += value;
                        } else if (ch === '$' || ch === '%') {
                            number += symbol;
                        } else {
                            number += ch;
                        }
                    }
                    return number;
                }
                if (negative) {
                    number = -number;
                }
                if (format.indexOf('\'') > -1 || format.indexOf('"') > -1 || format.indexOf('\\') > -1) {
                    format = format.replace(literalRegExp, function (match) {
                        var quoteChar = match.charAt(0).replace('\\', ''), literal = match.slice(1).replace(quoteChar, '');
                        literals.push(literal);
                        return PLACEHOLDER;
                    });
                }
                format = format.split(';');
                if (negative && format[1]) {
                    format = format[1];
                    hasNegativeFormat = true;
                } else if (number === 0) {
                    format = format[2] || format[0];
                    if (format.indexOf(SHARP) == -1 && format.indexOf(ZERO) == -1) {
                        return format;
                    }
                } else {
                    format = format[0];
                }
                percentIndex = format.indexOf('%');
                currencyIndex = format.indexOf('$');
                isPercent = percentIndex != -1;
                isCurrency = currencyIndex != -1;
                if (isPercent) {
                    number *= 100;
                }
                if (isCurrency && format[currencyIndex - 1] === '\\') {
                    format = format.split('\\').join('');
                    isCurrency = false;
                }
                if (isCurrency || isPercent) {
                    numberFormat = isCurrency ? numberFormat.currency : numberFormat.percent;
                    decimal = numberFormat[POINT];
                    precision = numberFormat.decimals;
                    symbol = numberFormat.symbol;
                }
                hasGroup = format.indexOf(COMMA) > -1;
                if (hasGroup) {
                    format = format.replace(commaRegExp, EMPTY);
                }
                decimalIndex = format.indexOf(POINT);
                length = format.length;
                if (decimalIndex != -1) {
                    fraction = number.toString().split('e');
                    if (fraction[1]) {
                        fraction = round(number, Math.abs(fraction[1]));
                    } else {
                        fraction = fraction[0];
                    }
                    fraction = fraction.split(POINT)[1] || EMPTY;
                    zeroIndex = format.lastIndexOf(ZERO) - decimalIndex;
                    sharpIndex = format.lastIndexOf(SHARP) - decimalIndex;
                    hasZero = zeroIndex > -1;
                    hasSharp = sharpIndex > -1;
                    idx = fraction.length;
                    if (!hasZero && !hasSharp) {
                        format = format.substring(0, decimalIndex) + format.substring(decimalIndex + 1);
                        length = format.length;
                        decimalIndex = -1;
                        idx = 0;
                    }
                    if (hasZero && zeroIndex > sharpIndex) {
                        idx = zeroIndex;
                    } else if (sharpIndex > zeroIndex) {
                        if (hasSharp && idx > sharpIndex) {
                            idx = sharpIndex;
                        } else if (hasZero && idx < zeroIndex) {
                            idx = zeroIndex;
                        }
                    }
                    if (idx > -1) {
                        number = round(number, idx);
                    }
                } else {
                    number = round(number);
                }
                sharpIndex = format.indexOf(SHARP);
                startZeroIndex = zeroIndex = format.indexOf(ZERO);
                if (sharpIndex == -1 && zeroIndex != -1) {
                    start = zeroIndex;
                } else if (sharpIndex != -1 && zeroIndex == -1) {
                    start = sharpIndex;
                } else {
                    start = sharpIndex > zeroIndex ? zeroIndex : sharpIndex;
                }
                sharpIndex = format.lastIndexOf(SHARP);
                zeroIndex = format.lastIndexOf(ZERO);
                if (sharpIndex == -1 && zeroIndex != -1) {
                    end = zeroIndex;
                } else if (sharpIndex != -1 && zeroIndex == -1) {
                    end = sharpIndex;
                } else {
                    end = sharpIndex > zeroIndex ? sharpIndex : zeroIndex;
                }
                if (start == length) {
                    end = start;
                }
                if (start != -1) {
                    value = number.toString().split(POINT);
                    integer = value[0];
                    fraction = value[1] || EMPTY;
                    integerLength = integer.length;
                    fractionLength = fraction.length;
                    if (negative && number * -1 >= 0) {
                        negative = false;
                    }
                    number = format.substring(0, start);
                    if (negative && !hasNegativeFormat) {
                        number += '-';
                    }
                    for (idx = start; idx < length; idx++) {
                        ch = format.charAt(idx);
                        if (decimalIndex == -1) {
                            if (end - idx < integerLength) {
                                number += integer;
                                break;
                            }
                        } else {
                            if (zeroIndex != -1 && zeroIndex < idx) {
                                replacement = EMPTY;
                            }
                            if (decimalIndex - idx <= integerLength && decimalIndex - idx > -1) {
                                number += integer;
                                idx = decimalIndex;
                            }
                            if (decimalIndex === idx) {
                                number += (fraction ? decimal : EMPTY) + fraction;
                                idx += end - decimalIndex + 1;
                                continue;
                            }
                        }
                        if (ch === ZERO) {
                            number += ch;
                            replacement = ch;
                        } else if (ch === SHARP) {
                            number += replacement;
                        }
                    }
                    if (hasGroup) {
                        number = groupInteger(number, start + (negative ? 1 : 0), Math.max(end, integerLength + start), numberFormat);
                    }
                    if (end >= start) {
                        number += format.substring(end + 1);
                    }
                    if (isCurrency || isPercent) {
                        value = EMPTY;
                        for (idx = 0, length = number.length; idx < length; idx++) {
                            ch = number.charAt(idx);
                            value += ch === '$' || ch === '%' ? symbol : ch;
                        }
                        number = value;
                    }
                    length = literals.length;
                    if (length) {
                        for (idx = 0; idx < length; idx++) {
                            number = number.replace(PLACEHOLDER, literals[idx]);
                        }
                    }
                }
                return number;
            }
            var groupInteger = function (number, start, end, numberFormat) {
                var decimalIndex = number.indexOf(numberFormat[POINT]);
                var groupSizes = numberFormat.groupSize.slice();
                var groupSize = groupSizes.shift();
                var integer, integerLength;
                var idx, parts, value;
                var newGroupSize;
                end = decimalIndex !== -1 ? decimalIndex : end + 1;
                integer = number.substring(start, end);
                integerLength = integer.length;
                if (integerLength >= groupSize) {
                    idx = integerLength;
                    parts = [];
                    while (idx > -1) {
                        value = integer.substring(idx - groupSize, idx);
                        if (value) {
                            parts.push(value);
                        }
                        idx -= groupSize;
                        newGroupSize = groupSizes.shift();
                        groupSize = newGroupSize !== undefined ? newGroupSize : groupSize;
                        if (groupSize === 0) {
                            parts.push(integer.substring(0, idx));
                            break;
                        }
                    }
                    integer = parts.reverse().join(numberFormat[COMMA]);
                    number = number.substring(0, start) + integer + number.substring(end);
                }
                return number;
            };
            var round = function (value, precision) {
                precision = precision || 0;
                value = value.toString().split('e');
                value = Math.round(+(value[0] + 'e' + (value[1] ? +value[1] + precision : precision)));
                value = value.toString().split('e');
                value = +(value[0] + 'e' + (value[1] ? +value[1] - precision : -precision));
                return value.toFixed(precision);
            };
            var toString = function (value, fmt, culture) {
                if (fmt) {
                    if (objectToString.call(value) === '[object Date]') {
                        return formatDate(value, fmt, culture);
                    } else if (typeof value === NUMBER) {
                        return formatNumber(value, fmt, culture);
                    }
                }
                return value !== undefined ? value : '';
            };
            kendo.format = function (fmt) {
                var values = arguments;
                return fmt.replace(formatRegExp, function (match, index, placeholderFormat) {
                    var value = values[parseInt(index, 10) + 1];
                    return toString(value, placeholderFormat ? placeholderFormat.substring(1) : '');
                });
            };
            kendo._extractFormat = function (format) {
                if (format.slice(0, 3) === '{0:') {
                    format = format.slice(3, format.length - 1);
                }
                return format;
            };
            kendo._activeElement = function () {
                try {
                    return document.activeElement;
                } catch (e) {
                    return document.documentElement.activeElement;
                }
            };
            kendo._round = round;
            kendo.toString = toString;
        }());
        (function () {
            var nonBreakingSpaceRegExp = /\u00A0/g, exponentRegExp = /[eE][\-+]?[0-9]+/, shortTimeZoneRegExp = /[+|\-]\d{1,2}/, longTimeZoneRegExp = /[+|\-]\d{1,2}:?\d{2}/, dateRegExp = /^\/Date\((.*?)\)\/$/, offsetRegExp = /[+-]\d*/, formatsSequence = [
                    'G',
                    'g',
                    'd',
                    'F',
                    'D',
                    'y',
                    'm',
                    'T',
                    't'
                ], numberRegExp = {
                    2: /^\d{1,2}/,
                    3: /^\d{1,3}/,
                    4: /^\d{4}/
                }, objectToString = {}.toString;
            function outOfRange(value, start, end) {
                return !(value >= start && value <= end);
            }
            function designatorPredicate(designator) {
                return designator.charAt(0);
            }
            function mapDesignators(designators) {
                return $.map(designators, designatorPredicate);
            }
            function adjustDST(date, hours) {
                if (!hours && date.getHours() === 23) {
                    date.setHours(date.getHours() + 2);
                }
            }
            function lowerArray(data) {
                var idx = 0, length = data.length, array = [];
                for (; idx < length; idx++) {
                    array[idx] = (data[idx] + '').toLowerCase();
                }
                return array;
            }
            function lowerLocalInfo(localInfo) {
                var newLocalInfo = {}, property;
                for (property in localInfo) {
                    newLocalInfo[property] = lowerArray(localInfo[property]);
                }
                return newLocalInfo;
            }
            function parseExact(value, format, culture) {
                if (!value) {
                    return null;
                }
                var lookAhead = function (match) {
                        var i = 0;
                        while (format[idx] === match) {
                            i++;
                            idx++;
                        }
                        if (i > 0) {
                            idx -= 1;
                        }
                        return i;
                    }, getNumber = function (size) {
                        var rg = numberRegExp[size] || new RegExp('^\\d{1,' + size + '}'), match = value.substr(valueIdx, size).match(rg);
                        if (match) {
                            match = match[0];
                            valueIdx += match.length;
                            return parseInt(match, 10);
                        }
                        return null;
                    }, getIndexByName = function (names, lower) {
                        var i = 0, length = names.length, name, nameLength, matchLength = 0, matchIdx = 0, subValue;
                        for (; i < length; i++) {
                            name = names[i];
                            nameLength = name.length;
                            subValue = value.substr(valueIdx, nameLength);
                            if (lower) {
                                subValue = subValue.toLowerCase();
                            }
                            if (subValue == name && nameLength > matchLength) {
                                matchLength = nameLength;
                                matchIdx = i;
                            }
                        }
                        if (matchLength) {
                            valueIdx += matchLength;
                            return matchIdx + 1;
                        }
                        return null;
                    }, checkLiteral = function () {
                        var result = false;
                        if (value.charAt(valueIdx) === format[idx]) {
                            valueIdx++;
                            result = true;
                        }
                        return result;
                    }, calendar = culture.calendars.standard, year = null, month = null, day = null, hours = null, minutes = null, seconds = null, milliseconds = null, idx = 0, valueIdx = 0, literal = false, date = new Date(), twoDigitYearMax = calendar.twoDigitYearMax || 2029, defaultYear = date.getFullYear(), ch, count, length, pattern, pmHour, UTC, matches, amDesignators, pmDesignators, hoursOffset, minutesOffset, hasTime, match;
                if (!format) {
                    format = 'd';
                }
                pattern = calendar.patterns[format];
                if (pattern) {
                    format = pattern;
                }
                format = format.split('');
                length = format.length;
                for (; idx < length; idx++) {
                    ch = format[idx];
                    if (literal) {
                        if (ch === '\'') {
                            literal = false;
                        } else {
                            checkLiteral();
                        }
                    } else {
                        if (ch === 'd') {
                            count = lookAhead('d');
                            if (!calendar._lowerDays) {
                                calendar._lowerDays = lowerLocalInfo(calendar.days);
                            }
                            if (day !== null && count > 2) {
                                continue;
                            }
                            day = count < 3 ? getNumber(2) : getIndexByName(calendar._lowerDays[count == 3 ? 'namesAbbr' : 'names'], true);
                            if (day === null || outOfRange(day, 1, 31)) {
                                return null;
                            }
                        } else if (ch === 'M') {
                            count = lookAhead('M');
                            if (!calendar._lowerMonths) {
                                calendar._lowerMonths = lowerLocalInfo(calendar.months);
                            }
                            month = count < 3 ? getNumber(2) : getIndexByName(calendar._lowerMonths[count == 3 ? 'namesAbbr' : 'names'], true);
                            if (month === null || outOfRange(month, 1, 12)) {
                                return null;
                            }
                            month -= 1;
                        } else if (ch === 'y') {
                            count = lookAhead('y');
                            year = getNumber(count);
                            if (year === null) {
                                return null;
                            }
                            if (count == 2) {
                                if (typeof twoDigitYearMax === 'string') {
                                    twoDigitYearMax = defaultYear + parseInt(twoDigitYearMax, 10);
                                }
                                year = defaultYear - defaultYear % 100 + year;
                                if (year > twoDigitYearMax) {
                                    year -= 100;
                                }
                            }
                        } else if (ch === 'h') {
                            lookAhead('h');
                            hours = getNumber(2);
                            if (hours == 12) {
                                hours = 0;
                            }
                            if (hours === null || outOfRange(hours, 0, 11)) {
                                return null;
                            }
                        } else if (ch === 'H') {
                            lookAhead('H');
                            hours = getNumber(2);
                            if (hours === null || outOfRange(hours, 0, 23)) {
                                return null;
                            }
                        } else if (ch === 'm') {
                            lookAhead('m');
                            minutes = getNumber(2);
                            if (minutes === null || outOfRange(minutes, 0, 59)) {
                                return null;
                            }
                        } else if (ch === 's') {
                            lookAhead('s');
                            seconds = getNumber(2);
                            if (seconds === null || outOfRange(seconds, 0, 59)) {
                                return null;
                            }
                        } else if (ch === 'f') {
                            count = lookAhead('f');
                            match = value.substr(valueIdx, count).match(numberRegExp[3]);
                            milliseconds = getNumber(count);
                            if (milliseconds !== null) {
                                milliseconds = parseFloat('0.' + match[0], 10);
                                milliseconds = kendo._round(milliseconds, 3);
                                milliseconds *= 1000;
                            }
                            if (milliseconds === null || outOfRange(milliseconds, 0, 999)) {
                                return null;
                            }
                        } else if (ch === 't') {
                            count = lookAhead('t');
                            amDesignators = calendar.AM;
                            pmDesignators = calendar.PM;
                            if (count === 1) {
                                amDesignators = mapDesignators(amDesignators);
                                pmDesignators = mapDesignators(pmDesignators);
                            }
                            pmHour = getIndexByName(pmDesignators);
                            if (!pmHour && !getIndexByName(amDesignators)) {
                                return null;
                            }
                        } else if (ch === 'z') {
                            UTC = true;
                            count = lookAhead('z');
                            if (value.substr(valueIdx, 1) === 'Z') {
                                checkLiteral();
                                continue;
                            }
                            matches = value.substr(valueIdx, 6).match(count > 2 ? longTimeZoneRegExp : shortTimeZoneRegExp);
                            if (!matches) {
                                return null;
                            }
                            matches = matches[0].split(':');
                            hoursOffset = matches[0];
                            minutesOffset = matches[1];
                            if (!minutesOffset && hoursOffset.length > 3) {
                                valueIdx = hoursOffset.length - 2;
                                minutesOffset = hoursOffset.substring(valueIdx);
                                hoursOffset = hoursOffset.substring(0, valueIdx);
                            }
                            hoursOffset = parseInt(hoursOffset, 10);
                            if (outOfRange(hoursOffset, -12, 13)) {
                                return null;
                            }
                            if (count > 2) {
                                minutesOffset = parseInt(minutesOffset, 10);
                                if (isNaN(minutesOffset) || outOfRange(minutesOffset, 0, 59)) {
                                    return null;
                                }
                            }
                        } else if (ch === '\'') {
                            literal = true;
                            checkLiteral();
                        } else if (!checkLiteral()) {
                            return null;
                        }
                    }
                }
                hasTime = hours !== null || minutes !== null || seconds || null;
                if (year === null && month === null && day === null && hasTime) {
                    year = defaultYear;
                    month = date.getMonth();
                    day = date.getDate();
                } else {
                    if (year === null) {
                        year = defaultYear;
                    }
                    if (day === null) {
                        day = 1;
                    }
                }
                if (pmHour && hours < 12) {
                    hours += 12;
                }
                if (UTC) {
                    if (hoursOffset) {
                        hours += -hoursOffset;
                    }
                    if (minutesOffset) {
                        minutes += -minutesOffset;
                    }
                    value = new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds));
                } else {
                    value = new Date(year, month, day, hours, minutes, seconds, milliseconds);
                    adjustDST(value, hours);
                }
                if (year < 100) {
                    value.setFullYear(year);
                }
                if (value.getDate() !== day && UTC === undefined) {
                    return null;
                }
                return value;
            }
            function parseMicrosoftFormatOffset(offset) {
                var sign = offset.substr(0, 1) === '-' ? -1 : 1;
                offset = offset.substring(1);
                offset = parseInt(offset.substr(0, 2), 10) * 60 + parseInt(offset.substring(2), 10);
                return sign * offset;
            }
            kendo.parseDate = function (value, formats, culture) {
                if (objectToString.call(value) === '[object Date]') {
                    return value;
                }
                var idx = 0;
                var date = null;
                var length, patterns;
                var tzoffset;
                if (value && value.indexOf('/D') === 0) {
                    date = dateRegExp.exec(value);
                    if (date) {
                        date = date[1];
                        tzoffset = offsetRegExp.exec(date.substring(1));
                        date = new Date(parseInt(date, 10));
                        if (tzoffset) {
                            tzoffset = parseMicrosoftFormatOffset(tzoffset[0]);
                            date = kendo.timezone.apply(date, 0);
                            date = kendo.timezone.convert(date, 0, -1 * tzoffset);
                        }
                        return date;
                    }
                }
                culture = kendo.getCulture(culture);
                if (!formats) {
                    formats = [];
                    patterns = culture.calendar.patterns;
                    length = formatsSequence.length;
                    for (; idx < length; idx++) {
                        formats[idx] = patterns[formatsSequence[idx]];
                    }
                    idx = 0;
                    formats = formats.concat([
                        'yyyy/MM/dd HH:mm:ss',
                        'yyyy/MM/dd HH:mm',
                        'yyyy/MM/dd',
                        'ddd MMM dd yyyy HH:mm:ss',
                        'yyyy-MM-ddTHH:mm:ss.fffffffzzz',
                        'yyyy-MM-ddTHH:mm:ss.fffzzz',
                        'yyyy-MM-ddTHH:mm:sszzz',
                        'yyyy-MM-ddTHH:mm:ss.fffffff',
                        'yyyy-MM-ddTHH:mm:ss.fff',
                        'yyyy-MM-ddTHH:mmzzz',
                        'yyyy-MM-ddTHH:mmzz',
                        'yyyy-MM-ddTHH:mm:ss',
                        'yyyy-MM-ddTHH:mm',
                        'yyyy-MM-dd HH:mm:ss',
                        'yyyy-MM-dd HH:mm',
                        'yyyy-MM-dd',
                        'HH:mm:ss',
                        'HH:mm'
                    ]);
                }
                formats = isArray(formats) ? formats : [formats];
                length = formats.length;
                for (; idx < length; idx++) {
                    date = parseExact(value, formats[idx], culture);
                    if (date) {
                        return date;
                    }
                }
                return date;
            };
            kendo.parseInt = function (value, culture) {
                var result = kendo.parseFloat(value, culture);
                if (result) {
                    result = result | 0;
                }
                return result;
            };
            kendo.parseFloat = function (value, culture, format) {
                if (!value && value !== 0) {
                    return null;
                }
                if (typeof value === NUMBER) {
                    return value;
                }
                value = value.toString();
                culture = kendo.getCulture(culture);
                var number = culture.numberFormat, percent = number.percent, currency = number.currency, symbol = currency.symbol, percentSymbol = percent.symbol, negative = value.indexOf('-'), parts, isPercent;
                if (exponentRegExp.test(value)) {
                    value = parseFloat(value.replace(number['.'], '.'));
                    if (isNaN(value)) {
                        value = null;
                    }
                    return value;
                }
                if (negative > 0) {
                    return null;
                } else {
                    negative = negative > -1;
                }
                if (value.indexOf(symbol) > -1 || format && format.toLowerCase().indexOf('c') > -1) {
                    number = currency;
                    parts = number.pattern[0].replace('$', symbol).split('n');
                    if (value.indexOf(parts[0]) > -1 && value.indexOf(parts[1]) > -1) {
                        value = value.replace(parts[0], '').replace(parts[1], '');
                        negative = true;
                    }
                } else if (value.indexOf(percentSymbol) > -1) {
                    isPercent = true;
                    number = percent;
                    symbol = percentSymbol;
                }
                value = value.replace('-', '').replace(symbol, '').replace(nonBreakingSpaceRegExp, ' ').split(number[','].replace(nonBreakingSpaceRegExp, ' ')).join('').replace(number['.'], '.');
                value = parseFloat(value);
                if (isNaN(value)) {
                    value = null;
                } else if (negative) {
                    value *= -1;
                }
                if (value && isPercent) {
                    value /= 100;
                }
                return value;
            };
        }());
        function getShadows(element) {
            var shadow = element.css(kendo.support.transitions.css + 'box-shadow') || element.css('box-shadow'), radius = shadow ? shadow.match(boxShadowRegExp) || [
                    0,
                    0,
                    0,
                    0,
                    0
                ] : [
                    0,
                    0,
                    0,
                    0,
                    0
                ], blur = math.max(+radius[3], +(radius[4] || 0));
            return {
                left: -radius[1] + blur,
                right: +radius[1] + blur,
                bottom: +radius[2] + blur
            };
        }
        function wrap(element, autosize) {
            var browser = support.browser, percentage, isRtl = element.css('direction') == 'rtl';
            if (!element.parent().hasClass('k-animation-container')) {
                var shadows = getShadows(element), width = element[0].style.width, height = element[0].style.height, percentWidth = percentRegExp.test(width), percentHeight = percentRegExp.test(height);
                if (browser.opera) {
                    shadows.left = shadows.right = shadows.bottom = 5;
                }
                percentage = percentWidth || percentHeight;
                if (!percentWidth && (!autosize || autosize && width)) {
                    width = element.outerWidth();
                }
                if (!percentHeight && (!autosize || autosize && height)) {
                    height = element.outerHeight();
                }
                element.wrap($('<div/>').addClass('k-animation-container').css({
                    width: width,
                    height: height,
                    marginLeft: shadows.left * (isRtl ? 1 : -1),
                    paddingLeft: shadows.left,
                    paddingRight: shadows.right,
                    paddingBottom: shadows.bottom
                }));
                if (percentage) {
                    element.css({
                        width: '100%',
                        height: '100%',
                        boxSizing: 'border-box',
                        mozBoxSizing: 'border-box',
                        webkitBoxSizing: 'border-box'
                    });
                }
            } else {
                var wrapper = element.parent('.k-animation-container'), wrapperStyle = wrapper[0].style;
                if (wrapper.is(':hidden')) {
                    wrapper.show();
                }
                percentage = percentRegExp.test(wrapperStyle.width) || percentRegExp.test(wrapperStyle.height);
                if (!percentage) {
                    wrapper.css({
                        width: element.outerWidth(),
                        height: element.outerHeight(),
                        boxSizing: 'content-box',
                        mozBoxSizing: 'content-box',
                        webkitBoxSizing: 'content-box'
                    });
                }
            }
            if (browser.msie && math.floor(browser.version) <= 7) {
                element.css({ zoom: 1 });
                element.children('.k-menu').width(element.width());
            }
            return element.parent();
        }
        function deepExtend(destination) {
            var i = 1, length = arguments.length;
            for (i = 1; i < length; i++) {
                deepExtendOne(destination, arguments[i]);
            }
            return destination;
        }
        function deepExtendOne(destination, source) {
            var ObservableArray = kendo.data.ObservableArray, LazyObservableArray = kendo.data.LazyObservableArray, DataSource = kendo.data.DataSource, HierarchicalDataSource = kendo.data.HierarchicalDataSource, property, propValue, propType, propInit, destProp;
            for (property in source) {
                propValue = source[property];
                propType = typeof propValue;
                if (propType === OBJECT && propValue !== null) {
                    propInit = propValue.constructor;
                } else {
                    propInit = null;
                }
                if (propInit && propInit !== Array && propInit !== ObservableArray && propInit !== LazyObservableArray && propInit !== DataSource && propInit !== HierarchicalDataSource) {
                    if (propValue instanceof Date) {
                        destination[property] = new Date(propValue.getTime());
                    } else if (isFunction(propValue.clone)) {
                        destination[property] = propValue.clone();
                    } else {
                        destProp = destination[property];
                        if (typeof destProp === OBJECT) {
                            destination[property] = destProp || {};
                        } else {
                            destination[property] = {};
                        }
                        deepExtendOne(destination[property], propValue);
                    }
                } else if (propType !== UNDEFINED) {
                    destination[property] = propValue;
                }
            }
            return destination;
        }
        function testRx(agent, rxs, dflt) {
            for (var rx in rxs) {
                if (rxs.hasOwnProperty(rx) && rxs[rx].test(agent)) {
                    return rx;
                }
            }
            return dflt !== undefined ? dflt : agent;
        }
        function toHyphens(str) {
            return str.replace(/([a-z][A-Z])/g, function (g) {
                return g.charAt(0) + '-' + g.charAt(1).toLowerCase();
            });
        }
        function toCamelCase(str) {
            return str.replace(/\-(\w)/g, function (strMatch, g1) {
                return g1.toUpperCase();
            });
        }
        function getComputedStyles(element, properties) {
            var styles = {}, computedStyle;
            if (document.defaultView && document.defaultView.getComputedStyle) {
                computedStyle = document.defaultView.getComputedStyle(element, '');
                if (properties) {
                    $.each(properties, function (idx, value) {
                        styles[value] = computedStyle.getPropertyValue(value);
                    });
                }
            } else {
                computedStyle = element.currentStyle;
                if (properties) {
                    $.each(properties, function (idx, value) {
                        styles[value] = computedStyle[toCamelCase(value)];
                    });
                }
            }
            if (!kendo.size(styles)) {
                styles = computedStyle;
            }
            return styles;
        }
        function isScrollable(element) {
            if (element && element.className && typeof element.className === 'string' && element.className.indexOf('k-auto-scrollable') > -1) {
                return true;
            }
            var overflow = getComputedStyles(element, ['overflow']).overflow;
            return overflow == 'auto' || overflow == 'scroll';
        }
        function scrollLeft(element, value) {
            var webkit = support.browser.webkit;
            var mozila = support.browser.mozilla;
            var el = element instanceof $ ? element[0] : element;
            var isRtl;
            if (!element) {
                return;
            }
            isRtl = support.isRtl(element);
            if (value !== undefined) {
                if (isRtl && webkit) {
                    el.scrollLeft = el.scrollWidth - el.clientWidth - value;
                } else if (isRtl && mozila) {
                    el.scrollLeft = -value;
                } else {
                    el.scrollLeft = value;
                }
            } else {
                if (isRtl && webkit) {
                    return el.scrollWidth - el.clientWidth - el.scrollLeft;
                } else {
                    return Math.abs(el.scrollLeft);
                }
            }
        }
        (function () {
            support._scrollbar = undefined;
            support.scrollbar = function (refresh) {
                if (!isNaN(support._scrollbar) && !refresh) {
                    return support._scrollbar;
                } else {
                    var div = document.createElement('div'), result;
                    div.style.cssText = 'overflow:scroll;overflow-x:hidden;zoom:1;clear:both;display:block';
                    div.innerHTML = '&nbsp;';
                    document.body.appendChild(div);
                    support._scrollbar = result = div.offsetWidth - div.scrollWidth;
                    document.body.removeChild(div);
                    return result;
                }
            };
            support.isRtl = function (element) {
                return $(element).closest('.k-rtl').length > 0;
            };
            var table = document.createElement('table');
            try {
                table.innerHTML = '<tr><td></td></tr>';
                support.tbodyInnerHtml = true;
            } catch (e) {
                support.tbodyInnerHtml = false;
            }
            support.touch = 'ontouchstart' in window;
            support.msPointers = window.MSPointerEvent;
            support.pointers = window.PointerEvent;
            var transitions = support.transitions = false, transforms = support.transforms = false, elementProto = 'HTMLElement' in window ? HTMLElement.prototype : [];
            support.hasHW3D = 'WebKitCSSMatrix' in window && 'm11' in new window.WebKitCSSMatrix() || 'MozPerspective' in document.documentElement.style || 'msPerspective' in document.documentElement.style;
            each([
                'Moz',
                'webkit',
                'O',
                'ms'
            ], function () {
                var prefix = this.toString(), hasTransitions = typeof table.style[prefix + 'Transition'] === STRING;
                if (hasTransitions || typeof table.style[prefix + 'Transform'] === STRING) {
                    var lowPrefix = prefix.toLowerCase();
                    transforms = {
                        css: lowPrefix != 'ms' ? '-' + lowPrefix + '-' : '',
                        prefix: prefix,
                        event: lowPrefix === 'o' || lowPrefix === 'webkit' ? lowPrefix : ''
                    };
                    if (hasTransitions) {
                        transitions = transforms;
                        transitions.event = transitions.event ? transitions.event + 'TransitionEnd' : 'transitionend';
                    }
                    return false;
                }
            });
            table = null;
            support.transforms = transforms;
            support.transitions = transitions;
            support.devicePixelRatio = window.devicePixelRatio === undefined ? 1 : window.devicePixelRatio;
            try {
                support.screenWidth = window.outerWidth || window.screen ? window.screen.availWidth : window.innerWidth;
                support.screenHeight = window.outerHeight || window.screen ? window.screen.availHeight : window.innerHeight;
            } catch (e) {
                support.screenWidth = window.screen.availWidth;
                support.screenHeight = window.screen.availHeight;
            }
            support.detectOS = function (ua) {
                var os = false, minorVersion, match = [], notAndroidPhone = !/mobile safari/i.test(ua), agentRxs = {
                        wp: /(Windows Phone(?: OS)?)\s(\d+)\.(\d+(\.\d+)?)/,
                        fire: /(Silk)\/(\d+)\.(\d+(\.\d+)?)/,
                        android: /(Android|Android.*(?:Opera|Firefox).*?\/)\s*(\d+)\.(\d+(\.\d+)?)/,
                        iphone: /(iPhone|iPod).*OS\s+(\d+)[\._]([\d\._]+)/,
                        ipad: /(iPad).*OS\s+(\d+)[\._]([\d_]+)/,
                        meego: /(MeeGo).+NokiaBrowser\/(\d+)\.([\d\._]+)/,
                        webos: /(webOS)\/(\d+)\.(\d+(\.\d+)?)/,
                        blackberry: /(BlackBerry|BB10).*?Version\/(\d+)\.(\d+(\.\d+)?)/,
                        playbook: /(PlayBook).*?Tablet\s*OS\s*(\d+)\.(\d+(\.\d+)?)/,
                        windows: /(MSIE)\s+(\d+)\.(\d+(\.\d+)?)/,
                        tizen: /(tizen).*?Version\/(\d+)\.(\d+(\.\d+)?)/i,
                        sailfish: /(sailfish).*rv:(\d+)\.(\d+(\.\d+)?).*firefox/i,
                        ffos: /(Mobile).*rv:(\d+)\.(\d+(\.\d+)?).*Firefox/
                    }, osRxs = {
                        ios: /^i(phone|pad|pod)$/i,
                        android: /^android|fire$/i,
                        blackberry: /^blackberry|playbook/i,
                        windows: /windows/,
                        wp: /wp/,
                        flat: /sailfish|ffos|tizen/i,
                        meego: /meego/
                    }, formFactorRxs = { tablet: /playbook|ipad|fire/i }, browserRxs = {
                        omini: /Opera\sMini/i,
                        omobile: /Opera\sMobi/i,
                        firefox: /Firefox|Fennec/i,
                        mobilesafari: /version\/.*safari/i,
                        ie: /MSIE|Windows\sPhone/i,
                        chrome: /chrome|crios/i,
                        webkit: /webkit/i
                    };
                for (var agent in agentRxs) {
                    if (agentRxs.hasOwnProperty(agent)) {
                        match = ua.match(agentRxs[agent]);
                        if (match) {
                            if (agent == 'windows' && 'plugins' in navigator) {
                                return false;
                            }
                            os = {};
                            os.device = agent;
                            os.tablet = testRx(agent, formFactorRxs, false);
                            os.browser = testRx(ua, browserRxs, 'default');
                            os.name = testRx(agent, osRxs);
                            os[os.name] = true;
                            os.majorVersion = match[2];
                            os.minorVersion = match[3].replace('_', '.');
                            minorVersion = os.minorVersion.replace('.', '').substr(0, 2);
                            os.flatVersion = os.majorVersion + minorVersion + new Array(3 - (minorVersion.length < 3 ? minorVersion.length : 2)).join('0');
                            os.cordova = typeof window.PhoneGap !== UNDEFINED || typeof window.cordova !== UNDEFINED;
                            os.appMode = window.navigator.standalone || /file|local|wmapp/.test(window.location.protocol) || os.cordova;
                            if (os.android && (support.devicePixelRatio < 1.5 && os.flatVersion < 400 || notAndroidPhone) && (support.screenWidth > 800 || support.screenHeight > 800)) {
                                os.tablet = agent;
                            }
                            break;
                        }
                    }
                }
                return os;
            };
            var mobileOS = support.mobileOS = support.detectOS(navigator.userAgent);
            support.wpDevicePixelRatio = mobileOS.wp ? screen.width / 320 : 0;
            support.kineticScrollNeeded = mobileOS && (support.touch || support.msPointers || support.pointers);
            support.hasNativeScrolling = false;
            if (mobileOS.ios || mobileOS.android && mobileOS.majorVersion > 2 || mobileOS.wp) {
                support.hasNativeScrolling = mobileOS;
            }
            support.delayedClick = function () {
                if (support.touch) {
                    if (mobileOS.ios) {
                        return true;
                    }
                    if (mobileOS.android) {
                        if (!support.browser.chrome) {
                            return true;
                        }
                        if (support.browser.version < 32) {
                            return false;
                        }
                        return !($('meta[name=viewport]').attr('content') || '').match(/user-scalable=no/i);
                    }
                }
                return false;
            };
            support.mouseAndTouchPresent = support.touch && !(support.mobileOS.ios || support.mobileOS.android);
            support.detectBrowser = function (ua) {
                var browser = false, match = [], browserRxs = {
                        edge: /(edge)[ \/]([\w.]+)/i,
                        webkit: /(chrome)[ \/]([\w.]+)/i,
                        safari: /(webkit)[ \/]([\w.]+)/i,
                        opera: /(opera)(?:.*version|)[ \/]([\w.]+)/i,
                        msie: /(msie\s|trident.*? rv:)([\w.]+)/i,
                        mozilla: /(mozilla)(?:.*? rv:([\w.]+)|)/i
                    };
                for (var agent in browserRxs) {
                    if (browserRxs.hasOwnProperty(agent)) {
                        match = ua.match(browserRxs[agent]);
                        if (match) {
                            browser = {};
                            browser[agent] = true;
                            browser[match[1].toLowerCase().split(' ')[0].split('/')[0]] = true;
                            browser.version = parseInt(document.documentMode || match[2], 10);
                            break;
                        }
                    }
                }
                return browser;
            };
            support.browser = support.detectBrowser(navigator.userAgent);
            support.detectClipboardAccess = function () {
                var commands = {
                    copy: document.queryCommandSupported ? document.queryCommandSupported('copy') : false,
                    cut: document.queryCommandSupported ? document.queryCommandSupported('cut') : false,
                    paste: document.queryCommandSupported ? document.queryCommandSupported('paste') : false
                };
                if (support.browser.chrome) {
                    commands.paste = false;
                    if (support.browser.version >= 43) {
                        commands.copy = true;
                        commands.cut = true;
                    }
                }
                return commands;
            };
            support.clipboard = support.detectClipboardAccess();
            support.zoomLevel = function () {
                try {
                    var browser = support.browser;
                    var ie11WidthCorrection = 0;
                    var docEl = document.documentElement;
                    if (browser.msie && browser.version == 11 && docEl.scrollHeight > docEl.clientHeight && !support.touch) {
                        ie11WidthCorrection = support.scrollbar();
                    }
                    return support.touch ? docEl.clientWidth / window.innerWidth : browser.msie && browser.version >= 10 ? ((top || window).document.documentElement.offsetWidth + ie11WidthCorrection) / (top || window).innerWidth : 1;
                } catch (e) {
                    return 1;
                }
            };
            support.cssBorderSpacing = typeof document.documentElement.style.borderSpacing != 'undefined' && !(support.browser.msie && support.browser.version < 8);
            (function (browser) {
                var cssClass = '', docElement = $(document.documentElement), majorVersion = parseInt(browser.version, 10);
                if (browser.msie) {
                    cssClass = 'ie';
                } else if (browser.mozilla) {
                    cssClass = 'ff';
                } else if (browser.safari) {
                    cssClass = 'safari';
                } else if (browser.webkit) {
                    cssClass = 'webkit';
                } else if (browser.opera) {
                    cssClass = 'opera';
                } else if (browser.edge) {
                    cssClass = 'edge';
                }
                if (cssClass) {
                    cssClass = 'k-' + cssClass + ' k-' + cssClass + majorVersion;
                }
                if (support.mobileOS) {
                    cssClass += ' k-mobile';
                }
                docElement.addClass(cssClass);
            }(support.browser));
            support.eventCapture = document.documentElement.addEventListener;
            var input = document.createElement('input');
            support.placeholder = 'placeholder' in input;
            support.propertyChangeEvent = 'onpropertychange' in input;
            support.input = function () {
                var types = [
                    'number',
                    'date',
                    'time',
                    'month',
                    'week',
                    'datetime',
                    'datetime-local'
                ];
                var length = types.length;
                var value = 'test';
                var result = {};
                var idx = 0;
                var type;
                for (; idx < length; idx++) {
                    type = types[idx];
                    input.setAttribute('type', type);
                    input.value = value;
                    result[type.replace('-', '')] = input.type !== 'text' && input.value !== value;
                }
                return result;
            }();
            input.style.cssText = 'float:left;';
            support.cssFloat = !!input.style.cssFloat;
            input = null;
            support.stableSort = function () {
                var threshold = 513;
                var sorted = [{
                        index: 0,
                        field: 'b'
                    }];
                for (var i = 1; i < threshold; i++) {
                    sorted.push({
                        index: i,
                        field: 'a'
                    });
                }
                sorted.sort(function (a, b) {
                    return a.field > b.field ? 1 : a.field < b.field ? -1 : 0;
                });
                return sorted[0].index === 1;
            }();
            support.matchesSelector = elementProto.webkitMatchesSelector || elementProto.mozMatchesSelector || elementProto.msMatchesSelector || elementProto.oMatchesSelector || elementProto.matchesSelector || elementProto.matches || function (selector) {
                var nodeList = document.querySelectorAll ? (this.parentNode || document).querySelectorAll(selector) || [] : $(selector), i = nodeList.length;
                while (i--) {
                    if (nodeList[i] == this) {
                        return true;
                    }
                }
                return false;
            };
            support.pushState = window.history && window.history.pushState;
            var documentMode = document.documentMode;
            support.hashChange = 'onhashchange' in window && !(support.browser.msie && (!documentMode || documentMode <= 8));
            support.customElements = 'registerElement' in window.document;
        }());
        function size(obj) {
            var result = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key) && key != 'toJSON') {
                    result++;
                }
            }
            return result;
        }
        function getOffset(element, type, positioned) {
            if (!type) {
                type = 'offset';
            }
            var result = element[type]();
            if (support.browser.msie && (support.pointers || support.msPointers) && !positioned) {
                result.top -= window.pageYOffset - document.documentElement.scrollTop;
                result.left -= window.pageXOffset - document.documentElement.scrollLeft;
            }
            return result;
        }
        var directions = {
            left: { reverse: 'right' },
            right: { reverse: 'left' },
            down: { reverse: 'up' },
            up: { reverse: 'down' },
            top: { reverse: 'bottom' },
            bottom: { reverse: 'top' },
            'in': { reverse: 'out' },
            out: { reverse: 'in' }
        };
        function parseEffects(input) {
            var effects = {};
            each(typeof input === 'string' ? input.split(' ') : input, function (idx) {
                effects[idx] = this;
            });
            return effects;
        }
        function fx(element) {
            return new kendo.effects.Element(element);
        }
        var effects = {};
        $.extend(effects, {
            enabled: true,
            Element: function (element) {
                this.element = $(element);
            },
            promise: function (element, options) {
                if (!element.is(':visible')) {
                    element.css({ display: element.data('olddisplay') || 'block' }).css('display');
                }
                if (options.hide) {
                    element.data('olddisplay', element.css('display')).hide();
                }
                if (options.init) {
                    options.init();
                }
                if (options.completeCallback) {
                    options.completeCallback(element);
                }
                element.dequeue();
            },
            disable: function () {
                this.enabled = false;
                this.promise = this.promiseShim;
            },
            enable: function () {
                this.enabled = true;
                this.promise = this.animatedPromise;
            }
        });
        effects.promiseShim = effects.promise;
        function prepareAnimationOptions(options, duration, reverse, complete) {
            if (typeof options === STRING) {
                if (isFunction(duration)) {
                    complete = duration;
                    duration = 400;
                    reverse = false;
                }
                if (isFunction(reverse)) {
                    complete = reverse;
                    reverse = false;
                }
                if (typeof duration === BOOLEAN) {
                    reverse = duration;
                    duration = 400;
                }
                options = {
                    effects: options,
                    duration: duration,
                    reverse: reverse,
                    complete: complete
                };
            }
            return extend({
                effects: {},
                duration: 400,
                reverse: false,
                init: noop,
                teardown: noop,
                hide: false
            }, options, {
                completeCallback: options.complete,
                complete: noop
            });
        }
        function animate(element, options, duration, reverse, complete) {
            var idx = 0, length = element.length, instance;
            for (; idx < length; idx++) {
                instance = $(element[idx]);
                instance.queue(function () {
                    effects.promise(instance, prepareAnimationOptions(options, duration, reverse, complete));
                });
            }
            return element;
        }
        function toggleClass(element, classes, options, add) {
            if (classes) {
                classes = classes.split(' ');
                each(classes, function (idx, value) {
                    element.toggleClass(value, add);
                });
            }
            return element;
        }
        if (!('kendoAnimate' in $.fn)) {
            extend($.fn, {
                kendoStop: function (clearQueue, gotoEnd) {
                    return this.stop(clearQueue, gotoEnd);
                },
                kendoAnimate: function (options, duration, reverse, complete) {
                    return animate(this, options, duration, reverse, complete);
                },
                kendoAddClass: function (classes, options) {
                    return kendo.toggleClass(this, classes, options, true);
                },
                kendoRemoveClass: function (classes, options) {
                    return kendo.toggleClass(this, classes, options, false);
                },
                kendoToggleClass: function (classes, options, toggle) {
                    return kendo.toggleClass(this, classes, options, toggle);
                }
            });
        }
        var ampRegExp = /&/g, ltRegExp = /</g, quoteRegExp = /"/g, aposRegExp = /'/g, gtRegExp = />/g;
        function htmlEncode(value) {
            return ('' + value).replace(ampRegExp, '&amp;').replace(ltRegExp, '&lt;').replace(gtRegExp, '&gt;').replace(quoteRegExp, '&quot;').replace(aposRegExp, '&#39;');
        }
        var eventTarget = function (e) {
            return e.target;
        };
        if (support.touch) {
            eventTarget = function (e) {
                var touches = 'originalEvent' in e ? e.originalEvent.changedTouches : 'changedTouches' in e ? e.changedTouches : null;
                return touches ? document.elementFromPoint(touches[0].clientX, touches[0].clientY) : e.target;
            };
            each([
                'swipe',
                'swipeLeft',
                'swipeRight',
                'swipeUp',
                'swipeDown',
                'doubleTap',
                'tap'
            ], function (m, value) {
                $.fn[value] = function (callback) {
                    return this.bind(value, callback);
                };
            });
        }
        if (support.touch) {
            if (!support.mobileOS) {
                support.mousedown = 'mousedown touchstart';
                support.mouseup = 'mouseup touchend';
                support.mousemove = 'mousemove touchmove';
                support.mousecancel = 'mouseleave touchcancel';
                support.click = 'click';
                support.resize = 'resize';
            } else {
                support.mousedown = 'touchstart';
                support.mouseup = 'touchend';
                support.mousemove = 'touchmove';
                support.mousecancel = 'touchcancel';
                support.click = 'touchend';
                support.resize = 'orientationchange';
            }
        } else if (support.pointers) {
            support.mousemove = 'pointermove';
            support.mousedown = 'pointerdown';
            support.mouseup = 'pointerup';
            support.mousecancel = 'pointercancel';
            support.click = 'pointerup';
            support.resize = 'orientationchange resize';
        } else if (support.msPointers) {
            support.mousemove = 'MSPointerMove';
            support.mousedown = 'MSPointerDown';
            support.mouseup = 'MSPointerUp';
            support.mousecancel = 'MSPointerCancel';
            support.click = 'MSPointerUp';
            support.resize = 'orientationchange resize';
        } else {
            support.mousemove = 'mousemove';
            support.mousedown = 'mousedown';
            support.mouseup = 'mouseup';
            support.mousecancel = 'mouseleave';
            support.click = 'click';
            support.resize = 'resize';
        }
        var wrapExpression = function (members, paramName) {
                var result = paramName || 'd', index, idx, length, member, count = 1;
                for (idx = 0, length = members.length; idx < length; idx++) {
                    member = members[idx];
                    if (member !== '') {
                        index = member.indexOf('[');
                        if (index !== 0) {
                            if (index == -1) {
                                member = '.' + member;
                            } else {
                                count++;
                                member = '.' + member.substring(0, index) + ' || {})' + member.substring(index);
                            }
                        }
                        count++;
                        result += member + (idx < length - 1 ? ' || {})' : ')');
                    }
                }
                return new Array(count).join('(') + result;
            }, localUrlRe = /^([a-z]+:)?\/\//i;
        extend(kendo, {
            widgets: [],
            _widgetRegisteredCallbacks: [],
            ui: kendo.ui || {},
            fx: kendo.fx || fx,
            effects: kendo.effects || effects,
            mobile: kendo.mobile || {},
            data: kendo.data || {},
            dataviz: kendo.dataviz || {},
            drawing: kendo.drawing || {},
            spreadsheet: { messages: {} },
            keys: {
                INSERT: 45,
                DELETE: 46,
                BACKSPACE: 8,
                TAB: 9,
                ENTER: 13,
                ESC: 27,
                LEFT: 37,
                UP: 38,
                RIGHT: 39,
                DOWN: 40,
                END: 35,
                HOME: 36,
                SPACEBAR: 32,
                PAGEUP: 33,
                PAGEDOWN: 34,
                F2: 113,
                F10: 121,
                F12: 123,
                NUMPAD_PLUS: 107,
                NUMPAD_MINUS: 109,
                NUMPAD_DOT: 110
            },
            support: kendo.support || support,
            animate: kendo.animate || animate,
            ns: '',
            attr: function (value) {
                return 'data-' + kendo.ns + value;
            },
            getShadows: getShadows,
            wrap: wrap,
            deepExtend: deepExtend,
            getComputedStyles: getComputedStyles,
            webComponents: kendo.webComponents || [],
            isScrollable: isScrollable,
            scrollLeft: scrollLeft,
            size: size,
            toCamelCase: toCamelCase,
            toHyphens: toHyphens,
            getOffset: kendo.getOffset || getOffset,
            parseEffects: kendo.parseEffects || parseEffects,
            toggleClass: kendo.toggleClass || toggleClass,
            directions: kendo.directions || directions,
            Observable: Observable,
            Class: Class,
            Template: Template,
            template: proxy(Template.compile, Template),
            render: proxy(Template.render, Template),
            stringify: proxy(JSON.stringify, JSON),
            eventTarget: eventTarget,
            htmlEncode: htmlEncode,
            isLocalUrl: function (url) {
                return url && !localUrlRe.test(url);
            },
            expr: function (expression, safe, paramName) {
                expression = expression || '';
                if (typeof safe == STRING) {
                    paramName = safe;
                    safe = false;
                }
                paramName = paramName || 'd';
                if (expression && expression.charAt(0) !== '[') {
                    expression = '.' + expression;
                }
                if (safe) {
                    expression = expression.replace(/"([^.]*)\.([^"]*)"/g, '"$1_$DOT$_$2"');
                    expression = expression.replace(/'([^.]*)\.([^']*)'/g, '\'$1_$DOT$_$2\'');
                    expression = wrapExpression(expression.split('.'), paramName);
                    expression = expression.replace(/_\$DOT\$_/g, '.');
                } else {
                    expression = paramName + expression;
                }
                return expression;
            },
            getter: function (expression, safe) {
                var key = expression + safe;
                return getterCache[key] = getterCache[key] || new Function('d', 'return ' + kendo.expr(expression, safe));
            },
            setter: function (expression) {
                return setterCache[expression] = setterCache[expression] || new Function('d,value', kendo.expr(expression) + '=value');
            },
            accessor: function (expression) {
                return {
                    get: kendo.getter(expression),
                    set: kendo.setter(expression)
                };
            },
            guid: function () {
                var id = '', i, random;
                for (i = 0; i < 32; i++) {
                    random = math.random() * 16 | 0;
                    if (i == 8 || i == 12 || i == 16 || i == 20) {
                        id += '-';
                    }
                    id += (i == 12 ? 4 : i == 16 ? random & 3 | 8 : random).toString(16);
                }
                return id;
            },
            roleSelector: function (role) {
                return role.replace(/(\S+)/g, '[' + kendo.attr('role') + '=$1],').slice(0, -1);
            },
            directiveSelector: function (directives) {
                var selectors = directives.split(' ');
                if (selectors) {
                    for (var i = 0; i < selectors.length; i++) {
                        if (selectors[i] != 'view') {
                            selectors[i] = selectors[i].replace(/(\w*)(view|bar|strip|over)$/, '$1-$2');
                        }
                    }
                }
                return selectors.join(' ').replace(/(\S+)/g, 'kendo-mobile-$1,').slice(0, -1);
            },
            triggeredByInput: function (e) {
                return /^(label|input|textarea|select)$/i.test(e.target.tagName);
            },
            onWidgetRegistered: function (callback) {
                for (var i = 0, len = kendo.widgets.length; i < len; i++) {
                    callback(kendo.widgets[i]);
                }
                kendo._widgetRegisteredCallbacks.push(callback);
            },
            logToConsole: function (message, type) {
                var console = window.console;
                if (!kendo.suppressLog && typeof console != 'undefined' && console.log) {
                    console[type || 'log'](message);
                }
            }
        });
        var Widget = Observable.extend({
            init: function (element, options) {
                var that = this;
                that.element = kendo.jQuery(element).handler(that);
                that.angular('init', options);
                Observable.fn.init.call(that);
                var dataSource = options ? options.dataSource : null;
                if (dataSource) {
                    options = extend({}, options, { dataSource: {} });
                }
                options = that.options = extend(true, {}, that.options, options);
                if (dataSource) {
                    options.dataSource = dataSource;
                }
                if (!that.element.attr(kendo.attr('role'))) {
                    that.element.attr(kendo.attr('role'), (options.name || '').toLowerCase());
                }
                that.element.data('kendo' + options.prefix + options.name, that);
                that.bind(that.events, options);
            },
            events: [],
            options: { prefix: '' },
            _hasBindingTarget: function () {
                return !!this.element[0].kendoBindingTarget;
            },
            _tabindex: function (target) {
                target = target || this.wrapper;
                var element = this.element, TABINDEX = 'tabindex', tabindex = target.attr(TABINDEX) || element.attr(TABINDEX);
                element.removeAttr(TABINDEX);
                target.attr(TABINDEX, !isNaN(tabindex) ? tabindex : 0);
            },
            setOptions: function (options) {
                this._setEvents(options);
                $.extend(this.options, options);
            },
            _setEvents: function (options) {
                var that = this, idx = 0, length = that.events.length, e;
                for (; idx < length; idx++) {
                    e = that.events[idx];
                    if (that.options[e] && options[e]) {
                        that.unbind(e, that.options[e]);
                    }
                }
                that.bind(that.events, options);
            },
            resize: function (force) {
                var size = this.getSize(), currentSize = this._size;
                if (force || (size.width > 0 || size.height > 0) && (!currentSize || size.width !== currentSize.width || size.height !== currentSize.height)) {
                    this._size = size;
                    this._resize(size, force);
                    this.trigger('resize', size);
                }
            },
            getSize: function () {
                return kendo.dimensions(this.element);
            },
            size: function (size) {
                if (!size) {
                    return this.getSize();
                } else {
                    this.setSize(size);
                }
            },
            setSize: $.noop,
            _resize: $.noop,
            destroy: function () {
                var that = this;
                that.element.removeData('kendo' + that.options.prefix + that.options.name);
                that.element.removeData('handler');
                that.unbind();
            },
            _destroy: function () {
                this.destroy();
            },
            angular: function () {
            },
            _muteAngularRebind: function (callback) {
                this._muteRebind = true;
                callback.call(this);
                this._muteRebind = false;
            }
        });
        var DataBoundWidget = Widget.extend({
            dataItems: function () {
                return this.dataSource.flatView();
            },
            _angularItems: function (cmd) {
                var that = this;
                that.angular(cmd, function () {
                    return {
                        elements: that.items(),
                        data: $.map(that.dataItems(), function (dataItem) {
                            return { dataItem: dataItem };
                        })
                    };
                });
            }
        });
        kendo.dimensions = function (element, dimensions) {
            var domElement = element[0];
            if (dimensions) {
                element.css(dimensions);
            }
            return {
                width: domElement.offsetWidth,
                height: domElement.offsetHeight
            };
        };
        kendo.notify = noop;
        var templateRegExp = /template$/i, jsonRegExp = /^\s*(?:\{(?:.|\r\n|\n)*\}|\[(?:.|\r\n|\n)*\])\s*$/, jsonFormatRegExp = /^\{(\d+)(:[^\}]+)?\}|^\[[A-Za-z_]*\]$/, dashRegExp = /([A-Z])/g;
        function parseOption(element, option) {
            var value;
            if (option.indexOf('data') === 0) {
                option = option.substring(4);
                option = option.charAt(0).toLowerCase() + option.substring(1);
            }
            option = option.replace(dashRegExp, '-$1');
            value = element.getAttribute('data-' + kendo.ns + option);
            if (value === null) {
                value = undefined;
            } else if (value === 'null') {
                value = null;
            } else if (value === 'true') {
                value = true;
            } else if (value === 'false') {
                value = false;
            } else if (numberRegExp.test(value)) {
                value = parseFloat(value);
            } else if (jsonRegExp.test(value) && !jsonFormatRegExp.test(value)) {
                value = new Function('return (' + value + ')')();
            }
            return value;
        }
        function parseOptions(element, options) {
            var result = {}, option, value;
            for (option in options) {
                value = parseOption(element, option);
                if (value !== undefined) {
                    if (templateRegExp.test(option)) {
                        value = kendo.template($('#' + value).html());
                    }
                    result[option] = value;
                }
            }
            return result;
        }
        kendo.initWidget = function (element, options, roles) {
            var result, option, widget, idx, length, role, value, dataSource, fullPath, widgetKeyRegExp;
            if (!roles) {
                roles = kendo.ui.roles;
            } else if (roles.roles) {
                roles = roles.roles;
            }
            element = element.nodeType ? element : element[0];
            role = element.getAttribute('data-' + kendo.ns + 'role');
            if (!role) {
                return;
            }
            fullPath = role.indexOf('.') === -1;
            if (fullPath) {
                widget = roles[role];
            } else {
                widget = kendo.getter(role)(window);
            }
            var data = $(element).data(), widgetKey = widget ? 'kendo' + widget.fn.options.prefix + widget.fn.options.name : '';
            if (fullPath) {
                widgetKeyRegExp = new RegExp('^kendo.*' + role + '$', 'i');
            } else {
                widgetKeyRegExp = new RegExp('^' + widgetKey + '$', 'i');
            }
            for (var key in data) {
                if (key.match(widgetKeyRegExp)) {
                    if (key === widgetKey) {
                        result = data[key];
                    } else {
                        return data[key];
                    }
                }
            }
            if (!widget) {
                return;
            }
            dataSource = parseOption(element, 'dataSource');
            options = $.extend({}, parseOptions(element, widget.fn.options), options);
            if (dataSource) {
                if (typeof dataSource === STRING) {
                    options.dataSource = kendo.getter(dataSource)(window);
                } else {
                    options.dataSource = dataSource;
                }
            }
            for (idx = 0, length = widget.fn.events.length; idx < length; idx++) {
                option = widget.fn.events[idx];
                value = parseOption(element, option);
                if (value !== undefined) {
                    options[option] = kendo.getter(value)(window);
                }
            }
            if (!result) {
                result = new widget(element, options);
            } else if (!$.isEmptyObject(options)) {
                result.setOptions(options);
            }
            return result;
        };
        kendo.rolesFromNamespaces = function (namespaces) {
            var roles = [], idx, length;
            if (!namespaces[0]) {
                namespaces = [
                    kendo.ui,
                    kendo.dataviz.ui
                ];
            }
            for (idx = 0, length = namespaces.length; idx < length; idx++) {
                roles[idx] = namespaces[idx].roles;
            }
            return extend.apply(null, [{}].concat(roles.reverse()));
        };
        kendo.init = function (element) {
            var roles = kendo.rolesFromNamespaces(slice.call(arguments, 1));
            $(element).find('[data-' + kendo.ns + 'role]').addBack().each(function () {
                kendo.initWidget(this, {}, roles);
            });
        };
        kendo.destroy = function (element) {
            $(element).find('[data-' + kendo.ns + 'role]').addBack().each(function () {
                var data = $(this).data();
                for (var key in data) {
                    if (key.indexOf('kendo') === 0 && typeof data[key].destroy === FUNCTION) {
                        data[key].destroy();
                    }
                }
            });
        };
        function containmentComparer(a, b) {
            return $.contains(a, b) ? -1 : 1;
        }
        function resizableWidget() {
            var widget = $(this);
            return $.inArray(widget.attr('data-' + kendo.ns + 'role'), [
                'slider',
                'rangeslider'
            ]) > -1 || widget.is(':visible');
        }
        kendo.resize = function (element, force) {
            var widgets = $(element).find('[data-' + kendo.ns + 'role]').addBack().filter(resizableWidget);
            if (!widgets.length) {
                return;
            }
            var widgetsArray = $.makeArray(widgets);
            widgetsArray.sort(containmentComparer);
            $.each(widgetsArray, function () {
                var widget = kendo.widgetInstance($(this));
                if (widget) {
                    widget.resize(force);
                }
            });
        };
        kendo.parseOptions = parseOptions;
        extend(kendo.ui, {
            Widget: Widget,
            DataBoundWidget: DataBoundWidget,
            roles: {},
            progress: function (container, toggle) {
                var mask = container.find('.k-loading-mask'), support = kendo.support, browser = support.browser, isRtl, leftRight, webkitCorrection, containerScrollLeft;
                if (toggle) {
                    if (!mask.length) {
                        isRtl = support.isRtl(container);
                        leftRight = isRtl ? 'right' : 'left';
                        containerScrollLeft = container.scrollLeft();
                        webkitCorrection = browser.webkit ? !isRtl ? 0 : container[0].scrollWidth - container.width() - 2 * containerScrollLeft : 0;
                        mask = $('<div class=\'k-loading-mask\'><span class=\'k-loading-text\'>' + kendo.ui.progress.messages.loading + '</span><div class=\'k-loading-image\'/><div class=\'k-loading-color\'/></div>').width('100%').height('100%').css('top', container.scrollTop()).css(leftRight, Math.abs(containerScrollLeft) + webkitCorrection).prependTo(container);
                    }
                } else if (mask) {
                    mask.remove();
                }
            },
            plugin: function (widget, register, prefix) {
                var name = widget.fn.options.name, getter;
                register = register || kendo.ui;
                prefix = prefix || '';
                register[name] = widget;
                register.roles[name.toLowerCase()] = widget;
                getter = 'getKendo' + prefix + name;
                name = 'kendo' + prefix + name;
                var widgetEntry = {
                    name: name,
                    widget: widget,
                    prefix: prefix || ''
                };
                kendo.widgets.push(widgetEntry);
                for (var i = 0, len = kendo._widgetRegisteredCallbacks.length; i < len; i++) {
                    kendo._widgetRegisteredCallbacks[i](widgetEntry);
                }
                $.fn[name] = function (options) {
                    var value = this, args;
                    if (typeof options === STRING) {
                        args = slice.call(arguments, 1);
                        this.each(function () {
                            var widget = $.data(this, name), method, result;
                            if (!widget) {
                                throw new Error(kendo.format('Cannot call method \'{0}\' of {1} before it is initialized', options, name));
                            }
                            method = widget[options];
                            if (typeof method !== FUNCTION) {
                                throw new Error(kendo.format('Cannot find method \'{0}\' of {1}', options, name));
                            }
                            result = method.apply(widget, args);
                            if (result !== undefined) {
                                value = result;
                                return false;
                            }
                        });
                    } else {
                        this.each(function () {
                            return new widget(this, options);
                        });
                    }
                    return value;
                };
                $.fn[name].widget = widget;
                $.fn[getter] = function () {
                    return this.data(name);
                };
            }
        });
        kendo.ui.progress.messages = { loading: 'Loading...' };
        var ContainerNullObject = {
            bind: function () {
                return this;
            },
            nullObject: true,
            options: {}
        };
        var MobileWidget = Widget.extend({
            init: function (element, options) {
                Widget.fn.init.call(this, element, options);
                this.element.autoApplyNS();
                this.wrapper = this.element;
                this.element.addClass('km-widget');
            },
            destroy: function () {
                Widget.fn.destroy.call(this);
                this.element.kendoDestroy();
            },
            options: { prefix: 'Mobile' },
            events: [],
            view: function () {
                var viewElement = this.element.closest(kendo.roleSelector('view splitview modalview drawer'));
                return kendo.widgetInstance(viewElement, kendo.mobile.ui) || ContainerNullObject;
            },
            viewHasNativeScrolling: function () {
                var view = this.view();
                return view && view.options.useNativeScrolling;
            },
            container: function () {
                var element = this.element.closest(kendo.roleSelector('view layout modalview drawer splitview'));
                return kendo.widgetInstance(element.eq(0), kendo.mobile.ui) || ContainerNullObject;
            }
        });
        extend(kendo.mobile, {
            init: function (element) {
                kendo.init(element, kendo.mobile.ui, kendo.ui, kendo.dataviz.ui);
            },
            appLevelNativeScrolling: function () {
                return kendo.mobile.application && kendo.mobile.application.options && kendo.mobile.application.options.useNativeScrolling;
            },
            roles: {},
            ui: {
                Widget: MobileWidget,
                DataBoundWidget: DataBoundWidget.extend(MobileWidget.prototype),
                roles: {},
                plugin: function (widget) {
                    kendo.ui.plugin(widget, kendo.mobile.ui, 'Mobile');
                }
            }
        });
        deepExtend(kendo.dataviz, {
            init: function (element) {
                kendo.init(element, kendo.dataviz.ui);
            },
            ui: {
                roles: {},
                themes: {},
                views: [],
                plugin: function (widget) {
                    kendo.ui.plugin(widget, kendo.dataviz.ui);
                }
            },
            roles: {}
        });
        kendo.touchScroller = function (elements, options) {
            if (!options) {
                options = {};
            }
            options.useNative = true;
            return $(elements).map(function (idx, element) {
                element = $(element);
                if (support.kineticScrollNeeded && kendo.mobile.ui.Scroller && !element.data('kendoMobileScroller')) {
                    element.kendoMobileScroller(options);
                    return element.data('kendoMobileScroller');
                } else {
                    return false;
                }
            })[0];
        };
        kendo.preventDefault = function (e) {
            e.preventDefault();
        };
        kendo.widgetInstance = function (element, suites) {
            var role = element.data(kendo.ns + 'role'), widgets = [], i, length;
            if (role) {
                if (role === 'content') {
                    role = 'scroller';
                }
                if (suites) {
                    if (suites[0]) {
                        for (i = 0, length = suites.length; i < length; i++) {
                            widgets.push(suites[i].roles[role]);
                        }
                    } else {
                        widgets.push(suites.roles[role]);
                    }
                } else {
                    widgets = [
                        kendo.ui.roles[role],
                        kendo.dataviz.ui.roles[role],
                        kendo.mobile.ui.roles[role]
                    ];
                }
                if (role.indexOf('.') >= 0) {
                    widgets = [kendo.getter(role)(window)];
                }
                for (i = 0, length = widgets.length; i < length; i++) {
                    var widget = widgets[i];
                    if (widget) {
                        var instance = element.data('kendo' + widget.fn.options.prefix + widget.fn.options.name);
                        if (instance) {
                            return instance;
                        }
                    }
                }
            }
        };
        kendo.onResize = function (callback) {
            var handler = callback;
            if (support.mobileOS.android) {
                handler = function () {
                    setTimeout(callback, 600);
                };
            }
            $(window).on(support.resize, handler);
            return handler;
        };
        kendo.unbindResize = function (callback) {
            $(window).off(support.resize, callback);
        };
        kendo.attrValue = function (element, key) {
            return element.data(kendo.ns + key);
        };
        kendo.days = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6
        };
        function focusable(element, isTabIndexNotNaN) {
            var nodeName = element.nodeName.toLowerCase();
            return (/input|select|textarea|button|object/.test(nodeName) ? !element.disabled : 'a' === nodeName ? element.href || isTabIndexNotNaN : isTabIndexNotNaN) && visible(element);
        }
        function visible(element) {
            return $.expr.filters.visible(element) && !$(element).parents().addBack().filter(function () {
                return $.css(this, 'visibility') === 'hidden';
            }).length;
        }
        $.extend($.expr[':'], {
            kendoFocusable: function (element) {
                var idx = $.attr(element, 'tabindex');
                return focusable(element, !isNaN(idx) && idx > -1);
            }
        });
        var MOUSE_EVENTS = [
            'mousedown',
            'mousemove',
            'mouseenter',
            'mouseleave',
            'mouseover',
            'mouseout',
            'mouseup',
            'click'
        ];
        var EXCLUDE_BUST_CLICK_SELECTOR = 'label, input, [data-rel=external]';
        var MouseEventNormalizer = {
            setupMouseMute: function () {
                var idx = 0, length = MOUSE_EVENTS.length, element = document.documentElement;
                if (MouseEventNormalizer.mouseTrap || !support.eventCapture) {
                    return;
                }
                MouseEventNormalizer.mouseTrap = true;
                MouseEventNormalizer.bustClick = false;
                MouseEventNormalizer.captureMouse = false;
                var handler = function (e) {
                    if (MouseEventNormalizer.captureMouse) {
                        if (e.type === 'click') {
                            if (MouseEventNormalizer.bustClick && !$(e.target).is(EXCLUDE_BUST_CLICK_SELECTOR)) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        } else {
                            e.stopPropagation();
                        }
                    }
                };
                for (; idx < length; idx++) {
                    element.addEventListener(MOUSE_EVENTS[idx], handler, true);
                }
            },
            muteMouse: function (e) {
                MouseEventNormalizer.captureMouse = true;
                if (e.data.bustClick) {
                    MouseEventNormalizer.bustClick = true;
                }
                clearTimeout(MouseEventNormalizer.mouseTrapTimeoutID);
            },
            unMuteMouse: function () {
                clearTimeout(MouseEventNormalizer.mouseTrapTimeoutID);
                MouseEventNormalizer.mouseTrapTimeoutID = setTimeout(function () {
                    MouseEventNormalizer.captureMouse = false;
                    MouseEventNormalizer.bustClick = false;
                }, 400);
            }
        };
        var eventMap = {
            down: 'touchstart mousedown',
            move: 'mousemove touchmove',
            up: 'mouseup touchend touchcancel',
            cancel: 'mouseleave touchcancel'
        };
        if (support.touch && (support.mobileOS.ios || support.mobileOS.android)) {
            eventMap = {
                down: 'touchstart',
                move: 'touchmove',
                up: 'touchend touchcancel',
                cancel: 'touchcancel'
            };
        } else if (support.pointers) {
            eventMap = {
                down: 'pointerdown',
                move: 'pointermove',
                up: 'pointerup',
                cancel: 'pointercancel pointerleave'
            };
        } else if (support.msPointers) {
            eventMap = {
                down: 'MSPointerDown',
                move: 'MSPointerMove',
                up: 'MSPointerUp',
                cancel: 'MSPointerCancel MSPointerLeave'
            };
        }
        if (support.msPointers && !('onmspointerenter' in window)) {
            $.each({
                MSPointerEnter: 'MSPointerOver',
                MSPointerLeave: 'MSPointerOut'
            }, function (orig, fix) {
                $.event.special[orig] = {
                    delegateType: fix,
                    bindType: fix,
                    handle: function (event) {
                        var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
                        if (!related || related !== target && !$.contains(target, related)) {
                            event.type = handleObj.origType;
                            ret = handleObj.handler.apply(this, arguments);
                            event.type = fix;
                        }
                        return ret;
                    }
                };
            });
        }
        var getEventMap = function (e) {
                return eventMap[e] || e;
            }, eventRegEx = /([^ ]+)/g;
        kendo.applyEventMap = function (events, ns) {
            events = events.replace(eventRegEx, getEventMap);
            if (ns) {
                events = events.replace(eventRegEx, '$1.' + ns);
            }
            return events;
        };
        var on = $.fn.on;
        function kendoJQuery(selector, context) {
            return new kendoJQuery.fn.init(selector, context);
        }
        extend(true, kendoJQuery, $);
        kendoJQuery.fn = kendoJQuery.prototype = new $();
        kendoJQuery.fn.constructor = kendoJQuery;
        kendoJQuery.fn.init = function (selector, context) {
            if (context && context instanceof $ && !(context instanceof kendoJQuery)) {
                context = kendoJQuery(context);
            }
            return $.fn.init.call(this, selector, context, rootjQuery);
        };
        kendoJQuery.fn.init.prototype = kendoJQuery.fn;
        var rootjQuery = kendoJQuery(document);
        extend(kendoJQuery.fn, {
            handler: function (handler) {
                this.data('handler', handler);
                return this;
            },
            autoApplyNS: function (ns) {
                this.data('kendoNS', ns || kendo.guid());
                return this;
            },
            on: function () {
                var that = this, ns = that.data('kendoNS');
                if (arguments.length === 1) {
                    return on.call(that, arguments[0]);
                }
                var context = that, args = slice.call(arguments);
                if (typeof args[args.length - 1] === UNDEFINED) {
                    args.pop();
                }
                var callback = args[args.length - 1], events = kendo.applyEventMap(args[0], ns);
                if (support.mouseAndTouchPresent && events.search(/mouse|click/) > -1 && this[0] !== document.documentElement) {
                    MouseEventNormalizer.setupMouseMute();
                    var selector = args.length === 2 ? null : args[1], bustClick = events.indexOf('click') > -1 && events.indexOf('touchend') > -1;
                    on.call(this, {
                        touchstart: MouseEventNormalizer.muteMouse,
                        touchend: MouseEventNormalizer.unMuteMouse
                    }, selector, { bustClick: bustClick });
                }
                if (typeof callback === STRING) {
                    context = that.data('handler');
                    callback = context[callback];
                    args[args.length - 1] = function (e) {
                        callback.call(context, e);
                    };
                }
                args[0] = events;
                on.apply(that, args);
                return that;
            },
            kendoDestroy: function (ns) {
                ns = ns || this.data('kendoNS');
                if (ns) {
                    this.off('.' + ns);
                }
                return this;
            }
        });
        kendo.jQuery = kendoJQuery;
        kendo.eventMap = eventMap;
        kendo.timezone = function () {
            var months = {
                Jan: 0,
                Feb: 1,
                Mar: 2,
                Apr: 3,
                May: 4,
                Jun: 5,
                Jul: 6,
                Aug: 7,
                Sep: 8,
                Oct: 9,
                Nov: 10,
                Dec: 11
            };
            var days = {
                Sun: 0,
                Mon: 1,
                Tue: 2,
                Wed: 3,
                Thu: 4,
                Fri: 5,
                Sat: 6
            };
            function ruleToDate(year, rule) {
                var date;
                var targetDay;
                var ourDay;
                var month = rule[3];
                var on = rule[4];
                var time = rule[5];
                var cache = rule[8];
                if (!cache) {
                    rule[8] = cache = {};
                }
                if (cache[year]) {
                    return cache[year];
                }
                if (!isNaN(on)) {
                    date = new Date(Date.UTC(year, months[month], on, time[0], time[1], time[2], 0));
                } else if (on.indexOf('last') === 0) {
                    date = new Date(Date.UTC(year, months[month] + 1, 1, time[0] - 24, time[1], time[2], 0));
                    targetDay = days[on.substr(4, 3)];
                    ourDay = date.getUTCDay();
                    date.setUTCDate(date.getUTCDate() + targetDay - ourDay - (targetDay > ourDay ? 7 : 0));
                } else if (on.indexOf('>=') >= 0) {
                    date = new Date(Date.UTC(year, months[month], on.substr(5), time[0], time[1], time[2], 0));
                    targetDay = days[on.substr(0, 3)];
                    ourDay = date.getUTCDay();
                    date.setUTCDate(date.getUTCDate() + targetDay - ourDay + (targetDay < ourDay ? 7 : 0));
                }
                return cache[year] = date;
            }
            function findRule(utcTime, rules, zone) {
                rules = rules[zone];
                if (!rules) {
                    var time = zone.split(':');
                    var offset = 0;
                    if (time.length > 1) {
                        offset = time[0] * 60 + Number(time[1]);
                    }
                    return [
                        -1000000,
                        'max',
                        '-',
                        'Jan',
                        1,
                        [
                            0,
                            0,
                            0
                        ],
                        offset,
                        '-'
                    ];
                }
                var year = new Date(utcTime).getUTCFullYear();
                rules = jQuery.grep(rules, function (rule) {
                    var from = rule[0];
                    var to = rule[1];
                    return from <= year && (to >= year || from == year && to == 'only' || to == 'max');
                });
                rules.push(utcTime);
                rules.sort(function (a, b) {
                    if (typeof a != 'number') {
                        a = Number(ruleToDate(year, a));
                    }
                    if (typeof b != 'number') {
                        b = Number(ruleToDate(year, b));
                    }
                    return a - b;
                });
                var rule = rules[jQuery.inArray(utcTime, rules) - 1] || rules[rules.length - 1];
                return isNaN(rule) ? rule : null;
            }
            function findZone(utcTime, zones, timezone) {
                var zoneRules = zones[timezone];
                if (typeof zoneRules === 'string') {
                    zoneRules = zones[zoneRules];
                }
                if (!zoneRules) {
                    throw new Error('Timezone "' + timezone + '" is either incorrect, or kendo.timezones.min.js is not included.');
                }
                for (var idx = zoneRules.length - 1; idx >= 0; idx--) {
                    var until = zoneRules[idx][3];
                    if (until && utcTime > until) {
                        break;
                    }
                }
                var zone = zoneRules[idx + 1];
                if (!zone) {
                    throw new Error('Timezone "' + timezone + '" not found on ' + utcTime + '.');
                }
                return zone;
            }
            function zoneAndRule(utcTime, zones, rules, timezone) {
                if (typeof utcTime != NUMBER) {
                    utcTime = Date.UTC(utcTime.getFullYear(), utcTime.getMonth(), utcTime.getDate(), utcTime.getHours(), utcTime.getMinutes(), utcTime.getSeconds(), utcTime.getMilliseconds());
                }
                var zone = findZone(utcTime, zones, timezone);
                return {
                    zone: zone,
                    rule: findRule(utcTime, rules, zone[1])
                };
            }
            function offset(utcTime, timezone) {
                if (timezone == 'Etc/UTC' || timezone == 'Etc/GMT') {
                    return 0;
                }
                var info = zoneAndRule(utcTime, this.zones, this.rules, timezone);
                var zone = info.zone;
                var rule = info.rule;
                return kendo.parseFloat(rule ? zone[0] - rule[6] : zone[0]);
            }
            function abbr(utcTime, timezone) {
                var info = zoneAndRule(utcTime, this.zones, this.rules, timezone);
                var zone = info.zone;
                var rule = info.rule;
                var base = zone[2];
                if (base.indexOf('/') >= 0) {
                    return base.split('/')[rule && +rule[6] ? 1 : 0];
                } else if (base.indexOf('%s') >= 0) {
                    return base.replace('%s', !rule || rule[7] == '-' ? '' : rule[7]);
                }
                return base;
            }
            function convert(date, fromOffset, toOffset) {
                if (typeof fromOffset == STRING) {
                    fromOffset = this.offset(date, fromOffset);
                }
                if (typeof toOffset == STRING) {
                    toOffset = this.offset(date, toOffset);
                }
                var fromLocalOffset = date.getTimezoneOffset();
                date = new Date(date.getTime() + (fromOffset - toOffset) * 60000);
                var toLocalOffset = date.getTimezoneOffset();
                return new Date(date.getTime() + (toLocalOffset - fromLocalOffset) * 60000);
            }
            function apply(date, timezone) {
                return this.convert(date, date.getTimezoneOffset(), timezone);
            }
            function remove(date, timezone) {
                return this.convert(date, timezone, date.getTimezoneOffset());
            }
            function toLocalDate(time) {
                return this.apply(new Date(time), 'Etc/UTC');
            }
            return {
                zones: {},
                rules: {},
                offset: offset,
                convert: convert,
                apply: apply,
                remove: remove,
                abbr: abbr,
                toLocalDate: toLocalDate
            };
        }();
        kendo.date = function () {
            var MS_PER_MINUTE = 60000, MS_PER_DAY = 86400000;
            function adjustDST(date, hours) {
                if (hours === 0 && date.getHours() === 23) {
                    date.setHours(date.getHours() + 2);
                    return true;
                }
                return false;
            }
            function setDayOfWeek(date, day, dir) {
                var hours = date.getHours();
                dir = dir || 1;
                day = (day - date.getDay() + 7 * dir) % 7;
                date.setDate(date.getDate() + day);
                adjustDST(date, hours);
            }
            function dayOfWeek(date, day, dir) {
                date = new Date(date);
                setDayOfWeek(date, day, dir);
                return date;
            }
            function firstDayOfMonth(date) {
                return new Date(date.getFullYear(), date.getMonth(), 1);
            }
            function lastDayOfMonth(date) {
                var last = new Date(date.getFullYear(), date.getMonth() + 1, 0), first = firstDayOfMonth(date), timeOffset = Math.abs(last.getTimezoneOffset() - first.getTimezoneOffset());
                if (timeOffset) {
                    last.setHours(first.getHours() + timeOffset / 60);
                }
                return last;
            }
            function getDate(date) {
                date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
                adjustDST(date, 0);
                return date;
            }
            function toUtcTime(date) {
                return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
            }
            function getMilliseconds(date) {
                return date.getTime() - getDate(date);
            }
            function isInTimeRange(value, min, max) {
                var msMin = getMilliseconds(min), msMax = getMilliseconds(max), msValue;
                if (!value || msMin == msMax) {
                    return true;
                }
                if (min >= max) {
                    max += MS_PER_DAY;
                }
                msValue = getMilliseconds(value);
                if (msMin > msValue) {
                    msValue += MS_PER_DAY;
                }
                if (msMax < msMin) {
                    msMax += MS_PER_DAY;
                }
                return msValue >= msMin && msValue <= msMax;
            }
            function isInDateRange(value, min, max) {
                var msMin = min.getTime(), msMax = max.getTime(), msValue;
                if (msMin >= msMax) {
                    msMax += MS_PER_DAY;
                }
                msValue = value.getTime();
                return msValue >= msMin && msValue <= msMax;
            }
            function addDays(date, offset) {
                var hours = date.getHours();
                date = new Date(date);
                setTime(date, offset * MS_PER_DAY);
                adjustDST(date, hours);
                return date;
            }
            function setTime(date, milliseconds, ignoreDST) {
                var offset = date.getTimezoneOffset();
                var difference;
                date.setTime(date.getTime() + milliseconds);
                if (!ignoreDST) {
                    difference = date.getTimezoneOffset() - offset;
                    date.setTime(date.getTime() + difference * MS_PER_MINUTE);
                }
            }
            function setHours(date, time) {
                date = new Date(kendo.date.getDate(date).getTime() + kendo.date.getMilliseconds(time));
                adjustDST(date, time.getHours());
                return date;
            }
            function today() {
                return getDate(new Date());
            }
            function isToday(date) {
                return getDate(date).getTime() == today().getTime();
            }
            function toInvariantTime(date) {
                var staticDate = new Date(1980, 1, 1, 0, 0, 0);
                if (date) {
                    staticDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
                }
                return staticDate;
            }
            return {
                adjustDST: adjustDST,
                dayOfWeek: dayOfWeek,
                setDayOfWeek: setDayOfWeek,
                getDate: getDate,
                isInDateRange: isInDateRange,
                isInTimeRange: isInTimeRange,
                isToday: isToday,
                nextDay: function (date) {
                    return addDays(date, 1);
                },
                previousDay: function (date) {
                    return addDays(date, -1);
                },
                toUtcTime: toUtcTime,
                MS_PER_DAY: MS_PER_DAY,
                MS_PER_HOUR: 60 * MS_PER_MINUTE,
                MS_PER_MINUTE: MS_PER_MINUTE,
                setTime: setTime,
                setHours: setHours,
                addDays: addDays,
                today: today,
                toInvariantTime: toInvariantTime,
                firstDayOfMonth: firstDayOfMonth,
                lastDayOfMonth: lastDayOfMonth,
                getMilliseconds: getMilliseconds
            };
        }();
        kendo.stripWhitespace = function (element) {
            if (document.createNodeIterator) {
                var iterator = document.createNodeIterator(element, NodeFilter.SHOW_TEXT, function (node) {
                    return node.parentNode == element ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }, false);
                while (iterator.nextNode()) {
                    if (iterator.referenceNode && !iterator.referenceNode.textContent.trim()) {
                        iterator.referenceNode.parentNode.removeChild(iterator.referenceNode);
                    }
                }
            } else {
                for (var i = 0; i < element.childNodes.length; i++) {
                    var child = element.childNodes[i];
                    if (child.nodeType == 3 && !/\S/.test(child.nodeValue)) {
                        element.removeChild(child);
                        i--;
                    }
                    if (child.nodeType == 1) {
                        kendo.stripWhitespace(child);
                    }
                }
            }
        };
        var animationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
            setTimeout(callback, 1000 / 60);
        };
        kendo.animationFrame = function (callback) {
            animationFrame.call(window, callback);
        };
        var animationQueue = [];
        kendo.queueAnimation = function (callback) {
            animationQueue[animationQueue.length] = callback;
            if (animationQueue.length === 1) {
                kendo.runNextAnimation();
            }
        };
        kendo.runNextAnimation = function () {
            kendo.animationFrame(function () {
                if (animationQueue[0]) {
                    animationQueue.shift()();
                    if (animationQueue[0]) {
                        kendo.runNextAnimation();
                    }
                }
            });
        };
        kendo.parseQueryStringParams = function (url) {
            var queryString = url.split('?')[1] || '', params = {}, paramParts = queryString.split(/&|=/), length = paramParts.length, idx = 0;
            for (; idx < length; idx += 2) {
                if (paramParts[idx] !== '') {
                    params[decodeURIComponent(paramParts[idx])] = decodeURIComponent(paramParts[idx + 1]);
                }
            }
            return params;
        };
        kendo.elementUnderCursor = function (e) {
            if (typeof e.x.client != 'undefined') {
                return document.elementFromPoint(e.x.client, e.y.client);
            }
        };
        kendo.wheelDeltaY = function (jQueryEvent) {
            var e = jQueryEvent.originalEvent, deltaY = e.wheelDeltaY, delta;
            if (e.wheelDelta) {
                if (deltaY === undefined || deltaY) {
                    delta = e.wheelDelta;
                }
            } else if (e.detail && e.axis === e.VERTICAL_AXIS) {
                delta = -e.detail * 10;
            }
            return delta;
        };
        kendo.throttle = function (fn, delay) {
            var timeout;
            var lastExecTime = 0;
            if (!delay || delay <= 0) {
                return fn;
            }
            var throttled = function () {
                var that = this;
                var elapsed = +new Date() - lastExecTime;
                var args = arguments;
                function exec() {
                    fn.apply(that, args);
                    lastExecTime = +new Date();
                }
                if (!lastExecTime) {
                    return exec();
                }
                if (timeout) {
                    clearTimeout(timeout);
                }
                if (elapsed > delay) {
                    exec();
                } else {
                    timeout = setTimeout(exec, delay - elapsed);
                }
            };
            throttled.cancel = function () {
                clearTimeout(timeout);
            };
            return throttled;
        };
        kendo.caret = function (element, start, end) {
            var rangeElement;
            var isPosition = start !== undefined;
            if (end === undefined) {
                end = start;
            }
            if (element[0]) {
                element = element[0];
            }
            if (isPosition && element.disabled) {
                return;
            }
            try {
                if (element.selectionStart !== undefined) {
                    if (isPosition) {
                        element.focus();
                        element.setSelectionRange(start, end);
                    } else {
                        start = [
                            element.selectionStart,
                            element.selectionEnd
                        ];
                    }
                } else if (document.selection) {
                    if ($(element).is(':visible')) {
                        element.focus();
                    }
                    rangeElement = element.createTextRange();
                    if (isPosition) {
                        rangeElement.collapse(true);
                        rangeElement.moveStart('character', start);
                        rangeElement.moveEnd('character', end - start);
                        rangeElement.select();
                    } else {
                        var rangeDuplicated = rangeElement.duplicate(), selectionStart, selectionEnd;
                        rangeElement.moveToBookmark(document.selection.createRange().getBookmark());
                        rangeDuplicated.setEndPoint('EndToStart', rangeElement);
                        selectionStart = rangeDuplicated.text.length;
                        selectionEnd = selectionStart + rangeElement.text.length;
                        start = [
                            selectionStart,
                            selectionEnd
                        ];
                    }
                }
            } catch (e) {
                start = [];
            }
            return start;
        };
        kendo.compileMobileDirective = function (element, scope) {
            var angular = window.angular;
            element.attr('data-' + kendo.ns + 'role', element[0].tagName.toLowerCase().replace('kendo-mobile-', '').replace('-', ''));
            angular.element(element).injector().invoke([
                '$compile',
                function ($compile) {
                    $compile(element)(scope);
                    if (!/^\$(digest|apply)$/.test(scope.$$phase)) {
                        scope.$digest();
                    }
                }
            ]);
            return kendo.widgetInstance(element, kendo.mobile.ui);
        };
        kendo.antiForgeryTokens = function () {
            var tokens = {}, csrf_token = $('meta[name=csrf-token],meta[name=_csrf]').attr('content'), csrf_param = $('meta[name=csrf-param],meta[name=_csrf_header]').attr('content');
            $('input[name^=\'__RequestVerificationToken\']').each(function () {
                tokens[this.name] = this.value;
            });
            if (csrf_param !== undefined && csrf_token !== undefined) {
                tokens[csrf_param] = csrf_token;
            }
            return tokens;
        };
        kendo.cycleForm = function (form) {
            var firstElement = form.find('input, .k-widget').first();
            var lastElement = form.find('button, .k-button').last();
            function focus(el) {
                var widget = kendo.widgetInstance(el);
                if (widget && widget.focus) {
                    widget.focus();
                } else {
                    el.focus();
                }
            }
            lastElement.on('keydown', function (e) {
                if (e.keyCode == kendo.keys.TAB && !e.shiftKey) {
                    e.preventDefault();
                    focus(firstElement);
                }
            });
            firstElement.on('keydown', function (e) {
                if (e.keyCode == kendo.keys.TAB && e.shiftKey) {
                    e.preventDefault();
                    focus(lastElement);
                }
            });
        };
        (function () {
            function postToProxy(dataURI, fileName, proxyURL, proxyTarget) {
                var form = $('<form>').attr({
                    action: proxyURL,
                    method: 'POST',
                    target: proxyTarget
                });
                var data = kendo.antiForgeryTokens();
                data.fileName = fileName;
                var parts = dataURI.split(';base64,');
                data.contentType = parts[0].replace('data:', '');
                data.base64 = parts[1];
                for (var name in data) {
                    if (data.hasOwnProperty(name)) {
                        $('<input>').attr({
                            value: data[name],
                            name: name,
                            type: 'hidden'
                        }).appendTo(form);
                    }
                }
                form.appendTo('body').submit().remove();
            }
            var fileSaver = document.createElement('a');
            var downloadAttribute = 'download' in fileSaver && !kendo.support.browser.edge;
            function saveAsBlob(dataURI, fileName) {
                var blob = dataURI;
                if (typeof dataURI == 'string') {
                    var parts = dataURI.split(';base64,');
                    var contentType = parts[0];
                    var base64 = atob(parts[1]);
                    var array = new Uint8Array(base64.length);
                    for (var idx = 0; idx < base64.length; idx++) {
                        array[idx] = base64.charCodeAt(idx);
                    }
                    blob = new Blob([array.buffer], { type: contentType });
                }
                navigator.msSaveBlob(blob, fileName);
            }
            function saveAsDataURI(dataURI, fileName) {
                if (window.Blob && dataURI instanceof Blob) {
                    dataURI = URL.createObjectURL(dataURI);
                }
                fileSaver.download = fileName;
                fileSaver.href = dataURI;
                var e = document.createEvent('MouseEvents');
                e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                fileSaver.dispatchEvent(e);
                setTimeout(function () {
                    URL.revokeObjectURL(dataURI);
                });
            }
            kendo.saveAs = function (options) {
                var save = postToProxy;
                if (!options.forceProxy) {
                    if (downloadAttribute) {
                        save = saveAsDataURI;
                    } else if (navigator.msSaveBlob) {
                        save = saveAsBlob;
                    }
                }
                save(options.dataURI, options.fileName, options.proxyURL, options.proxyTarget);
            };
        }());
        kendo.proxyModelSetters = function proxyModelSetters(data) {
            var observable = {};
            Object.keys(data || {}).forEach(function (property) {
                Object.defineProperty(observable, property, {
                    get: function () {
                        return data[property];
                    },
                    set: function (value) {
                        data[property] = value;
                        data.dirty = true;
                    }
                });
            });
            return observable;
        };
    }(jQuery, window));
    return window.kendo;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('kendo.calendar', ['kendo.core'], f);
}(function () {
    var __meta__ = {
        id: 'calendar',
        name: 'Calendar',
        category: 'web',
        description: 'The Calendar widget renders a graphical calendar that supports navigation and selection.',
        depends: ['core']
    };
    (function ($, undefined) {
        var kendo = window.kendo, support = kendo.support, ui = kendo.ui, Widget = ui.Widget, keys = kendo.keys, parse = kendo.parseDate, adjustDST = kendo.date.adjustDST, extractFormat = kendo._extractFormat, template = kendo.template, getCulture = kendo.getCulture, transitions = kendo.support.transitions, transitionOrigin = transitions ? transitions.css + 'transform-origin' : '', cellTemplate = template('<td#=data.cssClass# role="gridcell"><a tabindex="-1" class="k-link" href="\\#" data-#=data.ns#value="#=data.dateString#">#=data.value#</a></td>', { useWithBlock: false }), emptyCellTemplate = template('<td role="gridcell">&nbsp;</td>', { useWithBlock: false }), browser = kendo.support.browser, isIE8 = browser.msie && browser.version < 9, ns = '.kendoCalendar', CLICK = 'click' + ns, KEYDOWN_NS = 'keydown' + ns, ID = 'id', MIN = 'min', LEFT = 'left', SLIDE = 'slideIn', MONTH = 'month', CENTURY = 'century', CHANGE = 'change', NAVIGATE = 'navigate', VALUE = 'value', HOVER = 'k-state-hover', DISABLED = 'k-state-disabled', FOCUSED = 'k-state-focused', OTHERMONTH = 'k-other-month', OTHERMONTHCLASS = ' class="' + OTHERMONTH + '"', TODAY = 'k-nav-today', CELLSELECTOR = 'td:has(.k-link)', BLUR = 'blur' + ns, FOCUS = 'focus', FOCUS_WITH_NS = FOCUS + ns, MOUSEENTER = support.touch ? 'touchstart' : 'mouseenter', MOUSEENTER_WITH_NS = support.touch ? 'touchstart' + ns : 'mouseenter' + ns, MOUSELEAVE = support.touch ? 'touchend' + ns + ' touchmove' + ns : 'mouseleave' + ns, MS_PER_MINUTE = 60000, MS_PER_DAY = 86400000, PREVARROW = '_prevArrow', NEXTARROW = '_nextArrow', ARIA_DISABLED = 'aria-disabled', ARIA_SELECTED = 'aria-selected', proxy = $.proxy, extend = $.extend, DATE = Date, views = {
                month: 0,
                year: 1,
                decade: 2,
                century: 3
            };
        var Calendar = Widget.extend({
            init: function (element, options) {
                var that = this, value, id;
                Widget.fn.init.call(that, element, options);
                element = that.wrapper = that.element;
                options = that.options;
                options.url = window.unescape(options.url);
                that.options.disableDates = getDisabledExpr(that.options.disableDates);
                that._templates();
                that._header();
                that._footer(that.footer);
                id = element.addClass('k-widget k-calendar').on(MOUSEENTER_WITH_NS + ' ' + MOUSELEAVE, CELLSELECTOR, mousetoggle).on(KEYDOWN_NS, 'table.k-content', proxy(that._move, that)).on(CLICK, CELLSELECTOR, function (e) {
                    var link = e.currentTarget.firstChild, value = that._toDateObject(link);
                    if (link.href.indexOf('#') != -1) {
                        e.preventDefault();
                    }
                    if (that.options.disableDates(value) && that._view.name == 'month') {
                        return;
                    }
                    that._click($(link));
                }).on('mouseup' + ns, 'table.k-content, .k-footer', function () {
                    that._focusView(that.options.focusOnNav !== false);
                }).attr(ID);
                if (id) {
                    that._cellID = id + '_cell_selected';
                }
                normalize(options);
                value = parse(options.value, options.format, options.culture);
                that._index = views[options.start];
                that._current = new DATE(+restrictValue(value, options.min, options.max));
                that._addClassProxy = function () {
                    that._active = true;
                    if (that._cell.hasClass(DISABLED)) {
                        var todayString = that._view.toDateString(getToday());
                        that._cell = that._cellByDate(todayString);
                    }
                    that._cell.addClass(FOCUSED);
                };
                that._removeClassProxy = function () {
                    that._active = false;
                    that._cell.removeClass(FOCUSED);
                };
                that.value(value);
                kendo.notify(that);
            },
            options: {
                name: 'Calendar',
                value: null,
                min: new DATE(1900, 0, 1),
                max: new DATE(2099, 11, 31),
                dates: [],
                url: '',
                culture: '',
                footer: '',
                format: '',
                month: {},
                start: MONTH,
                depth: MONTH,
                animation: {
                    horizontal: {
                        effects: SLIDE,
                        reverse: true,
                        duration: 500,
                        divisor: 2
                    },
                    vertical: {
                        effects: 'zoomIn',
                        duration: 400
                    }
                }
            },
            events: [
                CHANGE,
                NAVIGATE
            ],
            setOptions: function (options) {
                var that = this;
                normalize(options);
                options.disableDates = getDisabledExpr(options.disableDates);
                Widget.fn.setOptions.call(that, options);
                that._templates();
                that._footer(that.footer);
                that._index = views[that.options.start];
                that.navigate();
            },
            destroy: function () {
                var that = this, today = that._today;
                that.element.off(ns);
                that._title.off(ns);
                that[PREVARROW].off(ns);
                that[NEXTARROW].off(ns);
                kendo.destroy(that._table);
                if (today) {
                    kendo.destroy(today.off(ns));
                }
                Widget.fn.destroy.call(that);
            },
            current: function () {
                return this._current;
            },
            view: function () {
                return this._view;
            },
            focus: function (table) {
                table = table || this._table;
                this._bindTable(table);
                table.focus();
            },
            min: function (value) {
                return this._option(MIN, value);
            },
            max: function (value) {
                return this._option('max', value);
            },
            navigateToPast: function () {
                this._navigate(PREVARROW, -1);
            },
            navigateToFuture: function () {
                this._navigate(NEXTARROW, 1);
            },
            navigateUp: function () {
                var that = this, index = that._index;
                if (that._title.hasClass(DISABLED)) {
                    return;
                }
                that.navigate(that._current, ++index);
            },
            navigateDown: function (value) {
                var that = this, index = that._index, depth = that.options.depth;
                if (!value) {
                    return;
                }
                if (index === views[depth]) {
                    if (!isEqualDate(that._value, that._current) || !isEqualDate(that._value, value)) {
                        that.value(value);
                        that.trigger(CHANGE);
                    }
                    return;
                }
                that.navigate(value, --index);
            },
            navigate: function (value, view) {
                view = isNaN(view) ? views[view] : view;
                var that = this, options = that.options, culture = options.culture, min = options.min, max = options.max, title = that._title, from = that._table, old = that._oldTable, selectedValue = that._value, currentValue = that._current, future = value && +value > +currentValue, vertical = view !== undefined && view !== that._index, to, currentView, compare, disabled;
                if (!value) {
                    value = currentValue;
                }
                that._current = value = new DATE(+restrictValue(value, min, max));
                if (view === undefined) {
                    view = that._index;
                } else {
                    that._index = view;
                }
                that._view = currentView = calendar.views[view];
                compare = currentView.compare;
                disabled = view === views[CENTURY];
                title.toggleClass(DISABLED, disabled).attr(ARIA_DISABLED, disabled);
                disabled = compare(value, min) < 1;
                that[PREVARROW].toggleClass(DISABLED, disabled).attr(ARIA_DISABLED, disabled);
                disabled = compare(value, max) > -1;
                that[NEXTARROW].toggleClass(DISABLED, disabled).attr(ARIA_DISABLED, disabled);
                if (from && old && old.data('animating')) {
                    old.kendoStop(true, true);
                    from.kendoStop(true, true);
                }
                that._oldTable = from;
                if (!from || that._changeView) {
                    title.html(currentView.title(value, min, max, culture));
                    that._table = to = $(currentView.content(extend({
                        min: min,
                        max: max,
                        date: value,
                        url: options.url,
                        dates: options.dates,
                        format: options.format,
                        culture: culture,
                        disableDates: options.disableDates
                    }, that[currentView.name])));
                    makeUnselectable(to);
                    var replace = from && from.data('start') === to.data('start');
                    that._animate({
                        from: from,
                        to: to,
                        vertical: vertical,
                        future: future,
                        replace: replace
                    });
                    that.trigger(NAVIGATE);
                    that._focus(value);
                }
                if (view === views[options.depth] && selectedValue && !that.options.disableDates(selectedValue)) {
                    that._class('k-state-selected', selectedValue);
                }
                that._class(FOCUSED, value);
                if (!from && that._cell) {
                    that._cell.removeClass(FOCUSED);
                }
                that._changeView = true;
            },
            value: function (value) {
                var that = this, view = that._view, options = that.options, old = that._view, min = options.min, max = options.max;
                if (value === undefined) {
                    return that._value;
                }
                if (value === null) {
                    that._current = new Date(that._current.getFullYear(), that._current.getMonth(), that._current.getDate());
                }
                value = parse(value, options.format, options.culture);
                if (value !== null) {
                    value = new DATE(+value);
                    if (!isInRange(value, min, max)) {
                        value = null;
                    }
                }
                if (value === null || !that.options.disableDates(value)) {
                    that._value = value;
                } else if (that._value === undefined) {
                    that._value = null;
                }
                if (old && value === null && that._cell) {
                    that._cell.removeClass('k-state-selected');
                } else {
                    that._changeView = !value || view && view.compare(value, that._current) !== 0;
                    that.navigate(value);
                }
            },
            _move: function (e) {
                var that = this, options = that.options, key = e.keyCode, view = that._view, index = that._index, min = that.options.min, max = that.options.max, currentValue = new DATE(+that._current), isRtl = kendo.support.isRtl(that.wrapper), isDisabled = that.options.disableDates, value, prevent, method, temp;
                if (e.target === that._table[0]) {
                    that._active = true;
                }
                if (e.ctrlKey) {
                    if (key == keys.RIGHT && !isRtl || key == keys.LEFT && isRtl) {
                        that.navigateToFuture();
                        prevent = true;
                    } else if (key == keys.LEFT && !isRtl || key == keys.RIGHT && isRtl) {
                        that.navigateToPast();
                        prevent = true;
                    } else if (key == keys.UP) {
                        that.navigateUp();
                        prevent = true;
                    } else if (key == keys.DOWN) {
                        that._click($(that._cell[0].firstChild));
                        prevent = true;
                    }
                } else {
                    if (key == keys.RIGHT && !isRtl || key == keys.LEFT && isRtl) {
                        value = 1;
                        prevent = true;
                    } else if (key == keys.LEFT && !isRtl || key == keys.RIGHT && isRtl) {
                        value = -1;
                        prevent = true;
                    } else if (key == keys.UP) {
                        value = index === 0 ? -7 : -4;
                        prevent = true;
                    } else if (key == keys.DOWN) {
                        value = index === 0 ? 7 : 4;
                        prevent = true;
                    } else if (key == keys.ENTER) {
                        that._click($(that._cell[0].firstChild));
                        prevent = true;
                    } else if (key == keys.HOME || key == keys.END) {
                        method = key == keys.HOME ? 'first' : 'last';
                        temp = view[method](currentValue);
                        currentValue = new DATE(temp.getFullYear(), temp.getMonth(), temp.getDate(), currentValue.getHours(), currentValue.getMinutes(), currentValue.getSeconds(), currentValue.getMilliseconds());
                        prevent = true;
                    } else if (key == keys.PAGEUP) {
                        prevent = true;
                        that.navigateToPast();
                    } else if (key == keys.PAGEDOWN) {
                        prevent = true;
                        that.navigateToFuture();
                    }
                    if (value || method) {
                        if (!method) {
                            view.setDate(currentValue, value);
                        }
                        if (isDisabled(currentValue)) {
                            currentValue = that._nextNavigatable(currentValue, value);
                        }
                        if (isInRange(currentValue, min, max)) {
                            that._focus(restrictValue(currentValue, options.min, options.max));
                        }
                    }
                }
                if (prevent) {
                    e.preventDefault();
                }
                return that._current;
            },
            _nextNavigatable: function (currentValue, value) {
                var that = this, disabled = true, view = that._view, min = that.options.min, max = that.options.max, isDisabled = that.options.disableDates, navigatableDate = new Date(currentValue.getTime());
                view.setDate(navigatableDate, -value);
                while (disabled) {
                    view.setDate(currentValue, value);
                    if (!isInRange(currentValue, min, max)) {
                        currentValue = navigatableDate;
                        break;
                    }
                    disabled = isDisabled(currentValue);
                }
                return currentValue;
            },
            _animate: function (options) {
                var that = this, from = options.from, to = options.to, active = that._active;
                if (!from) {
                    to.insertAfter(that.element[0].firstChild);
                    that._bindTable(to);
                } else if (from.parent().data('animating')) {
                    from.off(ns);
                    from.parent().kendoStop(true, true).remove();
                    from.remove();
                    to.insertAfter(that.element[0].firstChild);
                    that._focusView(active);
                } else if (!from.is(':visible') || that.options.animation === false || options.replace) {
                    to.insertAfter(from);
                    from.off(ns).remove();
                    that._focusView(active);
                } else {
                    that[options.vertical ? '_vertical' : '_horizontal'](from, to, options.future);
                }
            },
            _horizontal: function (from, to, future) {
                var that = this, active = that._active, horizontal = that.options.animation.horizontal, effects = horizontal.effects, viewWidth = from.outerWidth();
                if (effects && effects.indexOf(SLIDE) != -1) {
                    from.add(to).css({ width: viewWidth });
                    from.wrap('<div/>');
                    that._focusView(active, from);
                    from.parent().css({
                        position: 'relative',
                        width: viewWidth * 2,
                        'float': LEFT,
                        'margin-left': future ? 0 : -viewWidth
                    });
                    to[future ? 'insertAfter' : 'insertBefore'](from);
                    extend(horizontal, {
                        effects: SLIDE + ':' + (future ? 'right' : LEFT),
                        complete: function () {
                            from.off(ns).remove();
                            that._oldTable = null;
                            to.unwrap();
                            that._focusView(active);
                        }
                    });
                    from.parent().kendoStop(true, true).kendoAnimate(horizontal);
                }
            },
            _vertical: function (from, to) {
                var that = this, vertical = that.options.animation.vertical, effects = vertical.effects, active = that._active, cell, position;
                if (effects && effects.indexOf('zoom') != -1) {
                    to.css({
                        position: 'absolute',
                        top: from.prev().outerHeight(),
                        left: 0
                    }).insertBefore(from);
                    if (transitionOrigin) {
                        cell = that._cellByDate(that._view.toDateString(that._current));
                        position = cell.position();
                        position = position.left + parseInt(cell.width() / 2, 10) + 'px' + ' ' + (position.top + parseInt(cell.height() / 2, 10) + 'px');
                        to.css(transitionOrigin, position);
                    }
                    from.kendoStop(true, true).kendoAnimate({
                        effects: 'fadeOut',
                        duration: 600,
                        complete: function () {
                            from.off(ns).remove();
                            that._oldTable = null;
                            to.css({
                                position: 'static',
                                top: 0,
                                left: 0
                            });
                            that._focusView(active);
                        }
                    });
                    to.kendoStop(true, true).kendoAnimate(vertical);
                }
            },
            _cellByDate: function (value) {
                return this._table.find('td:not(.' + OTHERMONTH + ')').filter(function () {
                    return $(this.firstChild).attr(kendo.attr(VALUE)) === value;
                });
            },
            _class: function (className, date) {
                var that = this, id = that._cellID, cell = that._cell, value = that._view.toDateString(date), disabledDate;
                if (cell) {
                    cell.removeAttr(ARIA_SELECTED).removeAttr('aria-label').removeAttr(ID);
                }
                if (date) {
                    disabledDate = that.options.disableDates(date);
                }
                cell = that._table.find('td:not(.' + OTHERMONTH + ')').removeClass(className).filter(function () {
                    return $(this.firstChild).attr(kendo.attr(VALUE)) === value;
                }).attr(ARIA_SELECTED, true);
                if (className === FOCUSED && !that._active && that.options.focusOnNav !== false || disabledDate) {
                    className = '';
                }
                cell.addClass(className);
                if (cell[0]) {
                    that._cell = cell;
                }
                if (id) {
                    cell.attr(ID, id);
                    that._table.removeAttr('aria-activedescendant').attr('aria-activedescendant', id);
                }
            },
            _bindTable: function (table) {
                table.on(FOCUS_WITH_NS, this._addClassProxy).on(BLUR, this._removeClassProxy);
            },
            _click: function (link) {
                var that = this, options = that.options, currentValue = new Date(+that._current), value = that._toDateObject(link);
                adjustDST(value, 0);
                if (that.options.disableDates(value) && that._view.name == 'month') {
                    value = that._value;
                }
                that._view.setDate(currentValue, value);
                that.navigateDown(restrictValue(currentValue, options.min, options.max));
            },
            _focus: function (value) {
                var that = this, view = that._view;
                if (view.compare(value, that._current) !== 0) {
                    that.navigate(value);
                } else {
                    that._current = value;
                    that._class(FOCUSED, value);
                }
            },
            _focusView: function (active, table) {
                if (active) {
                    this.focus(table);
                }
            },
            _footer: function (template) {
                var that = this, today = getToday(), element = that.element, footer = element.find('.k-footer');
                if (!template) {
                    that._toggle(false);
                    footer.hide();
                    return;
                }
                if (!footer[0]) {
                    footer = $('<div class="k-footer"><a href="#" class="k-link k-nav-today"></a></div>').appendTo(element);
                }
                that._today = footer.show().find('.k-link').html(template(today)).attr('title', kendo.toString(today, 'D', that.options.culture));
                that._toggle();
            },
            _header: function () {
                var that = this, element = that.element, links;
                if (!element.find('.k-header')[0]) {
                    element.html('<div class="k-header">' + '<a href="#" role="button" class="k-link k-nav-prev"><span class="k-icon k-i-arrow-w"></span></a>' + '<a href="#" role="button" aria-live="assertive" aria-atomic="true" class="k-link k-nav-fast"></a>' + '<a href="#" role="button" class="k-link k-nav-next"><span class="k-icon k-i-arrow-e"></span></a>' + '</div>');
                }
                links = element.find('.k-link').on(MOUSEENTER_WITH_NS + ' ' + MOUSELEAVE + ' ' + FOCUS_WITH_NS + ' ' + BLUR, mousetoggle).click(false);
                that._title = links.eq(1).on(CLICK, function () {
                    that._active = that.options.focusOnNav !== false;
                    that.navigateUp();
                });
                that[PREVARROW] = links.eq(0).on(CLICK, function () {
                    that._active = that.options.focusOnNav !== false;
                    that.navigateToPast();
                });
                that[NEXTARROW] = links.eq(2).on(CLICK, function () {
                    that._active = that.options.focusOnNav !== false;
                    that.navigateToFuture();
                });
            },
            _navigate: function (arrow, modifier) {
                var that = this, index = that._index + 1, currentValue = new DATE(+that._current);
                arrow = that[arrow];
                if (!arrow.hasClass(DISABLED)) {
                    if (index > 3) {
                        currentValue.setFullYear(currentValue.getFullYear() + 100 * modifier);
                    } else {
                        calendar.views[index].setDate(currentValue, modifier);
                    }
                    that.navigate(currentValue);
                }
            },
            _option: function (option, value) {
                var that = this, options = that.options, currentValue = that._value || that._current, isBigger;
                if (value === undefined) {
                    return options[option];
                }
                value = parse(value, options.format, options.culture);
                if (!value) {
                    return;
                }
                options[option] = new DATE(+value);
                if (option === MIN) {
                    isBigger = value > currentValue;
                } else {
                    isBigger = currentValue > value;
                }
                if (isBigger || isEqualMonth(currentValue, value)) {
                    if (isBigger) {
                        that._value = null;
                    }
                    that._changeView = true;
                }
                if (!that._changeView) {
                    that._changeView = !!(options.month.content || options.month.empty);
                }
                that.navigate(that._value);
                that._toggle();
            },
            _toggle: function (toggle) {
                var that = this, options = that.options, isTodayDisabled = that.options.disableDates(getToday()), link = that._today;
                if (toggle === undefined) {
                    toggle = isInRange(getToday(), options.min, options.max);
                }
                if (link) {
                    link.off(CLICK);
                    if (toggle && !isTodayDisabled) {
                        link.addClass(TODAY).removeClass(DISABLED).on(CLICK, proxy(that._todayClick, that));
                    } else {
                        link.removeClass(TODAY).addClass(DISABLED).on(CLICK, prevent);
                    }
                }
            },
            _todayClick: function (e) {
                var that = this, depth = views[that.options.depth], disabled = that.options.disableDates, today = getToday();
                e.preventDefault();
                if (disabled(today)) {
                    return;
                }
                if (that._view.compare(that._current, today) === 0 && that._index == depth) {
                    that._changeView = false;
                }
                that._value = today;
                that.navigate(today, depth);
                that.trigger(CHANGE);
            },
            _toDateObject: function (link) {
                var value = $(link).attr(kendo.attr(VALUE)).split('/');
                value = new DATE(value[0], value[1], value[2]);
                return value;
            },
            _templates: function () {
                var that = this, options = that.options, footer = options.footer, month = options.month, content = month.content, empty = month.empty;
                that.month = {
                    content: template('<td#=data.cssClass# role="gridcell"><a tabindex="-1" class="k-link#=data.linkClass#" href="#=data.url#" ' + kendo.attr('value') + '="#=data.dateString#" title="#=data.title#">' + (content || '#=data.value#') + '</a></td>', { useWithBlock: !!content }),
                    empty: template('<td role="gridcell">' + (empty || '&nbsp;') + '</td>', { useWithBlock: !!empty })
                };
                that.footer = footer !== false ? template(footer || '#= kendo.toString(data,"D","' + options.culture + '") #', { useWithBlock: false }) : null;
            }
        });
        ui.plugin(Calendar);
        var calendar = {
            firstDayOfMonth: function (date) {
                return new DATE(date.getFullYear(), date.getMonth(), 1);
            },
            firstVisibleDay: function (date, calendarInfo) {
                calendarInfo = calendarInfo || kendo.culture().calendar;
                var firstDay = calendarInfo.firstDay, firstVisibleDay = new DATE(date.getFullYear(), date.getMonth(), 0, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
                while (firstVisibleDay.getDay() != firstDay) {
                    calendar.setTime(firstVisibleDay, -1 * MS_PER_DAY);
                }
                return firstVisibleDay;
            },
            setTime: function (date, time) {
                var tzOffsetBefore = date.getTimezoneOffset(), resultDATE = new DATE(date.getTime() + time), tzOffsetDiff = resultDATE.getTimezoneOffset() - tzOffsetBefore;
                date.setTime(resultDATE.getTime() + tzOffsetDiff * MS_PER_MINUTE);
            },
            views: [
                {
                    name: MONTH,
                    title: function (date, min, max, culture) {
                        return getCalendarInfo(culture).months.names[date.getMonth()] + ' ' + date.getFullYear();
                    },
                    content: function (options) {
                        var that = this, idx = 0, min = options.min, max = options.max, date = options.date, dates = options.dates, format = options.format, culture = options.culture, navigateUrl = options.url, hasUrl = navigateUrl && dates[0], currentCalendar = getCalendarInfo(culture), firstDayIdx = currentCalendar.firstDay, days = currentCalendar.days, names = shiftArray(days.names, firstDayIdx), shortNames = shiftArray(days.namesShort, firstDayIdx), start = calendar.firstVisibleDay(date, currentCalendar), firstDayOfMonth = that.first(date), lastDayOfMonth = that.last(date), toDateString = that.toDateString, today = new DATE(), html = '<table tabindex="0" role="grid" class="k-content" cellspacing="0" data-start="' + toDateString(start) + '"><thead><tr role="row">';
                        for (; idx < 7; idx++) {
                            html += '<th scope="col" title="' + names[idx] + '">' + shortNames[idx] + '</th>';
                        }
                        today = new DATE(today.getFullYear(), today.getMonth(), today.getDate());
                        adjustDST(today, 0);
                        today = +today;
                        return view({
                            cells: 42,
                            perRow: 7,
                            html: html += '</tr></thead><tbody><tr role="row">',
                            start: start,
                            min: new DATE(min.getFullYear(), min.getMonth(), min.getDate()),
                            max: new DATE(max.getFullYear(), max.getMonth(), max.getDate()),
                            content: options.content,
                            empty: options.empty,
                            setter: that.setDate,
                            disableDates: options.disableDates,
                            build: function (date, idx, disableDates) {
                                var cssClass = [], day = date.getDay(), linkClass = '', url = '#';
                                if (date < firstDayOfMonth || date > lastDayOfMonth) {
                                    cssClass.push(OTHERMONTH);
                                }
                                if (disableDates(date)) {
                                    cssClass.push(DISABLED);
                                }
                                if (+date === today) {
                                    cssClass.push('k-today');
                                }
                                if (day === 0 || day === 6) {
                                    cssClass.push('k-weekend');
                                }
                                if (hasUrl && inArray(+date, dates)) {
                                    url = navigateUrl.replace('{0}', kendo.toString(date, format, culture));
                                    linkClass = ' k-action-link';
                                }
                                return {
                                    date: date,
                                    dates: dates,
                                    ns: kendo.ns,
                                    title: kendo.toString(date, 'D', culture),
                                    value: date.getDate(),
                                    dateString: toDateString(date),
                                    cssClass: cssClass[0] ? ' class="' + cssClass.join(' ') + '"' : '',
                                    linkClass: linkClass,
                                    url: url
                                };
                            }
                        });
                    },
                    first: function (date) {
                        return calendar.firstDayOfMonth(date);
                    },
                    last: function (date) {
                        var last = new DATE(date.getFullYear(), date.getMonth() + 1, 0), first = calendar.firstDayOfMonth(date), timeOffset = Math.abs(last.getTimezoneOffset() - first.getTimezoneOffset());
                        if (timeOffset) {
                            last.setHours(first.getHours() + timeOffset / 60);
                        }
                        return last;
                    },
                    compare: function (date1, date2) {
                        var result, month1 = date1.getMonth(), year1 = date1.getFullYear(), month2 = date2.getMonth(), year2 = date2.getFullYear();
                        if (year1 > year2) {
                            result = 1;
                        } else if (year1 < year2) {
                            result = -1;
                        } else {
                            result = month1 == month2 ? 0 : month1 > month2 ? 1 : -1;
                        }
                        return result;
                    },
                    setDate: function (date, value) {
                        var hours = date.getHours();
                        if (value instanceof DATE) {
                            date.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
                        } else {
                            calendar.setTime(date, value * MS_PER_DAY);
                        }
                        adjustDST(date, hours);
                    },
                    toDateString: function (date) {
                        return date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate();
                    }
                },
                {
                    name: 'year',
                    title: function (date) {
                        return date.getFullYear();
                    },
                    content: function (options) {
                        var namesAbbr = getCalendarInfo(options.culture).months.namesAbbr, toDateString = this.toDateString, min = options.min, max = options.max;
                        return view({
                            min: new DATE(min.getFullYear(), min.getMonth(), 1),
                            max: new DATE(max.getFullYear(), max.getMonth(), 1),
                            start: new DATE(options.date.getFullYear(), 0, 1),
                            setter: this.setDate,
                            build: function (date) {
                                return {
                                    value: namesAbbr[date.getMonth()],
                                    ns: kendo.ns,
                                    dateString: toDateString(date),
                                    cssClass: ''
                                };
                            }
                        });
                    },
                    first: function (date) {
                        return new DATE(date.getFullYear(), 0, date.getDate());
                    },
                    last: function (date) {
                        return new DATE(date.getFullYear(), 11, date.getDate());
                    },
                    compare: function (date1, date2) {
                        return compare(date1, date2);
                    },
                    setDate: function (date, value) {
                        var month, hours = date.getHours();
                        if (value instanceof DATE) {
                            month = value.getMonth();
                            date.setFullYear(value.getFullYear(), month, date.getDate());
                            if (month !== date.getMonth()) {
                                date.setDate(0);
                            }
                        } else {
                            month = date.getMonth() + value;
                            date.setMonth(month);
                            if (month > 11) {
                                month -= 12;
                            }
                            if (month > 0 && date.getMonth() != month) {
                                date.setDate(0);
                            }
                        }
                        adjustDST(date, hours);
                    },
                    toDateString: function (date) {
                        return date.getFullYear() + '/' + date.getMonth() + '/1';
                    }
                },
                {
                    name: 'decade',
                    title: function (date, min, max) {
                        return title(date, min, max, 10);
                    },
                    content: function (options) {
                        var year = options.date.getFullYear(), toDateString = this.toDateString;
                        return view({
                            start: new DATE(year - year % 10 - 1, 0, 1),
                            min: new DATE(options.min.getFullYear(), 0, 1),
                            max: new DATE(options.max.getFullYear(), 0, 1),
                            setter: this.setDate,
                            build: function (date, idx) {
                                return {
                                    value: date.getFullYear(),
                                    ns: kendo.ns,
                                    dateString: toDateString(date),
                                    cssClass: idx === 0 || idx == 11 ? OTHERMONTHCLASS : ''
                                };
                            }
                        });
                    },
                    first: function (date) {
                        var year = date.getFullYear();
                        return new DATE(year - year % 10, date.getMonth(), date.getDate());
                    },
                    last: function (date) {
                        var year = date.getFullYear();
                        return new DATE(year - year % 10 + 9, date.getMonth(), date.getDate());
                    },
                    compare: function (date1, date2) {
                        return compare(date1, date2, 10);
                    },
                    setDate: function (date, value) {
                        setDate(date, value, 1);
                    },
                    toDateString: function (date) {
                        return date.getFullYear() + '/0/1';
                    }
                },
                {
                    name: CENTURY,
                    title: function (date, min, max) {
                        return title(date, min, max, 100);
                    },
                    content: function (options) {
                        var year = options.date.getFullYear(), min = options.min.getFullYear(), max = options.max.getFullYear(), toDateString = this.toDateString, minYear = min, maxYear = max;
                        minYear = minYear - minYear % 10;
                        maxYear = maxYear - maxYear % 10;
                        if (maxYear - minYear < 10) {
                            maxYear = minYear + 9;
                        }
                        return view({
                            start: new DATE(year - year % 100 - 10, 0, 1),
                            min: new DATE(minYear, 0, 1),
                            max: new DATE(maxYear, 0, 1),
                            setter: this.setDate,
                            build: function (date, idx) {
                                var start = date.getFullYear(), end = start + 9;
                                if (start < min) {
                                    start = min;
                                }
                                if (end > max) {
                                    end = max;
                                }
                                return {
                                    ns: kendo.ns,
                                    value: start + ' - ' + end,
                                    dateString: toDateString(date),
                                    cssClass: idx === 0 || idx == 11 ? OTHERMONTHCLASS : ''
                                };
                            }
                        });
                    },
                    first: function (date) {
                        var year = date.getFullYear();
                        return new DATE(year - year % 100, date.getMonth(), date.getDate());
                    },
                    last: function (date) {
                        var year = date.getFullYear();
                        return new DATE(year - year % 100 + 99, date.getMonth(), date.getDate());
                    },
                    compare: function (date1, date2) {
                        return compare(date1, date2, 100);
                    },
                    setDate: function (date, value) {
                        setDate(date, value, 10);
                    },
                    toDateString: function (date) {
                        var year = date.getFullYear();
                        return year - year % 10 + '/0/1';
                    }
                }
            ]
        };
        function title(date, min, max, modular) {
            var start = date.getFullYear(), minYear = min.getFullYear(), maxYear = max.getFullYear(), end;
            start = start - start % modular;
            end = start + (modular - 1);
            if (start < minYear) {
                start = minYear;
            }
            if (end > maxYear) {
                end = maxYear;
            }
            return start + '-' + end;
        }
        function view(options) {
            var idx = 0, data, min = options.min, max = options.max, start = options.start, setter = options.setter, build = options.build, length = options.cells || 12, cellsPerRow = options.perRow || 4, content = options.content || cellTemplate, empty = options.empty || emptyCellTemplate, html = options.html || '<table tabindex="0" role="grid" class="k-content k-meta-view" cellspacing="0"><tbody><tr role="row">';
            for (; idx < length; idx++) {
                if (idx > 0 && idx % cellsPerRow === 0) {
                    html += '</tr><tr role="row">';
                }
                start = new DATE(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
                adjustDST(start, 0);
                data = build(start, idx, options.disableDates);
                html += isInRange(start, min, max) ? content(data) : empty(data);
                setter(start, 1);
            }
            return html + '</tr></tbody></table>';
        }
        function compare(date1, date2, modifier) {
            var year1 = date1.getFullYear(), start = date2.getFullYear(), end = start, result = 0;
            if (modifier) {
                start = start - start % modifier;
                end = start - start % modifier + modifier - 1;
            }
            if (year1 > end) {
                result = 1;
            } else if (year1 < start) {
                result = -1;
            }
            return result;
        }
        function getToday() {
            var today = new DATE();
            return new DATE(today.getFullYear(), today.getMonth(), today.getDate());
        }
        function restrictValue(value, min, max) {
            var today = getToday();
            if (value) {
                today = new DATE(+value);
            }
            if (min > today) {
                today = new DATE(+min);
            } else if (max < today) {
                today = new DATE(+max);
            }
            return today;
        }
        function isInRange(date, min, max) {
            return +date >= +min && +date <= +max;
        }
        function shiftArray(array, idx) {
            return array.slice(idx).concat(array.slice(0, idx));
        }
        function setDate(date, value, multiplier) {
            value = value instanceof DATE ? value.getFullYear() : date.getFullYear() + multiplier * value;
            date.setFullYear(value);
        }
        function mousetoggle(e) {
            var disabled = $(this).hasClass('k-state-disabled');
            if (!disabled) {
                $(this).toggleClass(HOVER, MOUSEENTER.indexOf(e.type) > -1 || e.type == FOCUS);
            }
        }
        function prevent(e) {
            e.preventDefault();
        }
        function getCalendarInfo(culture) {
            return getCulture(culture).calendars.standard;
        }
        function normalize(options) {
            var start = views[options.start], depth = views[options.depth], culture = getCulture(options.culture);
            options.format = extractFormat(options.format || culture.calendars.standard.patterns.d);
            if (isNaN(start)) {
                start = 0;
                options.start = MONTH;
            }
            if (depth === undefined || depth > start) {
                options.depth = MONTH;
            }
            if (options.dates === null) {
                options.dates = [];
            }
        }
        function makeUnselectable(element) {
            if (isIE8) {
                element.find('*').attr('unselectable', 'on');
            }
        }
        function inArray(date, dates) {
            for (var i = 0, length = dates.length; i < length; i++) {
                if (date === +dates[i]) {
                    return true;
                }
            }
            return false;
        }
        function isEqualDatePart(value1, value2) {
            if (value1) {
                return value1.getFullYear() === value2.getFullYear() && value1.getMonth() === value2.getMonth() && value1.getDate() === value2.getDate();
            }
            return false;
        }
        function isEqualMonth(value1, value2) {
            if (value1) {
                return value1.getFullYear() === value2.getFullYear() && value1.getMonth() === value2.getMonth();
            }
            return false;
        }
        function getDisabledExpr(option) {
            if (kendo.isFunction(option)) {
                return option;
            }
            if ($.isArray(option)) {
                return createDisabledExpr(option);
            }
            return $.noop;
        }
        function convertDatesArray(dates) {
            var result = [];
            for (var i = 0; i < dates.length; i++) {
                result.push(dates[i].setHours(0, 0, 0, 0));
            }
            return result;
        }
        function createDisabledExpr(dates) {
            var body, callback, disabledDates = [], days = [
                    'su',
                    'mo',
                    'tu',
                    'we',
                    'th',
                    'fr',
                    'sa'
                ], searchExpression = 'if (found) {' + ' return true ' + '} else {' + 'return false' + '}';
            if (dates[0] instanceof DATE) {
                disabledDates = convertDatesArray(dates);
                body = 'var found = date && $.inArray(date.setHours(0, 0, 0, 0),[' + disabledDates + ']) > -1;' + searchExpression;
            } else {
                for (var i = 0; i < dates.length; i++) {
                    var day = dates[i].slice(0, 2).toLowerCase();
                    var index = $.inArray(day, days);
                    if (index > -1) {
                        disabledDates.push(index);
                    }
                }
                body = 'var found = date && $.inArray(date.getDay(),[' + disabledDates + ']) > -1;' + searchExpression;
            }
            callback = new Function('date', body);
            return callback;
        }
        function isEqualDate(oldValue, newValue) {
            if (oldValue instanceof Date && newValue instanceof Date) {
                oldValue = oldValue.getTime();
                newValue = newValue.getTime();
            }
            return oldValue === newValue;
        }
        calendar.isEqualDatePart = isEqualDatePart;
        calendar.makeUnselectable = makeUnselectable;
        calendar.restrictValue = restrictValue;
        calendar.isInRange = isInRange;
        calendar.normalize = normalize;
        calendar.viewsEnum = views;
        calendar.disabled = getDisabledExpr;
        kendo.calendar = calendar;
    }(window.kendo.jQuery));
    return window.kendo;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('kendo.popup', ['kendo.core'], f);
}(function () {
    var __meta__ = {
        id: 'popup',
        name: 'Pop-up',
        category: 'framework',
        depends: ['core'],
        advanced: true
    };
    (function ($, undefined) {
        var kendo = window.kendo, ui = kendo.ui, Widget = ui.Widget, support = kendo.support, getOffset = kendo.getOffset, OPEN = 'open', CLOSE = 'close', DEACTIVATE = 'deactivate', ACTIVATE = 'activate', CENTER = 'center', LEFT = 'left', RIGHT = 'right', TOP = 'top', BOTTOM = 'bottom', ABSOLUTE = 'absolute', HIDDEN = 'hidden', BODY = 'body', LOCATION = 'location', POSITION = 'position', VISIBLE = 'visible', EFFECTS = 'effects', ACTIVE = 'k-state-active', ACTIVEBORDER = 'k-state-border', ACTIVEBORDERREGEXP = /k-state-border-(\w+)/, ACTIVECHILDREN = '.k-picker-wrap, .k-dropdown-wrap, .k-link', MOUSEDOWN = 'down', DOCUMENT_ELEMENT = $(document.documentElement), WINDOW = $(window), SCROLL = 'scroll', cssPrefix = support.transitions.css, TRANSFORM = cssPrefix + 'transform', extend = $.extend, NS = '.kendoPopup', styles = [
                'font-size',
                'font-family',
                'font-stretch',
                'font-style',
                'font-weight',
                'line-height'
            ];
        function contains(container, target) {
            if (!container || !target) {
                return false;
            }
            return container === target || $.contains(container, target);
        }
        var Popup = Widget.extend({
            init: function (element, options) {
                var that = this, parentPopup;
                options = options || {};
                if (options.isRtl) {
                    options.origin = options.origin || BOTTOM + ' ' + RIGHT;
                    options.position = options.position || TOP + ' ' + RIGHT;
                }
                Widget.fn.init.call(that, element, options);
                element = that.element;
                options = that.options;
                that.collisions = options.collision ? options.collision.split(' ') : [];
                that.downEvent = kendo.applyEventMap(MOUSEDOWN, kendo.guid());
                if (that.collisions.length === 1) {
                    that.collisions.push(that.collisions[0]);
                }
                parentPopup = $(that.options.anchor).closest('.k-popup,.k-group').filter(':not([class^=km-])');
                options.appendTo = $($(options.appendTo)[0] || parentPopup[0] || BODY);
                that.element.hide().addClass('k-popup k-group k-reset').toggleClass('k-rtl', !!options.isRtl).css({ position: ABSOLUTE }).appendTo(options.appendTo).on('mouseenter' + NS, function () {
                    that._hovered = true;
                }).on('mouseleave' + NS, function () {
                    that._hovered = false;
                });
                that.wrapper = $();
                if (options.animation === false) {
                    options.animation = {
                        open: { effects: {} },
                        close: {
                            hide: true,
                            effects: {}
                        }
                    };
                }
                extend(options.animation.open, {
                    complete: function () {
                        that.wrapper.css({ overflow: VISIBLE });
                        that._activated = true;
                        that._trigger(ACTIVATE);
                    }
                });
                extend(options.animation.close, {
                    complete: function () {
                        that._animationClose();
                    }
                });
                that._mousedownProxy = function (e) {
                    that._mousedown(e);
                };
                if (support.mobileOS.android) {
                    that._resizeProxy = function (e) {
                        setTimeout(function () {
                            that._resize(e);
                        }, 600);
                    };
                } else {
                    that._resizeProxy = function (e) {
                        that._resize(e);
                    };
                }
                if (options.toggleTarget) {
                    $(options.toggleTarget).on(options.toggleEvent + NS, $.proxy(that.toggle, that));
                }
            },
            events: [
                OPEN,
                ACTIVATE,
                CLOSE,
                DEACTIVATE
            ],
            options: {
                name: 'Popup',
                toggleEvent: 'click',
                origin: BOTTOM + ' ' + LEFT,
                position: TOP + ' ' + LEFT,
                anchor: BODY,
                appendTo: null,
                collision: 'flip fit',
                viewport: window,
                copyAnchorStyles: true,
                autosize: false,
                modal: false,
                adjustSize: {
                    width: 0,
                    height: 0
                },
                animation: {
                    open: {
                        effects: 'slideIn:down',
                        transition: true,
                        duration: 200
                    },
                    close: {
                        duration: 100,
                        hide: true
                    }
                }
            },
            _animationClose: function () {
                var that = this;
                var location = that.wrapper.data(LOCATION);
                that.wrapper.hide();
                if (location) {
                    that.wrapper.css(location);
                }
                if (that.options.anchor != BODY) {
                    that._hideDirClass();
                }
                that._closing = false;
                that._trigger(DEACTIVATE);
            },
            destroy: function () {
                var that = this, options = that.options, element = that.element.off(NS), parent;
                Widget.fn.destroy.call(that);
                if (options.toggleTarget) {
                    $(options.toggleTarget).off(NS);
                }
                if (!options.modal) {
                    DOCUMENT_ELEMENT.unbind(that.downEvent, that._mousedownProxy);
                    that._toggleResize(false);
                }
                kendo.destroy(that.element.children());
                element.removeData();
                if (options.appendTo[0] === document.body) {
                    parent = element.parent('.k-animation-container');
                    if (parent[0]) {
                        parent.remove();
                    } else {
                        element.remove();
                    }
                }
            },
            open: function (x, y) {
                var that = this, fixed = {
                        isFixed: !isNaN(parseInt(y, 10)),
                        x: x,
                        y: y
                    }, element = that.element, options = that.options, animation, wrapper, anchor = $(options.anchor), mobile = element[0] && element.hasClass('km-widget');
                if (!that.visible()) {
                    if (options.copyAnchorStyles) {
                        if (mobile && styles[0] == 'font-size') {
                            styles.shift();
                        }
                        element.css(kendo.getComputedStyles(anchor[0], styles));
                    }
                    if (element.data('animating') || that._trigger(OPEN)) {
                        return;
                    }
                    that._activated = false;
                    if (!options.modal) {
                        DOCUMENT_ELEMENT.unbind(that.downEvent, that._mousedownProxy).bind(that.downEvent, that._mousedownProxy);
                        that._toggleResize(false);
                        that._toggleResize(true);
                    }
                    that.wrapper = wrapper = kendo.wrap(element, options.autosize).css({
                        overflow: HIDDEN,
                        display: 'block',
                        position: ABSOLUTE
                    });
                    if (support.mobileOS.android) {
                        wrapper.css(TRANSFORM, 'translatez(0)');
                    }
                    wrapper.css(POSITION);
                    if ($(options.appendTo)[0] == document.body) {
                        wrapper.css(TOP, '-10000px');
                    }
                    that.flipped = that._position(fixed);
                    animation = that._openAnimation();
                    if (options.anchor != BODY) {
                        that._showDirClass(animation);
                    }
                    element.data(EFFECTS, animation.effects).kendoStop(true).kendoAnimate(animation);
                }
            },
            _openAnimation: function () {
                var animation = extend(true, {}, this.options.animation.open);
                animation.effects = kendo.parseEffects(animation.effects, this.flipped);
                return animation;
            },
            _hideDirClass: function () {
                var anchor = $(this.options.anchor);
                var direction = ((anchor.attr('class') || '').match(ACTIVEBORDERREGEXP) || [
                    '',
                    'down'
                ])[1];
                var dirClass = ACTIVEBORDER + '-' + direction;
                anchor.removeClass(dirClass).children(ACTIVECHILDREN).removeClass(ACTIVE).removeClass(dirClass);
                this.element.removeClass(ACTIVEBORDER + '-' + kendo.directions[direction].reverse);
            },
            _showDirClass: function (animation) {
                var direction = animation.effects.slideIn ? animation.effects.slideIn.direction : 'down';
                var dirClass = ACTIVEBORDER + '-' + direction;
                $(this.options.anchor).addClass(dirClass).children(ACTIVECHILDREN).addClass(ACTIVE).addClass(dirClass);
                this.element.addClass(ACTIVEBORDER + '-' + kendo.directions[direction].reverse);
            },
            position: function () {
                if (this.visible()) {
                    this.flipped = this._position();
                }
            },
            toggle: function () {
                var that = this;
                that[that.visible() ? CLOSE : OPEN]();
            },
            visible: function () {
                return this.element.is(':' + VISIBLE);
            },
            close: function (skipEffects) {
                var that = this, options = that.options, wrap, animation, openEffects, closeEffects;
                if (that.visible()) {
                    wrap = that.wrapper[0] ? that.wrapper : kendo.wrap(that.element).hide();
                    that._toggleResize(false);
                    if (that._closing || that._trigger(CLOSE)) {
                        that._toggleResize(true);
                        return;
                    }
                    that.element.find('.k-popup').each(function () {
                        var that = $(this), popup = that.data('kendoPopup');
                        if (popup) {
                            popup.close(skipEffects);
                        }
                    });
                    DOCUMENT_ELEMENT.unbind(that.downEvent, that._mousedownProxy);
                    if (skipEffects) {
                        animation = {
                            hide: true,
                            effects: {}
                        };
                    } else {
                        animation = extend(true, {}, options.animation.close);
                        openEffects = that.element.data(EFFECTS);
                        closeEffects = animation.effects;
                        if (!closeEffects && !kendo.size(closeEffects) && openEffects && kendo.size(openEffects)) {
                            animation.effects = openEffects;
                            animation.reverse = true;
                        }
                        that._closing = true;
                    }
                    that.element.kendoStop(true);
                    wrap.css({ overflow: HIDDEN });
                    that.element.kendoAnimate(animation);
                }
            },
            _trigger: function (ev) {
                return this.trigger(ev, { type: ev });
            },
            _resize: function (e) {
                var that = this;
                if (support.resize.indexOf(e.type) !== -1) {
                    clearTimeout(that._resizeTimeout);
                    that._resizeTimeout = setTimeout(function () {
                        that._position();
                        that._resizeTimeout = null;
                    }, 50);
                } else {
                    if (!that._hovered || that._activated && that.element.hasClass('k-list-container')) {
                        that.close();
                    }
                }
            },
            _toggleResize: function (toggle) {
                var method = toggle ? 'on' : 'off';
                var eventNames = support.resize;
                if (!(support.mobileOS.ios || support.mobileOS.android)) {
                    eventNames += ' ' + SCROLL;
                }
                this._scrollableParents()[method](SCROLL, this._resizeProxy);
                WINDOW[method](eventNames, this._resizeProxy);
            },
            _mousedown: function (e) {
                var that = this, container = that.element[0], options = that.options, anchor = $(options.anchor)[0], toggleTarget = options.toggleTarget, target = kendo.eventTarget(e), popup = $(target).closest('.k-popup'), mobile = popup.parent().parent('.km-shim').length;
                popup = popup[0];
                if (!mobile && popup && popup !== that.element[0]) {
                    return;
                }
                if ($(e.target).closest('a').data('rel') === 'popover') {
                    return;
                }
                if (!contains(container, target) && !contains(anchor, target) && !(toggleTarget && contains($(toggleTarget)[0], target))) {
                    that.close();
                }
            },
            _fit: function (position, size, viewPortSize) {
                var output = 0;
                if (position + size > viewPortSize) {
                    output = viewPortSize - (position + size);
                }
                if (position < 0) {
                    output = -position;
                }
                return output;
            },
            _flip: function (offset, size, anchorSize, viewPortSize, origin, position, boxSize) {
                var output = 0;
                boxSize = boxSize || size;
                if (position !== origin && position !== CENTER && origin !== CENTER) {
                    if (offset + boxSize > viewPortSize) {
                        output += -(anchorSize + size);
                    }
                    if (offset + output < 0) {
                        output += anchorSize + size;
                    }
                }
                return output;
            },
            _scrollableParents: function () {
                return $(this.options.anchor).parentsUntil('body').filter(function (index, element) {
                    return kendo.isScrollable(element);
                });
            },
            _position: function (fixed) {
                var that = this, element = that.element, wrapper = that.wrapper, options = that.options, viewport = $(options.viewport), viewportOffset = viewport.offset(), anchor = $(options.anchor), origins = options.origin.toLowerCase().split(' '), positions = options.position.toLowerCase().split(' '), collisions = that.collisions, zoomLevel = support.zoomLevel(), siblingContainer, parents, parentZIndex, zIndex = 10002, isWindow = !!(viewport[0] == window && window.innerWidth && zoomLevel <= 1.02), idx = 0, docEl = document.documentElement, length, viewportWidth, viewportHeight;
                viewportWidth = isWindow ? window.innerWidth : viewport.width();
                viewportHeight = isWindow ? window.innerHeight : viewport.height();
                if (isWindow && docEl.scrollHeight - docEl.clientHeight > 0) {
                    viewportWidth -= kendo.support.scrollbar();
                }
                siblingContainer = anchor.parents().filter(wrapper.siblings());
                if (siblingContainer[0]) {
                    parentZIndex = Math.max(Number(siblingContainer.css('zIndex')), 0);
                    if (parentZIndex) {
                        zIndex = parentZIndex + 10;
                    } else {
                        parents = anchor.parentsUntil(siblingContainer);
                        for (length = parents.length; idx < length; idx++) {
                            parentZIndex = Number($(parents[idx]).css('zIndex'));
                            if (parentZIndex && zIndex < parentZIndex) {
                                zIndex = parentZIndex + 10;
                            }
                        }
                    }
                }
                wrapper.css('zIndex', zIndex);
                if (fixed && fixed.isFixed) {
                    wrapper.css({
                        left: fixed.x,
                        top: fixed.y
                    });
                } else {
                    wrapper.css(that._align(origins, positions));
                }
                var pos = getOffset(wrapper, POSITION, anchor[0] === wrapper.offsetParent()[0]), offset = getOffset(wrapper), anchorParent = anchor.offsetParent().parent('.k-animation-container,.k-popup,.k-group');
                if (anchorParent.length) {
                    pos = getOffset(wrapper, POSITION, true);
                    offset = getOffset(wrapper);
                }
                if (viewport[0] === window) {
                    offset.top -= window.pageYOffset || document.documentElement.scrollTop || 0;
                    offset.left -= window.pageXOffset || document.documentElement.scrollLeft || 0;
                } else {
                    offset.top -= viewportOffset.top;
                    offset.left -= viewportOffset.left;
                }
                if (!that.wrapper.data(LOCATION)) {
                    wrapper.data(LOCATION, extend({}, pos));
                }
                var offsets = extend({}, offset), location = extend({}, pos), adjustSize = options.adjustSize;
                if (collisions[0] === 'fit') {
                    location.top += that._fit(offsets.top, wrapper.outerHeight() + adjustSize.height, viewportHeight / zoomLevel);
                }
                if (collisions[1] === 'fit') {
                    location.left += that._fit(offsets.left, wrapper.outerWidth() + adjustSize.width, viewportWidth / zoomLevel);
                }
                var flipPos = extend({}, location);
                var elementHeight = element.outerHeight();
                var wrapperHeight = wrapper.outerHeight();
                if (!wrapper.height() && elementHeight) {
                    wrapperHeight = wrapperHeight + elementHeight;
                }
                if (collisions[0] === 'flip') {
                    location.top += that._flip(offsets.top, elementHeight, anchor.outerHeight(), viewportHeight / zoomLevel, origins[0], positions[0], wrapperHeight);
                }
                if (collisions[1] === 'flip') {
                    location.left += that._flip(offsets.left, element.outerWidth(), anchor.outerWidth(), viewportWidth / zoomLevel, origins[1], positions[1], wrapper.outerWidth());
                }
                element.css(POSITION, ABSOLUTE);
                wrapper.css(location);
                return location.left != flipPos.left || location.top != flipPos.top;
            },
            _align: function (origin, position) {
                var that = this, element = that.wrapper, anchor = $(that.options.anchor), verticalOrigin = origin[0], horizontalOrigin = origin[1], verticalPosition = position[0], horizontalPosition = position[1], anchorOffset = getOffset(anchor), appendTo = $(that.options.appendTo), appendToOffset, width = element.outerWidth(), height = element.outerHeight(), anchorWidth = anchor.outerWidth(), anchorHeight = anchor.outerHeight(), top = anchorOffset.top, left = anchorOffset.left, round = Math.round;
                if (appendTo[0] != document.body) {
                    appendToOffset = getOffset(appendTo);
                    top -= appendToOffset.top;
                    left -= appendToOffset.left;
                }
                if (verticalOrigin === BOTTOM) {
                    top += anchorHeight;
                }
                if (verticalOrigin === CENTER) {
                    top += round(anchorHeight / 2);
                }
                if (verticalPosition === BOTTOM) {
                    top -= height;
                }
                if (verticalPosition === CENTER) {
                    top -= round(height / 2);
                }
                if (horizontalOrigin === RIGHT) {
                    left += anchorWidth;
                }
                if (horizontalOrigin === CENTER) {
                    left += round(anchorWidth / 2);
                }
                if (horizontalPosition === RIGHT) {
                    left -= width;
                }
                if (horizontalPosition === CENTER) {
                    left -= round(width / 2);
                }
                return {
                    top: top,
                    left: left
                };
            }
        });
        ui.plugin(Popup);
    }(window.kendo.jQuery));
    return window.kendo;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('kendo.DatePicker', [
        'kendo.calendar',
        'kendo.popup'
    ], f);
}(function () {
    var __meta__ = {
        id: 'datepicker',
        name: 'DatePicker',
        category: 'web',
        description: 'The DatePicker widget allows the user to select a date from a calendar or by direct input.',
        depends: [
            'calendar',
            'popup'
        ]
    };
    (function ($, undefined) {
        var kendo = window.kendo, ui = kendo.ui, Widget = ui.Widget, parse = kendo.parseDate, keys = kendo.keys, template = kendo.template, activeElement = kendo._activeElement, DIV = '<div />', SPAN = '<span />', ns = '.kendoDatePicker', CLICK = 'click' + ns, OPEN = 'open', CLOSE = 'close', CHANGE = 'change', DISABLED = 'disabled', READONLY = 'readonly', DEFAULT = 'k-state-default', FOCUSED = 'k-state-focused', SELECTED = 'k-state-selected', STATEDISABLED = 'k-state-disabled', HOVER = 'k-state-hover', HOVEREVENTS = 'mouseenter' + ns + ' mouseleave' + ns, MOUSEDOWN = 'mousedown' + ns, ID = 'id', MIN = 'min', MAX = 'max', MONTH = 'month', ARIA_DISABLED = 'aria-disabled', ARIA_EXPANDED = 'aria-expanded', ARIA_HIDDEN = 'aria-hidden', calendar = kendo.calendar, isInRange = calendar.isInRange, restrictValue = calendar.restrictValue, isEqualDatePart = calendar.isEqualDatePart, extend = $.extend, proxy = $.proxy, DATE = Date;
        function normalize(options) {
            var parseFormats = options.parseFormats, format = options.format;
            calendar.normalize(options);
            parseFormats = $.isArray(parseFormats) ? parseFormats : [parseFormats];
            if (!parseFormats.length) {
                parseFormats.push('yyyy-MM-dd');
            }
            if ($.inArray(format, parseFormats) === -1) {
                parseFormats.splice(0, 0, options.format);
            }
            options.parseFormats = parseFormats;
        }
        function preventDefault(e) {
            e.preventDefault();
        }
        var DateView = function (options) {
            var that = this, id, body = document.body, div = $(DIV).attr(ARIA_HIDDEN, 'true').addClass('k-calendar-container').appendTo(body);
            that.options = options = options || {};
            id = options.id;
            if (id) {
                id += '_dateview';
                div.attr(ID, id);
                that._dateViewID = id;
            }
            that.popup = new ui.Popup(div, extend(options.popup, options, {
                name: 'Popup',
                isRtl: kendo.support.isRtl(options.anchor)
            }));
            that.div = div;
            that.value(options.value);
        };
        DateView.prototype = {
            _calendar: function () {
                var that = this;
                var calendar = that.calendar;
                var options = that.options;
                var div;
                if (!calendar) {
                    div = $(DIV).attr(ID, kendo.guid()).appendTo(that.popup.element).on(MOUSEDOWN, preventDefault).on(CLICK, 'td:has(.k-link)', proxy(that._click, that));
                    that.calendar = calendar = new ui.Calendar(div);
                    that._setOptions(options);
                    kendo.calendar.makeUnselectable(calendar.element);
                    calendar.navigate(that._value || that._current, options.start);
                    that.value(that._value);
                }
            },
            _setOptions: function (options) {
                this.calendar.setOptions({
                    focusOnNav: false,
                    change: options.change,
                    culture: options.culture,
                    dates: options.dates,
                    depth: options.depth,
                    footer: options.footer,
                    format: options.format,
                    max: options.max,
                    min: options.min,
                    month: options.month,
                    start: options.start,
                    disableDates: options.disableDates
                });
            },
            setOptions: function (options) {
                var old = this.options;
                var disableDates = options.disableDates;
                if (disableDates) {
                    options.disableDates = calendar.disabled(disableDates);
                }
                this.options = extend(old, options, {
                    change: old.change,
                    close: old.close,
                    open: old.open
                });
                if (this.calendar) {
                    this._setOptions(this.options);
                }
            },
            destroy: function () {
                this.popup.destroy();
            },
            open: function () {
                var that = this;
                that._calendar();
                that.popup.open();
            },
            close: function () {
                this.popup.close();
            },
            min: function (value) {
                this._option(MIN, value);
            },
            max: function (value) {
                this._option(MAX, value);
            },
            toggle: function () {
                var that = this;
                that[that.popup.visible() ? CLOSE : OPEN]();
            },
            move: function (e) {
                var that = this, key = e.keyCode, calendar = that.calendar, selectIsClicked = e.ctrlKey && key == keys.DOWN || key == keys.ENTER, handled = false;
                if (e.altKey) {
                    if (key == keys.DOWN) {
                        that.open();
                        e.preventDefault();
                        handled = true;
                    } else if (key == keys.UP) {
                        that.close();
                        e.preventDefault();
                        handled = true;
                    }
                } else if (that.popup.visible()) {
                    if (key == keys.ESC || selectIsClicked && calendar._cell.hasClass(SELECTED)) {
                        that.close();
                        e.preventDefault();
                        return true;
                    }
                    that._current = calendar._move(e);
                    handled = true;
                }
                return handled;
            },
            current: function (date) {
                this._current = date;
                this.calendar._focus(date);
            },
            value: function (value) {
                var that = this, calendar = that.calendar, options = that.options, disabledDate = options.disableDates;
                if (disabledDate && disabledDate(value)) {
                    value = null;
                }
                that._value = value;
                that._current = new DATE(+restrictValue(value, options.min, options.max));
                if (calendar) {
                    calendar.value(value);
                }
            },
            _click: function (e) {
                if (e.currentTarget.className.indexOf(SELECTED) !== -1) {
                    this.close();
                }
            },
            _option: function (option, value) {
                var that = this;
                var calendar = that.calendar;
                that.options[option] = value;
                if (calendar) {
                    calendar[option](value);
                }
            }
        };
        DateView.normalize = normalize;
        kendo.DateView = DateView;
        var DatePicker = Widget.extend({
            init: function (element, options) {
                var that = this, disabled, div;
                Widget.fn.init.call(that, element, options);
                element = that.element;
                options = that.options;
                options.disableDates = kendo.calendar.disabled(options.disableDates);
                options.min = parse(element.attr('min')) || parse(options.min);
                options.max = parse(element.attr('max')) || parse(options.max);
                normalize(options);
                that._initialOptions = extend({}, options);
                that._wrapper();
                that.dateView = new DateView(extend({}, options, {
                    id: element.attr(ID),
                    anchor: that.wrapper,
                    change: function () {
                        that._change(this.value());
                        that.close();
                    },
                    close: function (e) {
                        if (that.trigger(CLOSE)) {
                            e.preventDefault();
                        } else {
                            element.attr(ARIA_EXPANDED, false);
                            div.attr(ARIA_HIDDEN, true);
                        }
                    },
                    open: function (e) {
                        var options = that.options, date;
                        if (that.trigger(OPEN)) {
                            e.preventDefault();
                        } else {
                            if (that.element.val() !== that._oldText) {
                                date = parse(element.val(), options.parseFormats, options.culture);
                                that.dateView[date ? 'current' : 'value'](date);
                            }
                            element.attr(ARIA_EXPANDED, true);
                            div.attr(ARIA_HIDDEN, false);
                            that._updateARIA(date);
                        }
                    }
                }));
                div = that.dateView.div;
                that._icon();
                try {
                    element[0].setAttribute('type', 'text');
                } catch (e) {
                    element[0].type = 'text';
                }
                element.addClass('k-input').attr({
                    role: 'combobox',
                    'aria-expanded': false,
                    'aria-owns': that.dateView._dateViewID
                });
                that._reset();
                that._template();
                disabled = element.is('[disabled]') || $(that.element).parents('fieldset').is(':disabled');
                if (disabled) {
                    that.enable(false);
                } else {
                    that.readonly(element.is('[readonly]'));
                }
                that._old = that._update(options.value || that.element.val());
                that._oldText = element.val();
                kendo.notify(that);
            },
            events: [
                OPEN,
                CLOSE,
                CHANGE
            ],
            options: {
                name: 'DatePicker',
                value: null,
                footer: '',
                format: '',
                culture: '',
                parseFormats: [],
                min: new Date(1900, 0, 1),
                max: new Date(2099, 11, 31),
                start: MONTH,
                depth: MONTH,
                animation: {},
                month: {},
                dates: [],
                ARIATemplate: 'Current focused date is #=kendo.toString(data.current, "D")#'
            },
            setOptions: function (options) {
                var that = this;
                var value = that._value;
                Widget.fn.setOptions.call(that, options);
                options = that.options;
                options.min = parse(options.min);
                options.max = parse(options.max);
                normalize(options);
                that.dateView.setOptions(options);
                if (value) {
                    that.element.val(kendo.toString(value, options.format, options.culture));
                    that._updateARIA(value);
                }
            },
            _editable: function (options) {
                var that = this, icon = that._dateIcon.off(ns), element = that.element.off(ns), wrapper = that._inputWrapper.off(ns), readonly = options.readonly, disable = options.disable;
                if (!readonly && !disable) {
                    wrapper.addClass(DEFAULT).removeClass(STATEDISABLED).on(HOVEREVENTS, that._toggleHover);
                    element.removeAttr(DISABLED).removeAttr(READONLY).attr(ARIA_DISABLED, false).on('keydown' + ns, proxy(that._keydown, that)).on('focusout' + ns, proxy(that._blur, that)).on('focus' + ns, function () {
                        that._inputWrapper.addClass(FOCUSED);
                    });
                    icon.on(CLICK, proxy(that._click, that)).on(MOUSEDOWN, preventDefault);
                } else {
                    wrapper.addClass(disable ? STATEDISABLED : DEFAULT).removeClass(disable ? DEFAULT : STATEDISABLED);
                    element.attr(DISABLED, disable).attr(READONLY, readonly).attr(ARIA_DISABLED, disable);
                }
            },
            readonly: function (readonly) {
                this._editable({
                    readonly: readonly === undefined ? true : readonly,
                    disable: false
                });
            },
            enable: function (enable) {
                this._editable({
                    readonly: false,
                    disable: !(enable = enable === undefined ? true : enable)
                });
            },
            destroy: function () {
                var that = this;
                Widget.fn.destroy.call(that);
                that.dateView.destroy();
                that.element.off(ns);
                that._dateIcon.off(ns);
                that._inputWrapper.off(ns);
                if (that._form) {
                    that._form.off('reset', that._resetHandler);
                }
            },
            open: function () {
                this.dateView.open();
            },
            close: function () {
                this.dateView.close();
            },
            min: function (value) {
                return this._option(MIN, value);
            },
            max: function (value) {
                return this._option(MAX, value);
            },
            value: function (value) {
                var that = this;
                if (value === undefined) {
                    return that._value;
                }
                that._old = that._update(value);
                if (that._old === null) {
                    that.element.val('');
                }
                that._oldText = that.element.val();
            },
            _toggleHover: function (e) {
                $(e.currentTarget).toggleClass(HOVER, e.type === 'mouseenter');
            },
            _blur: function () {
                var that = this, value = that.element.val();
                that.close();
                if (value !== that._oldText) {
                    that._change(value);
                }
                that._inputWrapper.removeClass(FOCUSED);
            },
            _click: function () {
                var that = this, element = that.element;
                that.dateView.toggle();
                if (!kendo.support.touch && element[0] !== activeElement()) {
                    element.focus();
                }
            },
            _change: function (value) {
                var that = this, oldValue = that.element.val(), dateChanged;
                value = that._update(value);
                dateChanged = +that._old != +value;
                var valueUpdated = dateChanged && !that._typing;
                var textFormatted = oldValue !== that.element.val();
                if (valueUpdated || textFormatted) {
                    that.element.trigger(CHANGE);
                }
                if (dateChanged) {
                    that._old = value;
                    that._oldText = that.element.val();
                    that.trigger(CHANGE);
                }
                that._typing = false;
            },
            _keydown: function (e) {
                var that = this, dateView = that.dateView, value = that.element.val(), handled = false;
                if (!dateView.popup.visible() && e.keyCode == keys.ENTER && value !== that._oldText) {
                    that._change(value);
                } else {
                    handled = dateView.move(e);
                    that._updateARIA(dateView._current);
                    if (!handled) {
                        that._typing = true;
                    }
                }
            },
            _icon: function () {
                var that = this, element = that.element, icon;
                icon = element.next('span.k-select');
                if (!icon[0]) {
                    icon = $('<span unselectable="on" class="k-select"><span unselectable="on" class="k-icon k-i-calendar">select</span></span>').insertAfter(element);
                }
                that._dateIcon = icon.attr({
                    'role': 'button',
                    'aria-controls': that.dateView._dateViewID
                });
            },
            _option: function (option, value) {
                var that = this, options = that.options;
                if (value === undefined) {
                    return options[option];
                }
                value = parse(value, options.parseFormats, options.culture);
                if (!value) {
                    return;
                }
                options[option] = new DATE(+value);
                that.dateView[option](value);
            },
            _update: function (value) {
                var that = this, options = that.options, min = options.min, max = options.max, current = that._value, date = parse(value, options.parseFormats, options.culture), isSameType = date === null && current === null || date instanceof Date && current instanceof Date, formattedValue;
                if (options.disableDates(date)) {
                    date = null;
                    if (!that._old) {
                        value = null;
                    }
                }
                if (+date === +current && isSameType) {
                    formattedValue = kendo.toString(date, options.format, options.culture);
                    if (formattedValue !== value) {
                        that.element.val(date === null ? value : formattedValue);
                    }
                    return date;
                }
                if (date !== null && isEqualDatePart(date, min)) {
                    date = restrictValue(date, min, max);
                } else if (!isInRange(date, min, max)) {
                    date = null;
                }
                that._value = date;
                that.dateView.value(date);
                that.element.val(date ? kendo.toString(date, options.format, options.culture) : value);
                that._updateARIA(date);
                return date;
            },
            _wrapper: function () {
                var that = this, element = that.element, wrapper;
                wrapper = element.parents('.k-datepicker');
                if (!wrapper[0]) {
                    wrapper = element.wrap(SPAN).parent().addClass('k-picker-wrap k-state-default');
                    wrapper = wrapper.wrap(SPAN).parent();
                }
                wrapper[0].style.cssText = element[0].style.cssText;
                element.css({
                    width: '100%',
                    height: element[0].style.height
                });
                that.wrapper = wrapper.addClass('k-widget k-datepicker k-header').addClass(element[0].className);
                that._inputWrapper = $(wrapper[0].firstChild);
            },
            _reset: function () {
                var that = this, element = that.element, formId = element.attr('form'), form = formId ? $('#' + formId) : element.closest('form');
                if (form[0]) {
                    that._resetHandler = function () {
                        that.value(element[0].defaultValue);
                        that.max(that._initialOptions.max);
                        that.min(that._initialOptions.min);
                    };
                    that._form = form.on('reset', that._resetHandler);
                }
            },
            _template: function () {
                this._ariaTemplate = template(this.options.ARIATemplate);
            },
            _updateARIA: function (date) {
                var cell;
                var that = this;
                var calendar = that.dateView.calendar;
                that.element.removeAttr('aria-activedescendant');
                if (calendar) {
                    cell = calendar._cell;
                    cell.attr('aria-label', that._ariaTemplate({ current: date || calendar.current() }));
                    that.element.attr('aria-activedescendant', cell.attr('id'));
                }
            }
        });
        ui.plugin(DatePicker);
    }(window.kendo.jQuery));
    return window.kendo;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));
(function (f, define) {
    define('kendo.Calendar', ['kendo.core'], f);
}(function () {
    var __meta__ = {
        id: 'calendar',
        name: 'Calendar',
        category: 'web',
        description: 'The Calendar widget renders a graphical calendar that supports navigation and selection.',
        depends: ['core']
    };
    (function ($, undefined) {
        var kendo = window.kendo, support = kendo.support, ui = kendo.ui, Widget = ui.Widget, keys = kendo.keys, parse = kendo.parseDate, adjustDST = kendo.date.adjustDST, extractFormat = kendo._extractFormat, template = kendo.template, getCulture = kendo.getCulture, transitions = kendo.support.transitions, transitionOrigin = transitions ? transitions.css + 'transform-origin' : '', cellTemplate = template('<td#=data.cssClass# role="gridcell"><a tabindex="-1" class="k-link" href="\\#" data-#=data.ns#value="#=data.dateString#">#=data.value#</a></td>', { useWithBlock: false }), emptyCellTemplate = template('<td role="gridcell">&nbsp;</td>', { useWithBlock: false }), browser = kendo.support.browser, isIE8 = browser.msie && browser.version < 9, ns = '.kendoCalendar', CLICK = 'click' + ns, KEYDOWN_NS = 'keydown' + ns, ID = 'id', MIN = 'min', LEFT = 'left', SLIDE = 'slideIn', MONTH = 'month', CENTURY = 'century', CHANGE = 'change', NAVIGATE = 'navigate', VALUE = 'value', HOVER = 'k-state-hover', DISABLED = 'k-state-disabled', FOCUSED = 'k-state-focused', OTHERMONTH = 'k-other-month', OTHERMONTHCLASS = ' class="' + OTHERMONTH + '"', TODAY = 'k-nav-today', CELLSELECTOR = 'td:has(.k-link)', BLUR = 'blur' + ns, FOCUS = 'focus', FOCUS_WITH_NS = FOCUS + ns, MOUSEENTER = support.touch ? 'touchstart' : 'mouseenter', MOUSEENTER_WITH_NS = support.touch ? 'touchstart' + ns : 'mouseenter' + ns, MOUSELEAVE = support.touch ? 'touchend' + ns + ' touchmove' + ns : 'mouseleave' + ns, MS_PER_MINUTE = 60000, MS_PER_DAY = 86400000, PREVARROW = '_prevArrow', NEXTARROW = '_nextArrow', ARIA_DISABLED = 'aria-disabled', ARIA_SELECTED = 'aria-selected', proxy = $.proxy, extend = $.extend, DATE = Date, views = {
                month: 0,
                year: 1,
                decade: 2,
                century: 3
            };
        var Calendar = Widget.extend({
            init: function (element, options) {
                var that = this, value, id;
                Widget.fn.init.call(that, element, options);
                element = that.wrapper = that.element;
                options = that.options;
                options.url = window.unescape(options.url);
                that.options.disableDates = getDisabledExpr(that.options.disableDates);
                that._templates();
                that._header();
                that._footer(that.footer);
                id = element.addClass('k-widget k-calendar').on(MOUSEENTER_WITH_NS + ' ' + MOUSELEAVE, CELLSELECTOR, mousetoggle).on(KEYDOWN_NS, 'table.k-content', proxy(that._move, that)).on(CLICK, CELLSELECTOR, function (e) {
                    var link = e.currentTarget.firstChild, value = that._toDateObject(link);
                    if (link.href.indexOf('#') != -1) {
                        e.preventDefault();
                    }
                    if (that.options.disableDates(value) && that._view.name == 'month') {
                        return;
                    }
                    that._click($(link));
                }).on('mouseup' + ns, 'table.k-content, .k-footer', function () {
                    that._focusView(that.options.focusOnNav !== false);
                }).attr(ID);
                if (id) {
                    that._cellID = id + '_cell_selected';
                }
                normalize(options);
                value = parse(options.value, options.format, options.culture);
                that._index = views[options.start];
                that._current = new DATE(+restrictValue(value, options.min, options.max));
                that._addClassProxy = function () {
                    that._active = true;
                    if (that._cell.hasClass(DISABLED)) {
                        var todayString = that._view.toDateString(getToday());
                        that._cell = that._cellByDate(todayString);
                    }
                    that._cell.addClass(FOCUSED);
                };
                that._removeClassProxy = function () {
                    that._active = false;
                    that._cell.removeClass(FOCUSED);
                };
                that.value(value);
                kendo.notify(that);
            },
            options: {
                name: 'Calendar',
                value: null,
                min: new DATE(1900, 0, 1),
                max: new DATE(2099, 11, 31),
                dates: [],
                url: '',
                culture: '',
                footer: '',
                format: '',
                month: {},
                start: MONTH,
                depth: MONTH,
                animation: {
                    horizontal: {
                        effects: SLIDE,
                        reverse: true,
                        duration: 500,
                        divisor: 2
                    },
                    vertical: {
                        effects: 'zoomIn',
                        duration: 400
                    }
                }
            },
            events: [
                CHANGE,
                NAVIGATE
            ],
            setOptions: function (options) {
                var that = this;
                normalize(options);
                options.disableDates = getDisabledExpr(options.disableDates);
                Widget.fn.setOptions.call(that, options);
                that._templates();
                that._footer(that.footer);
                that._index = views[that.options.start];
                that.navigate();
            },
            destroy: function () {
                var that = this, today = that._today;
                that.element.off(ns);
                that._title.off(ns);
                that[PREVARROW].off(ns);
                that[NEXTARROW].off(ns);
                kendo.destroy(that._table);
                if (today) {
                    kendo.destroy(today.off(ns));
                }
                Widget.fn.destroy.call(that);
            },
            current: function () {
                return this._current;
            },
            view: function () {
                return this._view;
            },
            focus: function (table) {
                table = table || this._table;
                this._bindTable(table);
                table.focus();
            },
            min: function (value) {
                return this._option(MIN, value);
            },
            max: function (value) {
                return this._option('max', value);
            },
            navigateToPast: function () {
                this._navigate(PREVARROW, -1);
            },
            navigateToFuture: function () {
                this._navigate(NEXTARROW, 1);
            },
            navigateUp: function () {
                var that = this, index = that._index;
                if (that._title.hasClass(DISABLED)) {
                    return;
                }
                that.navigate(that._current, ++index);
            },
            navigateDown: function (value) {
                var that = this, index = that._index, depth = that.options.depth;
                if (!value) {
                    return;
                }
                if (index === views[depth]) {
                    if (!isEqualDate(that._value, that._current) || !isEqualDate(that._value, value)) {
                        that.value(value);
                        that.trigger(CHANGE);
                    }
                    return;
                }
                that.navigate(value, --index);
            },
            navigate: function (value, view) {
                view = isNaN(view) ? views[view] : view;
                var that = this, options = that.options, culture = options.culture, min = options.min, max = options.max, title = that._title, from = that._table, old = that._oldTable, selectedValue = that._value, currentValue = that._current, future = value && +value > +currentValue, vertical = view !== undefined && view !== that._index, to, currentView, compare, disabled;
                if (!value) {
                    value = currentValue;
                }
                that._current = value = new DATE(+restrictValue(value, min, max));
                if (view === undefined) {
                    view = that._index;
                } else {
                    that._index = view;
                }
                that._view = currentView = calendar.views[view];
                compare = currentView.compare;
                disabled = view === views[CENTURY];
                title.toggleClass(DISABLED, disabled).attr(ARIA_DISABLED, disabled);
                disabled = compare(value, min) < 1;
                that[PREVARROW].toggleClass(DISABLED, disabled).attr(ARIA_DISABLED, disabled);
                disabled = compare(value, max) > -1;
                that[NEXTARROW].toggleClass(DISABLED, disabled).attr(ARIA_DISABLED, disabled);
                if (from && old && old.data('animating')) {
                    old.kendoStop(true, true);
                    from.kendoStop(true, true);
                }
                that._oldTable = from;
                if (!from || that._changeView) {
                    title.html(currentView.title(value, min, max, culture));
                    that._table = to = $(currentView.content(extend({
                        min: min,
                        max: max,
                        date: value,
                        url: options.url,
                        dates: options.dates,
                        format: options.format,
                        culture: culture,
                        disableDates: options.disableDates
                    }, that[currentView.name])));
                    makeUnselectable(to);
                    var replace = from && from.data('start') === to.data('start');
                    that._animate({
                        from: from,
                        to: to,
                        vertical: vertical,
                        future: future,
                        replace: replace
                    });
                    that.trigger(NAVIGATE);
                    that._focus(value);
                }
                if (view === views[options.depth] && selectedValue && !that.options.disableDates(selectedValue)) {
                    that._class('k-state-selected', selectedValue);
                }
                that._class(FOCUSED, value);
                if (!from && that._cell) {
                    that._cell.removeClass(FOCUSED);
                }
                that._changeView = true;
            },
            value: function (value) {
                var that = this, view = that._view, options = that.options, old = that._view, min = options.min, max = options.max;
                if (value === undefined) {
                    return that._value;
                }
                if (value === null) {
                    that._current = new Date(that._current.getFullYear(), that._current.getMonth(), that._current.getDate());
                }
                value = parse(value, options.format, options.culture);
                if (value !== null) {
                    value = new DATE(+value);
                    if (!isInRange(value, min, max)) {
                        value = null;
                    }
                }
                if (value === null || !that.options.disableDates(value)) {
                    that._value = value;
                } else if (that._value === undefined) {
                    that._value = null;
                }
                if (old && value === null && that._cell) {
                    that._cell.removeClass('k-state-selected');
                } else {
                    that._changeView = !value || view && view.compare(value, that._current) !== 0;
                    that.navigate(value);
                }
            },
            _move: function (e) {
                var that = this, options = that.options, key = e.keyCode, view = that._view, index = that._index, min = that.options.min, max = that.options.max, currentValue = new DATE(+that._current), isRtl = kendo.support.isRtl(that.wrapper), isDisabled = that.options.disableDates, value, prevent, method, temp;
                if (e.target === that._table[0]) {
                    that._active = true;
                }
                if (e.ctrlKey) {
                    if (key == keys.RIGHT && !isRtl || key == keys.LEFT && isRtl) {
                        that.navigateToFuture();
                        prevent = true;
                    } else if (key == keys.LEFT && !isRtl || key == keys.RIGHT && isRtl) {
                        that.navigateToPast();
                        prevent = true;
                    } else if (key == keys.UP) {
                        that.navigateUp();
                        prevent = true;
                    } else if (key == keys.DOWN) {
                        that._click($(that._cell[0].firstChild));
                        prevent = true;
                    }
                } else {
                    if (key == keys.RIGHT && !isRtl || key == keys.LEFT && isRtl) {
                        value = 1;
                        prevent = true;
                    } else if (key == keys.LEFT && !isRtl || key == keys.RIGHT && isRtl) {
                        value = -1;
                        prevent = true;
                    } else if (key == keys.UP) {
                        value = index === 0 ? -7 : -4;
                        prevent = true;
                    } else if (key == keys.DOWN) {
                        value = index === 0 ? 7 : 4;
                        prevent = true;
                    } else if (key == keys.ENTER) {
                        that._click($(that._cell[0].firstChild));
                        prevent = true;
                    } else if (key == keys.HOME || key == keys.END) {
                        method = key == keys.HOME ? 'first' : 'last';
                        temp = view[method](currentValue);
                        currentValue = new DATE(temp.getFullYear(), temp.getMonth(), temp.getDate(), currentValue.getHours(), currentValue.getMinutes(), currentValue.getSeconds(), currentValue.getMilliseconds());
                        prevent = true;
                    } else if (key == keys.PAGEUP) {
                        prevent = true;
                        that.navigateToPast();
                    } else if (key == keys.PAGEDOWN) {
                        prevent = true;
                        that.navigateToFuture();
                    }
                    if (value || method) {
                        if (!method) {
                            view.setDate(currentValue, value);
                        }
                        if (isDisabled(currentValue)) {
                            currentValue = that._nextNavigatable(currentValue, value);
                        }
                        if (isInRange(currentValue, min, max)) {
                            that._focus(restrictValue(currentValue, options.min, options.max));
                        }
                    }
                }
                if (prevent) {
                    e.preventDefault();
                }
                return that._current;
            },
            _nextNavigatable: function (currentValue, value) {
                var that = this, disabled = true, view = that._view, min = that.options.min, max = that.options.max, isDisabled = that.options.disableDates, navigatableDate = new Date(currentValue.getTime());
                view.setDate(navigatableDate, -value);
                while (disabled) {
                    view.setDate(currentValue, value);
                    if (!isInRange(currentValue, min, max)) {
                        currentValue = navigatableDate;
                        break;
                    }
                    disabled = isDisabled(currentValue);
                }
                return currentValue;
            },
            _animate: function (options) {
                var that = this, from = options.from, to = options.to, active = that._active;
                if (!from) {
                    to.insertAfter(that.element[0].firstChild);
                    that._bindTable(to);
                } else if (from.parent().data('animating')) {
                    from.off(ns);
                    from.parent().kendoStop(true, true).remove();
                    from.remove();
                    to.insertAfter(that.element[0].firstChild);
                    that._focusView(active);
                } else if (!from.is(':visible') || that.options.animation === false || options.replace) {
                    to.insertAfter(from);
                    from.off(ns).remove();
                    that._focusView(active);
                } else {
                    that[options.vertical ? '_vertical' : '_horizontal'](from, to, options.future);
                }
            },
            _horizontal: function (from, to, future) {
                var that = this, active = that._active, horizontal = that.options.animation.horizontal, effects = horizontal.effects, viewWidth = from.outerWidth();
                if (effects && effects.indexOf(SLIDE) != -1) {
                    from.add(to).css({ width: viewWidth });
                    from.wrap('<div/>');
                    that._focusView(active, from);
                    from.parent().css({
                        position: 'relative',
                        width: viewWidth * 2,
                        'float': LEFT,
                        'margin-left': future ? 0 : -viewWidth
                    });
                    to[future ? 'insertAfter' : 'insertBefore'](from);
                    extend(horizontal, {
                        effects: SLIDE + ':' + (future ? 'right' : LEFT),
                        complete: function () {
                            from.off(ns).remove();
                            that._oldTable = null;
                            to.unwrap();
                            that._focusView(active);
                        }
                    });
                    from.parent().kendoStop(true, true).kendoAnimate(horizontal);
                }
            },
            _vertical: function (from, to) {
                var that = this, vertical = that.options.animation.vertical, effects = vertical.effects, active = that._active, cell, position;
                if (effects && effects.indexOf('zoom') != -1) {
                    to.css({
                        position: 'absolute',
                        top: from.prev().outerHeight(),
                        left: 0
                    }).insertBefore(from);
                    if (transitionOrigin) {
                        cell = that._cellByDate(that._view.toDateString(that._current));
                        position = cell.position();
                        position = position.left + parseInt(cell.width() / 2, 10) + 'px' + ' ' + (position.top + parseInt(cell.height() / 2, 10) + 'px');
                        to.css(transitionOrigin, position);
                    }
                    from.kendoStop(true, true).kendoAnimate({
                        effects: 'fadeOut',
                        duration: 600,
                        complete: function () {
                            from.off(ns).remove();
                            that._oldTable = null;
                            to.css({
                                position: 'static',
                                top: 0,
                                left: 0
                            });
                            that._focusView(active);
                        }
                    });
                    to.kendoStop(true, true).kendoAnimate(vertical);
                }
            },
            _cellByDate: function (value) {
                return this._table.find('td:not(.' + OTHERMONTH + ')').filter(function () {
                    return $(this.firstChild).attr(kendo.attr(VALUE)) === value;
                });
            },
            _class: function (className, date) {
                var that = this, id = that._cellID, cell = that._cell, value = that._view.toDateString(date), disabledDate;
                if (cell) {
                    cell.removeAttr(ARIA_SELECTED).removeAttr('aria-label').removeAttr(ID);
                }
                if (date) {
                    disabledDate = that.options.disableDates(date);
                }
                cell = that._table.find('td:not(.' + OTHERMONTH + ')').removeClass(className).filter(function () {
                    return $(this.firstChild).attr(kendo.attr(VALUE)) === value;
                }).attr(ARIA_SELECTED, true);
                if (className === FOCUSED && !that._active && that.options.focusOnNav !== false || disabledDate) {
                    className = '';
                }
                cell.addClass(className);
                if (cell[0]) {
                    that._cell = cell;
                }
                if (id) {
                    cell.attr(ID, id);
                    that._table.removeAttr('aria-activedescendant').attr('aria-activedescendant', id);
                }
            },
            _bindTable: function (table) {
                table.on(FOCUS_WITH_NS, this._addClassProxy).on(BLUR, this._removeClassProxy);
            },
            _click: function (link) {
                var that = this, options = that.options, currentValue = new Date(+that._current), value = that._toDateObject(link);
                adjustDST(value, 0);
                if (that.options.disableDates(value) && that._view.name == 'month') {
                    value = that._value;
                }
                that._view.setDate(currentValue, value);
                that.navigateDown(restrictValue(currentValue, options.min, options.max));
            },
            _focus: function (value) {
                var that = this, view = that._view;
                if (view.compare(value, that._current) !== 0) {
                    that.navigate(value);
                } else {
                    that._current = value;
                    that._class(FOCUSED, value);
                }
            },
            _focusView: function (active, table) {
                if (active) {
                    this.focus(table);
                }
            },
            _footer: function (template) {
                var that = this, today = getToday(), element = that.element, footer = element.find('.k-footer');
                if (!template) {
                    that._toggle(false);
                    footer.hide();
                    return;
                }
                if (!footer[0]) {
                    footer = $('<div class="k-footer"><a href="#" class="k-link k-nav-today"></a></div>').appendTo(element);
                }
                that._today = footer.show().find('.k-link').html(template(today)).attr('title', kendo.toString(today, 'D', that.options.culture));
                that._toggle();
            },
            _header: function () {
                var that = this, element = that.element, links;
                if (!element.find('.k-header')[0]) {
                    element.html('<div class="k-header">' + '<a href="#" role="button" class="k-link k-nav-prev"><span class="k-icon k-i-arrow-w"></span></a>' + '<a href="#" role="button" aria-live="assertive" aria-atomic="true" class="k-link k-nav-fast"></a>' + '<a href="#" role="button" class="k-link k-nav-next"><span class="k-icon k-i-arrow-e"></span></a>' + '</div>');
                }
                links = element.find('.k-link').on(MOUSEENTER_WITH_NS + ' ' + MOUSELEAVE + ' ' + FOCUS_WITH_NS + ' ' + BLUR, mousetoggle).click(false);
                that._title = links.eq(1).on(CLICK, function () {
                    that._active = that.options.focusOnNav !== false;
                    that.navigateUp();
                });
                that[PREVARROW] = links.eq(0).on(CLICK, function () {
                    that._active = that.options.focusOnNav !== false;
                    that.navigateToPast();
                });
                that[NEXTARROW] = links.eq(2).on(CLICK, function () {
                    that._active = that.options.focusOnNav !== false;
                    that.navigateToFuture();
                });
            },
            _navigate: function (arrow, modifier) {
                var that = this, index = that._index + 1, currentValue = new DATE(+that._current);
                arrow = that[arrow];
                if (!arrow.hasClass(DISABLED)) {
                    if (index > 3) {
                        currentValue.setFullYear(currentValue.getFullYear() + 100 * modifier);
                    } else {
                        calendar.views[index].setDate(currentValue, modifier);
                    }
                    that.navigate(currentValue);
                }
            },
            _option: function (option, value) {
                var that = this, options = that.options, currentValue = that._value || that._current, isBigger;
                if (value === undefined) {
                    return options[option];
                }
                value = parse(value, options.format, options.culture);
                if (!value) {
                    return;
                }
                options[option] = new DATE(+value);
                if (option === MIN) {
                    isBigger = value > currentValue;
                } else {
                    isBigger = currentValue > value;
                }
                if (isBigger || isEqualMonth(currentValue, value)) {
                    if (isBigger) {
                        that._value = null;
                    }
                    that._changeView = true;
                }
                if (!that._changeView) {
                    that._changeView = !!(options.month.content || options.month.empty);
                }
                that.navigate(that._value);
                that._toggle();
            },
            _toggle: function (toggle) {
                var that = this, options = that.options, isTodayDisabled = that.options.disableDates(getToday()), link = that._today;
                if (toggle === undefined) {
                    toggle = isInRange(getToday(), options.min, options.max);
                }
                if (link) {
                    link.off(CLICK);
                    if (toggle && !isTodayDisabled) {
                        link.addClass(TODAY).removeClass(DISABLED).on(CLICK, proxy(that._todayClick, that));
                    } else {
                        link.removeClass(TODAY).addClass(DISABLED).on(CLICK, prevent);
                    }
                }
            },
            _todayClick: function (e) {
                var that = this, depth = views[that.options.depth], disabled = that.options.disableDates, today = getToday();
                e.preventDefault();
                if (disabled(today)) {
                    return;
                }
                if (that._view.compare(that._current, today) === 0 && that._index == depth) {
                    that._changeView = false;
                }
                that._value = today;
                that.navigate(today, depth);
                that.trigger(CHANGE);
            },
            _toDateObject: function (link) {
                var value = $(link).attr(kendo.attr(VALUE)).split('/');
                value = new DATE(value[0], value[1], value[2]);
                return value;
            },
            _templates: function () {
                var that = this, options = that.options, footer = options.footer, month = options.month, content = month.content, empty = month.empty;
                that.month = {
                    content: template('<td#=data.cssClass# role="gridcell"><a tabindex="-1" class="k-link#=data.linkClass#" href="#=data.url#" ' + kendo.attr('value') + '="#=data.dateString#" title="#=data.title#">' + (content || '#=data.value#') + '</a></td>', { useWithBlock: !!content }),
                    empty: template('<td role="gridcell">' + (empty || '&nbsp;') + '</td>', { useWithBlock: !!empty })
                };
                that.footer = footer !== false ? template(footer || '#= kendo.toString(data,"D","' + options.culture + '") #', { useWithBlock: false }) : null;
            }
        });
        ui.plugin(Calendar);
        var calendar = {
            firstDayOfMonth: function (date) {
                return new DATE(date.getFullYear(), date.getMonth(), 1);
            },
            firstVisibleDay: function (date, calendarInfo) {
                calendarInfo = calendarInfo || kendo.culture().calendar;
                var firstDay = calendarInfo.firstDay, firstVisibleDay = new DATE(date.getFullYear(), date.getMonth(), 0, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
                while (firstVisibleDay.getDay() != firstDay) {
                    calendar.setTime(firstVisibleDay, -1 * MS_PER_DAY);
                }
                return firstVisibleDay;
            },
            setTime: function (date, time) {
                var tzOffsetBefore = date.getTimezoneOffset(), resultDATE = new DATE(date.getTime() + time), tzOffsetDiff = resultDATE.getTimezoneOffset() - tzOffsetBefore;
                date.setTime(resultDATE.getTime() + tzOffsetDiff * MS_PER_MINUTE);
            },
            views: [
                {
                    name: MONTH,
                    title: function (date, min, max, culture) {
                        return getCalendarInfo(culture).months.names[date.getMonth()] + ' ' + date.getFullYear();
                    },
                    content: function (options) {
                        var that = this, idx = 0, min = options.min, max = options.max, date = options.date, dates = options.dates, format = options.format, culture = options.culture, navigateUrl = options.url, hasUrl = navigateUrl && dates[0], currentCalendar = getCalendarInfo(culture), firstDayIdx = currentCalendar.firstDay, days = currentCalendar.days, names = shiftArray(days.names, firstDayIdx), shortNames = shiftArray(days.namesShort, firstDayIdx), start = calendar.firstVisibleDay(date, currentCalendar), firstDayOfMonth = that.first(date), lastDayOfMonth = that.last(date), toDateString = that.toDateString, today = new DATE(), html = '<table tabindex="0" role="grid" class="k-content" cellspacing="0" data-start="' + toDateString(start) + '"><thead><tr role="row">';
                        for (; idx < 7; idx++) {
                            html += '<th scope="col" title="' + names[idx] + '">' + shortNames[idx] + '</th>';
                        }
                        today = new DATE(today.getFullYear(), today.getMonth(), today.getDate());
                        adjustDST(today, 0);
                        today = +today;
                        return view({
                            cells: 42,
                            perRow: 7,
                            html: html += '</tr></thead><tbody><tr role="row">',
                            start: start,
                            min: new DATE(min.getFullYear(), min.getMonth(), min.getDate()),
                            max: new DATE(max.getFullYear(), max.getMonth(), max.getDate()),
                            content: options.content,
                            empty: options.empty,
                            setter: that.setDate,
                            disableDates: options.disableDates,
                            build: function (date, idx, disableDates) {
                                var cssClass = [], day = date.getDay(), linkClass = '', url = '#';
                                if (date < firstDayOfMonth || date > lastDayOfMonth) {
                                    cssClass.push(OTHERMONTH);
                                }
                                if (disableDates(date)) {
                                    cssClass.push(DISABLED);
                                }
                                if (+date === today) {
                                    cssClass.push('k-today');
                                }
                                if (day === 0 || day === 6) {
                                    cssClass.push('k-weekend');
                                }
                                if (hasUrl && inArray(+date, dates)) {
                                    url = navigateUrl.replace('{0}', kendo.toString(date, format, culture));
                                    linkClass = ' k-action-link';
                                }
                                return {
                                    date: date,
                                    dates: dates,
                                    ns: kendo.ns,
                                    title: kendo.toString(date, 'D', culture),
                                    value: date.getDate(),
                                    dateString: toDateString(date),
                                    cssClass: cssClass[0] ? ' class="' + cssClass.join(' ') + '"' : '',
                                    linkClass: linkClass,
                                    url: url
                                };
                            }
                        });
                    },
                    first: function (date) {
                        return calendar.firstDayOfMonth(date);
                    },
                    last: function (date) {
                        var last = new DATE(date.getFullYear(), date.getMonth() + 1, 0), first = calendar.firstDayOfMonth(date), timeOffset = Math.abs(last.getTimezoneOffset() - first.getTimezoneOffset());
                        if (timeOffset) {
                            last.setHours(first.getHours() + timeOffset / 60);
                        }
                        return last;
                    },
                    compare: function (date1, date2) {
                        var result, month1 = date1.getMonth(), year1 = date1.getFullYear(), month2 = date2.getMonth(), year2 = date2.getFullYear();
                        if (year1 > year2) {
                            result = 1;
                        } else if (year1 < year2) {
                            result = -1;
                        } else {
                            result = month1 == month2 ? 0 : month1 > month2 ? 1 : -1;
                        }
                        return result;
                    },
                    setDate: function (date, value) {
                        var hours = date.getHours();
                        if (value instanceof DATE) {
                            date.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
                        } else {
                            calendar.setTime(date, value * MS_PER_DAY);
                        }
                        adjustDST(date, hours);
                    },
                    toDateString: function (date) {
                        return date.getFullYear() + '/' + date.getMonth() + '/' + date.getDate();
                    }
                },
                {
                    name: 'year',
                    title: function (date) {
                        return date.getFullYear();
                    },
                    content: function (options) {
                        var namesAbbr = getCalendarInfo(options.culture).months.namesAbbr, toDateString = this.toDateString, min = options.min, max = options.max;
                        return view({
                            min: new DATE(min.getFullYear(), min.getMonth(), 1),
                            max: new DATE(max.getFullYear(), max.getMonth(), 1),
                            start: new DATE(options.date.getFullYear(), 0, 1),
                            setter: this.setDate,
                            build: function (date) {
                                return {
                                    value: namesAbbr[date.getMonth()],
                                    ns: kendo.ns,
                                    dateString: toDateString(date),
                                    cssClass: ''
                                };
                            }
                        });
                    },
                    first: function (date) {
                        return new DATE(date.getFullYear(), 0, date.getDate());
                    },
                    last: function (date) {
                        return new DATE(date.getFullYear(), 11, date.getDate());
                    },
                    compare: function (date1, date2) {
                        return compare(date1, date2);
                    },
                    setDate: function (date, value) {
                        var month, hours = date.getHours();
                        if (value instanceof DATE) {
                            month = value.getMonth();
                            date.setFullYear(value.getFullYear(), month, date.getDate());
                            if (month !== date.getMonth()) {
                                date.setDate(0);
                            }
                        } else {
                            month = date.getMonth() + value;
                            date.setMonth(month);
                            if (month > 11) {
                                month -= 12;
                            }
                            if (month > 0 && date.getMonth() != month) {
                                date.setDate(0);
                            }
                        }
                        adjustDST(date, hours);
                    },
                    toDateString: function (date) {
                        return date.getFullYear() + '/' + date.getMonth() + '/1';
                    }
                },
                {
                    name: 'decade',
                    title: function (date, min, max) {
                        return title(date, min, max, 10);
                    },
                    content: function (options) {
                        var year = options.date.getFullYear(), toDateString = this.toDateString;
                        return view({
                            start: new DATE(year - year % 10 - 1, 0, 1),
                            min: new DATE(options.min.getFullYear(), 0, 1),
                            max: new DATE(options.max.getFullYear(), 0, 1),
                            setter: this.setDate,
                            build: function (date, idx) {
                                return {
                                    value: date.getFullYear(),
                                    ns: kendo.ns,
                                    dateString: toDateString(date),
                                    cssClass: idx === 0 || idx == 11 ? OTHERMONTHCLASS : ''
                                };
                            }
                        });
                    },
                    first: function (date) {
                        var year = date.getFullYear();
                        return new DATE(year - year % 10, date.getMonth(), date.getDate());
                    },
                    last: function (date) {
                        var year = date.getFullYear();
                        return new DATE(year - year % 10 + 9, date.getMonth(), date.getDate());
                    },
                    compare: function (date1, date2) {
                        return compare(date1, date2, 10);
                    },
                    setDate: function (date, value) {
                        setDate(date, value, 1);
                    },
                    toDateString: function (date) {
                        return date.getFullYear() + '/0/1';
                    }
                },
                {
                    name: CENTURY,
                    title: function (date, min, max) {
                        return title(date, min, max, 100);
                    },
                    content: function (options) {
                        var year = options.date.getFullYear(), min = options.min.getFullYear(), max = options.max.getFullYear(), toDateString = this.toDateString, minYear = min, maxYear = max;
                        minYear = minYear - minYear % 10;
                        maxYear = maxYear - maxYear % 10;
                        if (maxYear - minYear < 10) {
                            maxYear = minYear + 9;
                        }
                        return view({
                            start: new DATE(year - year % 100 - 10, 0, 1),
                            min: new DATE(minYear, 0, 1),
                            max: new DATE(maxYear, 0, 1),
                            setter: this.setDate,
                            build: function (date, idx) {
                                var start = date.getFullYear(), end = start + 9;
                                if (start < min) {
                                    start = min;
                                }
                                if (end > max) {
                                    end = max;
                                }
                                return {
                                    ns: kendo.ns,
                                    value: start + ' - ' + end,
                                    dateString: toDateString(date),
                                    cssClass: idx === 0 || idx == 11 ? OTHERMONTHCLASS : ''
                                };
                            }
                        });
                    },
                    first: function (date) {
                        var year = date.getFullYear();
                        return new DATE(year - year % 100, date.getMonth(), date.getDate());
                    },
                    last: function (date) {
                        var year = date.getFullYear();
                        return new DATE(year - year % 100 + 99, date.getMonth(), date.getDate());
                    },
                    compare: function (date1, date2) {
                        return compare(date1, date2, 100);
                    },
                    setDate: function (date, value) {
                        setDate(date, value, 10);
                    },
                    toDateString: function (date) {
                        var year = date.getFullYear();
                        return year - year % 10 + '/0/1';
                    }
                }
            ]
        };
        function title(date, min, max, modular) {
            var start = date.getFullYear(), minYear = min.getFullYear(), maxYear = max.getFullYear(), end;
            start = start - start % modular;
            end = start + (modular - 1);
            if (start < minYear) {
                start = minYear;
            }
            if (end > maxYear) {
                end = maxYear;
            }
            return start + '-' + end;
        }
        function view(options) {
            var idx = 0, data, min = options.min, max = options.max, start = options.start, setter = options.setter, build = options.build, length = options.cells || 12, cellsPerRow = options.perRow || 4, content = options.content || cellTemplate, empty = options.empty || emptyCellTemplate, html = options.html || '<table tabindex="0" role="grid" class="k-content k-meta-view" cellspacing="0"><tbody><tr role="row">';
            for (; idx < length; idx++) {
                if (idx > 0 && idx % cellsPerRow === 0) {
                    html += '</tr><tr role="row">';
                }
                start = new DATE(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
                adjustDST(start, 0);
                data = build(start, idx, options.disableDates);
                html += isInRange(start, min, max) ? content(data) : empty(data);
                setter(start, 1);
            }
            return html + '</tr></tbody></table>';
        }
        function compare(date1, date2, modifier) {
            var year1 = date1.getFullYear(), start = date2.getFullYear(), end = start, result = 0;
            if (modifier) {
                start = start - start % modifier;
                end = start - start % modifier + modifier - 1;
            }
            if (year1 > end) {
                result = 1;
            } else if (year1 < start) {
                result = -1;
            }
            return result;
        }
        function getToday() {
            var today = new DATE();
            return new DATE(today.getFullYear(), today.getMonth(), today.getDate());
        }
        function restrictValue(value, min, max) {
            var today = getToday();
            if (value) {
                today = new DATE(+value);
            }
            if (min > today) {
                today = new DATE(+min);
            } else if (max < today) {
                today = new DATE(+max);
            }
            return today;
        }
        function isInRange(date, min, max) {
            return +date >= +min && +date <= +max;
        }
        function shiftArray(array, idx) {
            return array.slice(idx).concat(array.slice(0, idx));
        }
        function setDate(date, value, multiplier) {
            value = value instanceof DATE ? value.getFullYear() : date.getFullYear() + multiplier * value;
            date.setFullYear(value);
        }
        function mousetoggle(e) {
            var disabled = $(this).hasClass('k-state-disabled');
            if (!disabled) {
                $(this).toggleClass(HOVER, MOUSEENTER.indexOf(e.type) > -1 || e.type == FOCUS);
            }
        }
        function prevent(e) {
            e.preventDefault();
        }
        function getCalendarInfo(culture) {
            return getCulture(culture).calendars.standard;
        }
        function normalize(options) {
            var start = views[options.start], depth = views[options.depth], culture = getCulture(options.culture);
            options.format = extractFormat(options.format || culture.calendars.standard.patterns.d);
            if (isNaN(start)) {
                start = 0;
                options.start = MONTH;
            }
            if (depth === undefined || depth > start) {
                options.depth = MONTH;
            }
            if (options.dates === null) {
                options.dates = [];
            }
        }
        function makeUnselectable(element) {
            if (isIE8) {
                element.find('*').attr('unselectable', 'on');
            }
        }
        function inArray(date, dates) {
            for (var i = 0, length = dates.length; i < length; i++) {
                if (date === +dates[i]) {
                    return true;
                }
            }
            return false;
        }
        function isEqualDatePart(value1, value2) {
            if (value1) {
                return value1.getFullYear() === value2.getFullYear() && value1.getMonth() === value2.getMonth() && value1.getDate() === value2.getDate();
            }
            return false;
        }
        function isEqualMonth(value1, value2) {
            if (value1) {
                return value1.getFullYear() === value2.getFullYear() && value1.getMonth() === value2.getMonth();
            }
            return false;
        }
        function getDisabledExpr(option) {
            if (kendo.isFunction(option)) {
                return option;
            }
            if ($.isArray(option)) {
                return createDisabledExpr(option);
            }
            return $.noop;
        }
        function convertDatesArray(dates) {
            var result = [];
            for (var i = 0; i < dates.length; i++) {
                result.push(dates[i].setHours(0, 0, 0, 0));
            }
            return result;
        }
        function createDisabledExpr(dates) {
            var body, callback, disabledDates = [], days = [
                    'su',
                    'mo',
                    'tu',
                    'we',
                    'th',
                    'fr',
                    'sa'
                ], searchExpression = 'if (found) {' + ' return true ' + '} else {' + 'return false' + '}';
            if (dates[0] instanceof DATE) {
                disabledDates = convertDatesArray(dates);
                body = 'var found = date && $.inArray(date.setHours(0, 0, 0, 0),[' + disabledDates + ']) > -1;' + searchExpression;
            } else {
                for (var i = 0; i < dates.length; i++) {
                    var day = dates[i].slice(0, 2).toLowerCase();
                    var index = $.inArray(day, days);
                    if (index > -1) {
                        disabledDates.push(index);
                    }
                }
                body = 'var found = date && $.inArray(date.getDay(),[' + disabledDates + ']) > -1;' + searchExpression;
            }
            callback = new Function('date', body);
            return callback;
        }
        function isEqualDate(oldValue, newValue) {
            if (oldValue instanceof Date && newValue instanceof Date) {
                oldValue = oldValue.getTime();
                newValue = newValue.getTime();
            }
            return oldValue === newValue;
        }
        calendar.isEqualDatePart = isEqualDatePart;
        calendar.makeUnselectable = makeUnselectable;
        calendar.restrictValue = restrictValue;
        calendar.isInRange = isInRange;
        calendar.normalize = normalize;
        calendar.viewsEnum = views;
        calendar.disabled = getDisabledExpr;
        kendo.calendar = calendar;
    }(window.kendo.jQuery));
    return window.kendo;
}, typeof define == 'function' && define.amd ? define : function (a1, a2, a3) {
    (a3 || a2)();
}));