// Created by @paidtofade in 2020
//
// If you find this indicator helpful, give me some love on twitter @paidtofade
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

