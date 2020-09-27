// Created by @paidtofade in 2020
//
// If you find this indicator helpful, give me some love on twitter @paidtofade
//
// The following code is a derivative work of
// Dead Simple Reversal Points
// Assembled by BenTen at useThinkScript dot com
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

const meta = require("./tools/meta");
const predef = require("./tools/predef");
const p = require("./tools/plotting");

const MMA = require("./tools/MMA");
const MovingHigh = require("./tools/MovingHigh");
const MovingLow = require("./tools/MovingLow");
const trueRange = require("./tools/trueRange");

class p2fDeadSimpleReversal {
    init() {
        this.atrMovingAverage = MMA(100);
        
        this.nearTermHigh = MovingHigh(this.props.nearTerm);
        this.nearTermLow = MovingLow(this.props.nearTerm);
        
        this.longTermHigh = MovingHigh(this.props.longTerm);
        this.longTermLow = MovingLow(this.props.longTerm);
        
        this.longHighHistory = [];
        this.longLowHistory = [];
    }

    map(d, i, history) {
        if (!history.prior()) {
            return;
        }
        
        const atr = this.atrMovingAverage(trueRange(d, history.prior()));
        
        const nearHigh = this.nearTermHigh(d.high());
        const nearLow = this.nearTermLow(d.low());
        
        const longHigh = this.longTermHigh(d.high());
        const longLow = this.longTermLow(d.low());
        
        const longHighHistory = this.longHighHistory;
        const longLowHistory = this.longLowHistory;

        longHighHistory.push(longHigh);
        while (longHighHistory.length > 4) {
            longHighHistory.shift();
        }

        longLowHistory.push(longLow);
        while (longLowHistory.length > 4) {
            longLowHistory.shift();
        }
        
        const prior = history.prior();
        
        const c1 = prior.close() < prior.open() && d.close() > d.open();
        const c2 = d.close() > prior.open();
        const c3 = longLowHistory.some(x => x > nearLow);
        const buy = c1 && c2 && c3;
        
        const c4 = prior.close() > prior.open() && d.close() < d.open();
        const c5 = d.close() < prior.open();
        const c6 = longHighHistory.some(x => x < nearHigh);
        const sell = c4 && c5 && c6;
        
        return {
            buy: buy ? d.low() : undefined,
            sell: sell ? d.high() : undefined,
            atr: atr
        };
    }
}

function customPlotter(canvas, indicatorInstance, history) {
    
    for(let i = 1; i < history.data.length; i++) {
        const item = history.get(i);
        
        if (item.buy !== undefined || item.sell !== undefined) {
            
            const props = indicatorInstance.props;
            const prior = history.get(i - 1);
            
            const center = p.x.get(item);
            const left = p.x.between(p.x.get(prior), center, -0.5);
            const right = p.x.between(p.x.get(prior), center, 2.5);
            const height = item.atr / 5;
            
            let point = 0;
            let base = 0;
            let color = 0;
            
            if (item.buy !== undefined) {
                point = item.buy - height * 1.5;
                base = point - height;
                color = props.upColor;
            }
            
            if (item.sell !== undefined) {
                point = item.sell + height * 1.5;
                base = point + height;
                color = props.downColor;
            }

            
            // The triangle path
            const path = p.createPath();
            path.moveTo(left, base);
            path.lineTo(center, point);
            path.lineTo(right, base);
            path.lineTo(left, base);
            path.lineTo(center, point);
            
            // Draw the perimeter
            canvas.drawPath(
                path.end(),
                {
                    color: color,
                    width: 3,
                    opacity: props.opacity / 100.0
                });       

            canvas.drawLine(
                p.offset(center, base - (point - base)),
                p.offset(center, base),
                {
                    color: color,
                    relativeWidth: 1,
                    opacity: props.opacity / 100.0
                });
        }
    }
}

module.exports = {
    name: "p2f - Dead Simple Reversal",
    description: "p2f - Dead Simple Reversal",
    calculator: p2fDeadSimpleReversal,
    inputType: meta.InputType.BARS,
    params: {
        nearTerm: predef.paramSpecs.period(3),
        longTerm: predef.paramSpecs.period(50),
        upColor: predef.paramSpecs.color("cyan"),
        downColor: predef.paramSpecs.color("cyan"),
        opacity: predef.paramSpecs.number(100, 1, 0)
    },
    plotter: [
        predef.plotters.custom(customPlotter)
    ],
    tags: ["paidtofade"]
};

