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
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const predef = require("./tools/predef");
const meta = require("./tools/meta");
const medianPrice = require('./tools/medianPrice');
const MMA = require("./tools/MMA");
const trueRange = require("./tools/trueRange");

class p2fKamaBands {
    init() {
        this.atr = MMA(this.props.atrLength);
        this.erLength = this.props.efficiencyRatioLength;
        this.fastSf = 2.0 / (this.props.fastLength + 1);
        this.slowSf = 2.0 / (this.props.slowLength + 1);
        this.lastKama = undefined;
        
         // Choose what price type we're using
        switch (this.props.priceType) {
            case 'high':
                this.getPriceVal = (d) => d.high();
                break;
            case 'low':
                this.getPriceVal = (d) => d.low();
                break;
            case 'open':
                this.getPriceVal = (d) => d.open();
                break;
            case 'hl2':
                this.getPriceVal = (d) => medianPrice(d);
                break;
            case 'close':
            default:
                this.getPriceVal = (d) => d.close();
        }
    }
    
    sumDifferences(data) {
        let result = 0;
        for (let i = 1; i < data.length; i++) {
            result += Math.abs(this.getPriceVal(data[i]) - this.getPriceVal(data[i-1]));
        }
        return result;
    }

    map(d, i, history) {
        if (history.back(this.erLength) === undefined) {
            return;
        }
        
        const direction = this.getPriceVal(d) - this.getPriceVal(history.back(this.erLength));
        const vol = this.sumDifferences(history.data.slice(i - this.erLength, i + 1));
        const er = vol !== 0 ? Math.abs(direction / vol) : 0.000001;
        const ct = Math.pow((er * (this.fastSf - this.slowSf)) + this.slowSf, 2);

        if (this.lastKama === undefined) {
            this.lastKama = this.getPriceVal(history.prior());
        }
        
        const midLine = this.lastKama + (ct * (this.getPriceVal(d) - this.lastKama));
        this.lastKama = midLine;
        
        let offset = 0;
        switch (this.props.bandType) {
            case 'percent':
                offset = midLine * (this.props.bandMultiplier / 100.0);
                break;
            case 'ticks':
                offset = this.props.bandMultiplier * this.contractInfo.tickSize;
                break;
            case 'atr':
            default:
                offset = this.props.bandMultiplier * this.atr(trueRange(d, history.prior()));
                break;
        }
        
        return {
            middle: midLine,
            upper: midLine + offset,
            lower: midLine - offset
        }
    }
    
    filter(d, i) {
        return i > Math.max(
            this.props.fastLength, 
            this.props.slowLength, 
            this.erLength,
            this.bandType === 'atr' ? this.atrLength : 0);
    }
}

module.exports = {
    name: "p2fKamaBands",
    description: "p2f - KAMA Bands",
    calculator: p2fKamaBands,
    inputType: meta.InputType.BARS,
    params: {
        priceType: predef.paramSpecs.enum({
            high: 'High', 
            low: 'Low', 
            open: 'Open', 
            close: 'Close', 
            hl2: '(H+L)/2'
        }, 'close'),
        fastLength: predef.paramSpecs.period(2),
        slowLength: predef.paramSpecs.period(30),
        efficiencyRatioLength: predef.paramSpecs.period(10),
        atrLength: predef.paramSpecs.period(14),
        bandType: predef.paramSpecs.enum({
            atr: 'ATR',
            percent: 'Percent', 
            ticks: 'Ticks'
        }, 'atr'),
        bandMultiplier: predef.paramSpecs.number(2, 0.01, 0)
    },
    plots: {
        middle: { title: "Middle" },
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
                color: "green",
                lineWidth: 2
            }),
            lower: predef.styles.plot({
                color: "green",
                lineWidth: 2
            })
        }
    },
    tags: ["paidtofade", predef.tags.Channels]
};

