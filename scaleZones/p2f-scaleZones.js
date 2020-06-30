// Created by @paidtofade in 2020 
//
// The following code is a derivative work of Gary Markoski's
// Scale Zones indicator written for the Thinkorswim platform.
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
const p = require("./tools/plotting");

class p2fScaleZones {
    init() {
        this.lastCenter = null;
        this.expectedTimeDifference = null;
        this.boundaryTimeDifference = 1000 * 60 * 60 * 1; // 1 hour
        
        this.rangeAmounts = [
            this.props.rangeOneDistance,
            this.props.rangeTwoDistance,
            this.props.rangeThreeDistance,
            this.props.rangeFourDistance
        ];
        
        // Sort out range scale... could be a constant so just
        // calculate once. But "percent" will be based off of
        // the center, which could be changing.
        this.rangeScaler = null;
        switch (this.props.rangeScale) {
            case "percent":
            case "basis_pts":
                this.rangeScaler = this.props.rangeScale;
                break;
            case "ticks":
                this.rangeScaler = this.contractInfo.tickSize;
                break;
            default:
                this.rangeScaler = parseFloat(this.props.rangeScale);
        }
    }
    
    sumThrough(arr, index) {
        return arr.slice(0, index).reduce((a, b) => a + b);
    }
    
    timeDiff(dataA, dataB) {
        return dataA.date.getTime() - dataB.date.getTime();
    }
    
    getExpectedTimeDifference(history) {
        let result = null;
        for (let j = 1; j < 5; j++) {
            const diff = this.timeDiff(history.data[j], history.data[j-1]);
            if (!result || diff < result) {
                result = diff;
            }
        }
        return result;
    }

    map(d, i, history) {
        let center = this.props.manualCenter;
        
        // Auto detect based on prior close, but crucially
        // this close has to be in history
        if (!center) { 
            
            // Figure out what the expected time difference between
            // values should be
            if (!this.expectedTimeDifference) {
                this.expectedTimeDifference = this.getExpectedTimeDifference(history);
            }
            
            // We can only do anything more if we have the prior value
            if (!history.prior()) {
                return;
            }
            
            // Time difference between this value and the prior one is higher
            // than chosen time frame, assume prior one to be prior session close.
            if (this.timeDiff(d, history.prior()) > this.boundaryTimeDifference) {
                this.lastCenter = history.prior().value();
            }
            
            // Whatever the case, the current center is the most recent
            // one we've found.
            center = this.lastCenter;
        }
        
        // If for some reason we still don't have one, we're out
        if (!center) {
            return;
        }
        
        const distanceOne = this.sumThrough(this.rangeAmounts, 1);
        const distanceTwo = this.sumThrough(this.rangeAmounts, 2);
        const distanceThree = this.sumThrough(this.rangeAmounts, 3);
        const distanceFour = this.sumThrough(this.rangeAmounts, 4);
        
        let scaler = this.rangeScaler;
        
        // If not a number, implies a dynamic scale (i.e. percent based)
        if (isNaN(scaler)) {
            console.log(this.rangeScaler);
            if (this.rangeScaler === "percent") {
                scaler = center / 100.0;
            } else if (this.rangeScaler === "basis_pts") {
                scaler = center / 10000.0;
            }
        }
        
        return {
            center: center,
            upperRangeOne: center + (distanceOne * scaler),
            lowerRangeOne: center - (distanceOne * scaler),
            upperRangeTwo: center + (distanceTwo * scaler),
            lowerRangeTwo: center - (distanceTwo * scaler),
            upperRangeThree: center + (distanceThree * scaler),
            lowerRangeThree: center - (distanceThree * scaler),
            upperRangeFour: center + (distanceFour * scaler),
            lowerRangeFour: center - (distanceFour * scaler),
        }
    }
}

function customPlotter(canvas, indicatorInstance, history) {
    const props = indicatorInstance.props;
    const fillOpacity = props.opacity / 100.0;
    
    for(let i = 0; i < history.data.length; i++) {
        const item = history.get(i);

        if (item.center) {
            const x = p.x.get(item);

            // Range 1
            canvas.drawLine(
                p.offset(x, item.center),
                p.offset(x, item.upperRangeOne),
                {
                    color: props.rangeOneColor,
                    relativeWidth: 1,
                    opacity: fillOpacity
                });
            
            canvas.drawLine(
                p.offset(x, item.center),
                p.offset(x, item.lowerRangeOne),
                {
                    color: props.rangeOneColor,
                    relativeWidth: 1,
                    opacity: fillOpacity
                });
            
            // Range 2
            canvas.drawLine(
                p.offset(x, item.upperRangeOne),
                p.offset(x, item.upperRangeTwo),
                {
                    color: props.rangeTwoColor,
                    relativeWidth: 1,
                    opacity: fillOpacity
                });
            
            canvas.drawLine(
                p.offset(x, item.lowerRangeOne),
                p.offset(x, item.lowerRangeTwo),
                {
                    color: props.rangeTwoColor,
                    relativeWidth: 1,
                    opacity: fillOpacity
                });
    
            // Range 3
            canvas.drawLine(
                p.offset(x, item.upperRangeTwo),
                p.offset(x, item.upperRangeThree),
                {
                    color: props.rangeThreeColor,
                    relativeWidth: 1,
                    opacity: fillOpacity
                });
            
            canvas.drawLine(
                p.offset(x, item.lowerRangeTwo),
                p.offset(x, item.lowerRangeThree),
                {
                    color: props.rangeThreeColor,
                    relativeWidth: 1,
                    opacity: fillOpacity
                });
               
            // Range 4
            canvas.drawLine(
                p.offset(x, item.upperRangeThree),
                p.offset(x, item.upperRangeFour),
                {
                    color: props.rangeFourColor,
                    relativeWidth: 1,
                    opacity: fillOpacity
                });
            
            canvas.drawLine(
                p.offset(x, item.lowerRangeThree),
                p.offset(x, item.lowerRangeFour),
                {
                    color: props.rangeFourColor,
                    relativeWidth: 1,
                    opacity: fillOpacity
                });
        }
    }
}

module.exports = {
    name: "p2fScaleZones",
    description: "p2f - Scale Zones",
    calculator: p2fScaleZones,
    params: {
        rangeScale: predef.paramSpecs.enum({
            "1.0": "1",
            "0.1": "0.1",
            "0.01": "0.01",
            "0.001": "0.001",
            "0.0001": "0.0001",
            "ticks": "Ticks",
            "percent": "Percent",
            "basis_pts": "Basis Pts"
        }, "1.0"),
        rangeOneDistance: predef.paramSpecs.number(20, 1, 0),
        rangeTwoDistance: predef.paramSpecs.number(20, 1, 0),
        rangeThreeDistance: predef.paramSpecs.number(20, 1, 0),
        rangeFourDistance: predef.paramSpecs.number(40, 1, 0),
        rangeOneColor: predef.paramSpecs.color("red"),
        rangeTwoColor: predef.paramSpecs.color("yellow"),
        rangeThreeColor: predef.paramSpecs.color("green"),
        rangeFourColor: predef.paramSpecs.color("blue"),
        opacity: predef.paramSpecs.number(20, 1, 0), 
        manualCenter: predef.paramSpecs.number()
    },
    plots: {
        center: { title: "Center Line" }
    },
    plotter: [
        predef.plotters.singleline("center"),
        predef.plotters.custom(customPlotter)
    ],
    schemeStyles: {
        dark: {
            center: predef.styles.plot({
                color: "orange",
                lineWidth: 2,
                lineStyle: 3
            })
        }
    },
    tags: ["paidtofade"]
};

