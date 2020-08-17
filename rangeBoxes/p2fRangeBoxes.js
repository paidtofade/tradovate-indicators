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

const meta = require("./tools/meta");
const predef = require("./tools/predef");
const p = require("./tools/plotting");

const DEBUG = false;
const minuteMillis = 1000 * 60;
const hourMillis = minuteMillis * 60;

function inspectObject(obj) {
    if (DEBUG) {
        for (let name in obj) {
            console.log(name + ' = ' + obj[name]);
        }
    }
}

class p2fRangeBoxes {
    init() {
        this.timeInterval = minuteMillis * this.props.rangeMinutes;
        this.hourAlignOffset = this.getHourAlignOffset();
    }
    
    getHourAlignOffset() {
        const adjustedHour = this.props.alignToHour % 24;
        const d = new Date();
        const offsetDate = new Date(
            d.getFullYear(), d.getMonth(), d.getDate(),
            adjustedHour, 0, 0, 0);
            
        return offsetDate.getTime() - 1;
    }
    
    getRangeId(data) {
        return parseInt((data.date.getTime() - this.hourAlignOffset) / this.timeInterval);
    }

    map(d, i, history) {
        return {
            rangeId: this.getRangeId(d),
            open: d.open(),
            high: d.high(),
            low: d.low(),
            close: d.close()
        }
    }
}

function customPlotter(canvas, indicatorInstance, history) {
    const props = indicatorInstance.props;
    
    if (history.data.length === 0) {
        return;
    }
    
    const firstItem = history.get(0);
    let rangeId = firstItem.rangeId;
    let rangeStart = 0;
    let rangeOpen = firstItem.open;
    let rangeHigh = firstItem.high;
    let rangeLow = firstItem.low;
    let rangeClose = firstItem.close;
    
    for(let i = 1; i < history.data.length; i++) {
        
        const item = history.get(i);
        const next = history.get(i + 1);
        
        const isLastItem = !next;
        const isNewRange = rangeId !== item.rangeId;
        const isEndOfRange = 
            isLastItem || next.rangeId !== item.rangeId;
        
        
        // Debug statement
        if (isLastItem) {
            inspectObject(item);
        }
        
        // If new range, set new initial range info
        if (isNewRange) {
            rangeStart = i;
            rangeId = item.rangeId;
            
            rangeOpen = item.open;
            rangeHigh = item.high;
            rangeLow = item.low;
            rangeClose = item.close;
        
        // Otherwise in same range, just accumulate range info
        } else {
            rangeHigh = Math.max(rangeHigh, item.high);
            rangeLow = Math.min(rangeLow, item.low);
            rangeClose = item.close;
        }
        
        // If end of range or current bar, draw the last/current range
        if (isEndOfRange && rangeStart > 1) {
            
            let rangeEnd = i;
                        
            // Figure out the range color based on range direction
            const rangeColor = 
                rangeClose > rangeOpen ? props.upColor
                    : rangeClose < rangeOpen ? props.downColor
                    : props.flatColor;

            // Draw perimeter line
            let left = p.x.between(
                p.x.get(history.get(rangeStart - 1)),
                p.x.get(history.get(rangeStart)),
                0.55);

            let right = null;
            
            // If it's the last item, we have to do a strange bit
            // of math for the right box boundary, by using the distance
            // of the item *before* this one, and then moving it
            if (isLastItem) {
                right = p.x.between(
                    p.x.get(history.get(rangeEnd - 1)),
                    p.x.get(history.get(rangeEnd)),
                    1.45);
                    
            // But otherwise we just cut a line between this
            // item and the next one
            } else {
                right = p.x.between(
                    p.x.get(history.get(rangeEnd)),
                    p.x.get(history.get(rangeEnd + 1)),
                    0.45
                );
            }
            
            // The perimeter path
            const path = p.createPath();
            path.moveTo(left, rangeHigh);
            path.lineTo(left, rangeLow);
            path.lineTo(right, rangeLow);
            path.lineTo(right, rangeHigh);
            path.lineTo(left, rangeHigh);
            
            // Draw the perimeter
            canvas.drawPath(
                path.end(),
                {
                    color: rangeColor,
                    width: props.lineWidth,
                    opacity: props.lineOpacity / 100.0
                });
                
            // Fill in the range with color 
            for (let j = rangeStart; j < rangeEnd + 1; j++) {
                const x = p.x.get(history.get(j));
                
                canvas.drawLine(
                    p.offset(x, rangeHigh),
                    p.offset(x, rangeLow),
                    {
                        color: rangeColor,
                        relativeWidth: 1,
                        opacity: props.fillOpacity / 100.0
                    });
            }
        }
    }
}

function isDst() {
    const now = new Date();
    const jan = new Date(now.getFullYear(), 0, 1);
    const jul = new Date(now.getFullYear(), 6, 1);
    const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    const currOffset = now.getTimezoneOffset();
    return currOffset < stdOffset;
}

function getAlignToHourDefault() {
    const isDstNow = isDst();
    const tzOffsetHours = (new Date().getTimezoneOffset()) / 60;
    if (isDstNow && tzOffsetHours >= 4 && tzOffsetHours <= 7) {
        return 22 - tzOffsetHours;
    }
    if (!isDstNow && tzOffsetHours >= 5 && tzOffsetHours <=8) {
        return 23 - tzOffsetHours;
    }
    return 0;
}

module.exports = {
    name: "p2f - Overlay Range Boxes",
    description: "p2f - Overlay Range Boxes",
    calculator: p2fRangeBoxes,
    inputType: meta.InputType.BARS,
    params: {
        rangeMinutes: predef.paramSpecs.number(30, 1, 0),
        alignToHour: predef.paramSpecs.number(getAlignToHourDefault(), 1, 0),
        upColor: predef.paramSpecs.color("green"),
        downColor: predef.paramSpecs.color("red"),
        flatColor: predef.paramSpecs.color("gray"),
        fillOpacity: predef.paramSpecs.number(30, 1, 0),
        lineOpacity: predef.paramSpecs.number(100, 1, 0),
        lineWidth: predef.paramSpecs.number(1, 1, 0)
    },
    plotter: [
        predef.plotters.custom(customPlotter)
    ],
    tags: ["paidtofade"]
};

