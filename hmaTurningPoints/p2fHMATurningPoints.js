// Created by @paidtofade in 2021
// 
// If you find this indicator helpful, give me some love on twitter @paidtofade
//
// The following code is a derivative work of:
//
//      Hull Moving Average Concavity and Turning Points
//       or
//      The Second Derivative of the Hull Moving Average
//      
//      Author: Seth Urion (Mahsume)
//      Version: 2020-05-01 V4
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

const predef = require('./tools/predef');
const meta = require('./tools/meta');
const medianPrice = require('./tools/medianPrice');
const MMA = require("./tools/MMA");
const trueRange = require("./tools/trueRange");
const p = require("./tools/plotting")
const WMA = require("./tools/WMA");

class p2fHMATurningPoints {
    init() {
        this.atrMovingAverage = MMA(40);
        
        const period = this.props.period;
        this.wmaLong = WMA(period);
        this.wmaShort = WMA(period / 2);
        this.wmaSqrt = WMA(Math.sqrt(period));
        
        this.lookback = this.props.lookback;
        this.hmaHistory = [];
        this.concavity = 0;
        
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

    map(d, i, history) {
        
        const atr = this.atrMovingAverage(trueRange(d, history.prior()));
        
        const prior = history.prior();
        const r = this.round;
        
        // todo: offer varying price input
        const value = this.getPriceVal(d);
        const wmaLong = this.wmaLong(value);
        const wmaShort = this.wmaShort(value) * 2;
        const wmaDiff = wmaShort - wmaLong;
        const hma = this.wmaSqrt(wmaDiff);
        
        const hmaHistory = this.hmaHistory;
        
        let delta = null;
        let deltaPerBar = null;
        let nextBar = null;
        let turningPoint = null;
        let hmaColor = null;
        
        if (hmaHistory.length === (this.lookback + 1)) {
            
            const priorHma = hmaHistory[hmaHistory.length - 1];
            const priorConcavity = this.concavity;
            
            delta = priorHma - hmaHistory[0];
            deltaPerBar = (delta * 1.0) / this.lookback;
            nextBar = priorHma + deltaPerBar;
            this.concavity = hma > nextBar ? 1 : -1;
            if (priorConcavity != this.concavity) {
                turningPoint = hma;
            }
            
            if (priorConcavity === -1) {
                hmaColor = hma > priorHma ? 'DarkOrange' : 'Red';
            } else {
                hmaColor = hma < priorHma ? 'DarkGreen' : 'LimeGreen';
            }
        }
        
        hmaHistory.push(hma);
        while (hmaHistory.length > (this.lookback + 1)) {
            hmaHistory.shift();
        }

        return {
            atr: atr,
            hma: hma,
            color: hmaColor,
            turningPoint: turningPoint,
            sell: turningPoint && this.concavity === -1,
            buy: turningPoint && this.concavity === 1,
            high: d.high(),
            low: d.low()
        };
    }
    filter(d, i) {
        return i > this.props.period;
    }
}

function drawArrow(canvas, p, item, prior, arrowPoint, up, color) {
    const center = p.x.get(item);
    const left = p.x.between(p.x.get(prior), center, 0.7);
    const right = p.x.between(p.x.get(prior), center, 1.3);
    const height = item.atr / 12;
    
    let point = 0;
    let base = 0;
    
    if (up) {
        point = arrowPoint - height;
        base = point - height;
    } else {
        point = arrowPoint + height;
        base = point + height;
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
            opacity: 1
        });       

    canvas.drawLine(
        p.offset(center, base - (point - base)),
        p.offset(center, base),
        {
            color: color,
            width: 2,
            opacity: 1
        });
}

function trendPlotter(canvas, indicatorInstance, history) {
    
    for(let i = 1; i < history.data.length; i++) {
        
        const item = history.get(i);
        const prior = history.get(i-1);
        let next = null;
        if (i < history.data.length - 1) {
            next = history.get(i+1);
        }
        
        const x = p.x.get(item);
        const x1 = p.x.get(prior);
        
        canvas.drawLine(
            p.offset(x1, prior.hma),
            p.offset(x, item.hma),
            {
                color: item.color,
                width: 3,
                opacity: 1.0
            });
        
        const hmaMin = 
            next !== null 
            && item.hma < prior.hma 
            && item.hma < next.hma;
        
        const hmaMax = 
            next !== null 
            && item.hma > prior.hma 
            && item.hma > next.hma;
        
        if (hmaMin || hmaMax) {

            const height = item.atr / 24;
            
            const center = p.x.get(item);
            const left = p.x.between(x1, center, 0.8);
            const right = p.x.between(x1, center, 1.2);
            const bottom = item.hma - (height / 2.0);
            const top = item.hma + (height / 2.0);
            
            let path = p.createPath();
            
            if (hmaMin) {
                // The triangle path
                path.moveTo(left, bottom);
                path.lineTo(center, top);
                path.lineTo(right, bottom);
                path.lineTo(left, bottom);
                path.lineTo(center, top);
                
            } else if (hmaMax) {
                // The square path
                path.moveTo(left, bottom);
                path.lineTo(left, top);
                path.lineTo(right, top);
                path.lineTo(right, bottom);
                path.lineTo(left, bottom);
                path.lineTo(left, top);
            }
            
            // Draw the triangle or square
            canvas.drawPath(
                path.end(),
                {
                    color: 'white',
                    width: 4,
                    opacity: 1.0
                }); 
        }
        
        if (item.buy) {
            drawArrow(canvas, p, item, prior, item.low, true, 'cyan');
        }
        
        if (item.sell) {
            drawArrow(canvas, p, item, prior, item.high, false, 'orange');
        }
    }
}

module.exports = {
    name: "p2f - HMA Turning Points",
    description: "p2f - HMA Turning Points",
    calculator: p2fHMATurningPoints,
    params: {
        priceType: predef.paramSpecs.enum({
            high: 'High', 
            low: 'Low', 
            open: 'Open', 
            close: 'Close', 
            hl2: '(H+L)/2'
        }, 'hl2'),
        period: predef.paramSpecs.period(55),
        lookback: predef.paramSpecs.period(2),
        trendUpColor: predef.paramSpecs.color('green'),
        trendDnColor: predef.paramSpecs.color('red')
    },
    inputType: meta.InputType.BARS,
    tags: ['paidtofade'],
    plots: {
        turningPoint: { title: "Turning Point", displayOnly: true}
    },
    plotter: [
        predef.plotters.custom(trendPlotter),
        predef.plotters.dots("turningPoint")
    ],
    schemeStyles: {
        dark: {
            turningPoint: {
                color: "white",
                opacity: 75,
                lineStyle: 1, 
                lineWidth: 4
            }
        }
    },
    scaler: predef.scalers.multiPath(["hma"])
};

