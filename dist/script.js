"use strict";
window.addEventListener('load', function () {
    //GLOBALS
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 1200;
    class Branch {
        constructor(x0, y0, len, angle, lineWidth = 20, //trunk width
        xF = 0, //could be ? but then lineTo errors with null
        yF = 0, level = 0, parent, // parent branch
        children = []) {
            this.x0 = x0;
            this.y0 = y0;
            this.len = len;
            this.angle = angle;
            this.lineWidth = lineWidth;
            this.xF = xF;
            this.yF = yF;
            this.level = level;
            this.parent = parent;
            this.children = children;
            // non-null assertion operator '!'
            this.angle = this.parent.angle + this.angle;
            this.xF = x0 + Math.sin(this.angle / 180 * Math.PI) * len;
            this.yF = y0 - Math.cos(this.angle / 180 * Math.PI) * len;
            // recalculate the angle 
            // if (this.parent) {// because root is parentless
            //     this.angle = this.parent.angle + this.angle
            //     // CALCULATE TIP (FINAL) COORDINATES
            //     this.xF = x0 + Math.sin(this.angle/180* Math.PI) * len
            //     this.yF = y0 - Math.cos(this.angle/180* Math.PI) * len
            //     console.log(this.angle)
            //     // console.log(this.parent.angle)
            // }
            // else { //TRUNK CASE
            //     this.xF = x0 + Math.sin(this.angle/180* Math.PI) * len
            //     this.yF = y0 - Math.cos(this.angle/180* Math.PI) * len
            //     // console.log('TRUNK?')
            // }
            // console.log(this.parent)
            // console.log(this.level)
        }
        // makeTrunk() {
        // }
        makeChildBranch(angleDiff) {
            // ctx.strokeStyle = 'green' // why is the trunk green?
            let childBranch = new Branch(this.xF, this.yF, this.len * 0.85, angleDiff, this.lineWidth * 0.6);
            childBranch.level = this.level + 1;
            childBranch.parent = this;
            // childBranch.angle = childBranch.parent.angle + angleDiff
            // console.log(childBranch.angle)
            this.children.push(childBranch);
            // console.log(this.parent)
            // this.drawBranch() // buggy
            childBranch.drawBranch();
            return childBranch;
        }
        drawBranch() {
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = 'rgb(10,' + 20 * this.level + ', 0)';
            ctx.moveTo(this.x0, this.y0);
            ctx.lineTo(this.xF, this.yF);
            ctx.fillStyle = 'white';
            ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF + this.x0) / 2 + 10, (this.y0 + this.yF) / 2);
            ctx.stroke();
        }
    }
    class Tree {
        constructor(initX, initY, initLen, initAngle, maxLevel = 2, trunk = new Branch(initX, initY, initLen, initAngle), //trunk as branch
        everyLevelBranches = [[]]) {
            this.initX = initX;
            this.initY = initY;
            this.initLen = initLen;
            this.initAngle = initAngle;
            this.maxLevel = maxLevel;
            this.trunk = trunk;
            this.everyLevelBranches = everyLevelBranches;
            this.everyLevelBranches[0] = [this.trunk]; //save trunk as 0lvl branch
            this.trunk.drawBranch(); //draw the trunk
            // let currLvl = 1 -> LOOP ALL LEVELS EXCEPT 0 (TRUNK)
            for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
                this.everyLevelBranches.push([]); // push empty array to fill it by the forEach loop
                this.everyLevelBranches[currLvl].forEach(element => {
                    // console.log('parent = ' + element)
                    this.everyLevelBranches[currLvl + 1].push(element.makeChildBranch(45));
                    this.everyLevelBranches[currLvl + 1].push(element.makeChildBranch(-45));
                });
            }
        } // constructor end
    }
    // INITIALIZE THE TREE
    const tree = new Tree(canvas.width / 2, canvas.height, 200, 0); // initialize tree with trunk params
    tree.trunk.parent = new Branch(0, 0, 0, 0); // just to make a parent with angle 0 for thr trunk 
    // tree.trunk.drawBranch() // why it draws everything and in one width and col?
    // console.log(tree.everyLevelBranches)
    console.log(tree.trunk.parent);
});
//# sourceMappingURL=script.js.map