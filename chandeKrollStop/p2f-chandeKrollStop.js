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
const MMA = require("./tools/MMA");
const trueRange = require("./tools/trueRange");
const MovingHigh = require("./tools/MovingHigh");
const MovingLow = require("./tools/MovingLow");

class chandeKrollStop {
    init() {
        this.highestPrice = MovingHigh(this.props.P);
        this.lowestPrice = MovingLow(this.props.P);
        this.atrMovingAverage = MMA(this.props.P);
        this.highestHighStop = MovingHigh(this.props.Q);
        this.highestLowStop = MovingLow(this.props.Q);
    }

    map(d, i, history) {
        const atr = this.atrMovingAverage(trueRange(d, history.prior()));
        const firstHighStop = this.highestPrice(d.high()) - (this.props.x * atr);
        const firstLowStop = this.lowestPrice(d.low()) + (this.props.x * atr);
        const stopShort = this.highestHighStop(firstHighStop);
        const stopLong = this.highestLowStop(firstLowStop);
        
        return {
            stopLong: stopLong,
            stopShort: stopShort
        };
    }
    
    filter(d, i) {
        return i > ((this.props.P + this.props.Q) - 2);
    }
}

module.exports = {
    name: "chandeKrollStop",
    description: "p2f - Chande Kroll Stop",
    calculator: chandeKrollStop,
    inputType: meta.InputType.BARS,
    tags: ['paidtofade'],
    params: {
        P: predef.paramSpecs.period(9),
        x: predef.paramSpecs.number(1.5, 0.1, 0),
        Q: predef.paramSpecs.period(15)
    },
    plots: {
        stopLong: { title: "Long Stop" },
        stopShort: { title: "Short Stop" }
    },
    schemeStyles: {
        dark: {
            stopLong: predef.styles.plot({
                color: "#33CC33",
                lineStyle: 3
            }),
            stopShort: predef.styles.plot({
                color: "#FF5050",
                lineStyle: 3
            })
        }
    }
};

