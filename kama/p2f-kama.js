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

class p2fKama {
    init() {
        this.erLength = this.props.efficiencyRatioLength;
        this.fastSf = 2.0 / (this.props.fastLength + 1);
        this.slowSf = 2.0 / (this.props.slowLength + 1);
        this.lastKama = undefined;
        this.getPriceVal = d => d.close();
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
        
        const result = this.lastKama + (ct * (this.getPriceVal(d) - this.lastKama));
        this.lastKama = result;
        return result;
    }
    
    filter(d, i) {
        return i > Math.max(this.props.fastLength, this.props.slowLength, this.erLength);
    }
}

module.exports = {
    name: "p2fKama",
    description: "p2f - Adaptive Moving Average",
    calculator: p2fKama,
    inputType: meta.InputType.BARS,
    params: {
        fastLength: predef.paramSpecs.period(2),
        slowLength: predef.paramSpecs.period(30),
        efficiencyRatioLength: predef.paramSpecs.period(10)
    },
    tags: ["paidtofade"],
    schemeStyles: predef.styles.solidLine("#8cecff")
};

