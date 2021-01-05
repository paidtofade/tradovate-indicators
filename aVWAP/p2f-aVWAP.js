// Created by @paidtofade in 2020 
//
// If you find this indicator helpful, give me some love on twitter @paidtofade
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

const predef = require("./tools/predef");
const meta = require("./tools/meta");
const typicalPrice = require("./tools/typicalPrice");

const DEBUG = false;

function print(obj) {
    if (DEBUG) {
        console.log(obj);
    }
}

function inspectObject(obj) {
    if (DEBUG) {
        for (let name in obj) {
            console.log(name + ' = ' + obj[name]);
        }
    }
}

class p2fvwap {
    init() {
        this.anchorDate = this.getAnchorDate();
        this.volumeSum = 0;
        this.volumePriceSum = 0;
        this.volumePrice2Sum = 0;
    }
    
    getAnchorDate() {
        const dateStr = this.props.anchorYear.substring(1)
            + "-" + this.props.anchorMonth.substring(1)
            + "-" + this.props.anchorDay.substring(1)
            + "T" + this.props.anchorHour.substring(1)
            + ":" + this.props.anchorMinute.substring(1)
            + ":00.000";
        
        return new Date(Date.parse(dateStr));
    }
    
    map(d, i, history) {
        
        if (d.date >= this.anchorDate) {
            const vol = d.volume();
            const tPrice = typicalPrice(d);
            
            this.volumeSum += vol;
            this.volumePriceSum += (vol * tPrice);
            this.volumePrice2Sum += (vol * Math.pow(tPrice, 2));
            
            const price = this.volumePriceSum / this.volumeSum;
            const deviation = Math.sqrt(Math.max(this.volumePrice2Sum / this.volumeSum - Math.pow(price, 2), 0));
            
            let upper = null;
            let lower = null;
            
            if (this.props.deviationChannel > 0) {
                const distance = this.props.deviationChannel * deviation;
                upper = price + distance;
                lower = price - distance;
            }
            
            return { 
                middle: price,
                upper: upper,
                lower: lower
            };
        }
    }
}

module.exports = {
    name: "p2fvwap",
    description: "p2f - Anchored VWAP",
    calculator: p2fvwap,
    inputType: meta.InputType.BARS,
    params: {
        anchorYear: predef.paramSpecs.enum({
            y1985: "1985", y1986: "1986", y1987: "1987", y1988: "1988", y1989: "1989", y1990: "1990", y1991: "1991", y1992: "1992", y1993: "1993", y1994: "1994", y1995: "1995", y1996: "1996", y1997: "1997", y1998: "1998", y1999: "1999", y2000: "2000", y2001: "2001", y2002: "2002", y2003: "2003", y2004: "2004", y2005: "2005", y2006: "2006", y2007: "2007", y2008: "2008", y2009: "2009", y2010: "2010", y2011: "2011", y2012: "2012", y2013: "2013", y2014: "2014", y2015: "2015", y2016: "2016", y2017: "2017", y2018: "2018", y2019: "2019", y2020: "2020", y2021: "2021", y2022: "2022", y2023: "2023", y2024: "2024", y2025: "2025", y2026: "2026", y2027: "2027", y2028: "2028", y2029: "2029", y2030: "2030", y2031: "2031", y2032: "2032", y2033: "2033", y2034: "2034", y2035: "2035", y2036: "2036", y2037: "2037", y2038: "2038", y2039: "2039", y2040: "2040", y2041: "2041", y2042: "2042", y2043: "2043", y2044: "2044", y2045: "2045", y2046: "2046", y2047: "2047", y2048: "2048", y2049: "2049", y2050: "2050", y2051: "2051", y2052: "2052", y2053: "2053", y2054: "2054", y2055: "2055"
        }, 'y2020'),
        anchorMonth: predef.paramSpecs.enum({
            m01: "01", m02: "02", m03: "03", m04: "04", m05: "05", m06: "06", m07: "07", m08: "08", m09: "09", m10: "10", m11: "11", m12: "12"
        }, 'm01'),
        anchorDay: predef.paramSpecs.enum({
            d01: "01", d02: "02", d03: "03", d04: "04", d05: "05", d06: "06", d07: "07", d08: "08", d09: "09", d10: "10", d11: "11", d12: "12", d13: "13", d14: "14", d15: "15", d16: "16", d17: "17", d18: "18", d19: "19", d20: "20", d21: "21", d22: "22", d23: "23", d24: "24", d25: "25", d26: "26", d27: "27", d28: "28", d29: "29", d30: "30", d31: "31"
        }, 'd01'),
        anchorHour: predef.paramSpecs.enum({
            h00: "00", h01: "01", h02: "02", h03: "03", h04: "04", h05: "05", h06: "06", h07: "07", h08: "08", h09: "09", h10: "10", h11: "11", h12: "12", h13: "13", h14: "14", h15: "15", h16: "16", h17: "17", h18: "18", h19: "19", h20: "20", h21: "21", h22: "22", h23: "23"
        }, 'h00'),
        anchorMinute: predef.paramSpecs.enum({
            m00: "00", m01: "01", m02: "02", m03: "03", m04: "04", m05: "05", m06: "06", m07: "07", m08: "08", m09: "09", m10: "10", m11: "11", m12: "12", m13: "13", m14: "14", m15: "15", m16: "16", m17: "17", m18: "18", m19: "19", m20: "20", m21: "21", m22: "22", m23: "23", m24: "24", m25: "25", m26: "26", m27: "27", m28: "28", m29: "29", m30: "30", m31: "31", m32: "32", m33: "33", m34: "34", m35: "35", m36: "36", m37: "37", m38: "38", m39: "39", m40: "40", m41: "41", m42: "42", m43: "43", m44: "44", m45: "45", m46: "46", m47: "47", m48: "48", m49: "49", m50: "50", m51: "51", m52: "52", m53: "53", m54: "54", m55: "55", m56: "56", m57: "57", m58: "58", m59: "59"
        }, 'm00'),
        deviationChannel: predef.paramSpecs.number(2, 0.1, 0)
    },
    plots: {
        middle: { title: "Middle 2" },
        upper: { title: "Upper" },
        lower: { title: "Lower" }
    },
     plotter: [
        predef.plotters.singleline("middle"),
        predef.plotters.singleline("upper"),
        predef.plotters.singleline("lower")
    ],
    schemeStyles: {
        dark: {
            middle: predef.styles.plot({
                color: "#8cecff"
            }),
            upper: predef.styles.plot({
                color: "#ff5555"
            }),
            lower: predef.styles.plot({
                color: "#bbbbbb"
            }),
        }
    },
    tags: ["paidtofade", predef.tags.Channels]
};

