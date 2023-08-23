"use strict";
window.addEventListener('load', function () {
    //GLOBALS
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1600;
    canvas.height = 1200;
    class Branch {
        constructor(x0, y0, len, angle, lineWidth = 20, //trunk width
        parent, // parent branch or root
        xF = 0, //could be ? but then lineTo errors with null
        yF = 0, level = 0, children = []) {
            this.x0 = x0;
            this.y0 = y0;
            this.len = len;
            this.angle = angle;
            this.lineWidth = lineWidth;
            this.parent = parent;
            this.xF = xF;
            this.yF = yF;
            this.level = level;
            this.children = children;
            this.parent = parent;
            // recalculate the angle according to parent branch first 
            this.angle = this.parent.angle + this.angle;
            // THEN CALCULATE TIP (FINAL) COORDINATES
            this.xF = x0 + Math.sin(this.angle / 180 * Math.PI) * len;
            this.yF = y0 - Math.cos(this.angle / 180 * Math.PI) * len;
        }
        makeChildBranch(parent, angleDiff) {
            // ctx.strokeStyle = 'green' // why is the trunk green?
            let childBranch = new Branch(this.xF, this.yF, this.len * 0.8, angleDiff, this.lineWidth * 0.5, parent);
            childBranch.parent = this;
            childBranch.level = this.level + 1;
            this.children.push(childBranch);
            // console.log(this.parent)
            // childBranch.drawBranch()
            setTimeout(() => { childBranch.drawBranch(); }, 100);
            return childBranch;
        }
        drawBranch() {
            // console.log(this)
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = 'rgb(10,' + 20 * this.level + ', 0)';
            ctx.moveTo(this.x0, this.y0);
            ctx.lineTo(this.xF, this.yF);
            // ctx.fillStyle = 'white'
            // ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF+this.x0)/2 + 10, (this.y0+this.yF)/2)
            ctx.stroke();
            return;
        }
    }
    class Tree {
        constructor(initX, initY, initLen, initAngle, maxLevel = 8, everyLevelBranches = [[]]) {
            this.initX = initX;
            this.initY = initY;
            this.initLen = initLen;
            this.initAngle = initAngle;
            this.maxLevel = maxLevel;
            this.everyLevelBranches = everyLevelBranches;
            this.everyLevelBranches[0] = [new Branch(initX, initY, initLen, initAngle, 20, root)]; //save trunk as 0lvl branch
            this.everyLevelBranches[0][0].drawBranch(); //draw the trunk
            // let currLvl = 1 -> LOOP ALL LEVELS EXCEPT 0 (TRUNK)
            for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
                this.everyLevelBranches.push([]); // push empty array to fill it by the forEach loop
                this.everyLevelBranches[currLvl].forEach(element => {
                    // console.log('parent = ' + element)
                    if (Math.random() > 0.1) {
                        this.everyLevelBranches[currLvl + 1].push(element.makeChildBranch(element, 25));
                    }
                    if (Math.random() > 0.1) {
                        this.everyLevelBranches[currLvl + 1].push(element.makeChildBranch(element, -25));
                    }
                });
            }
        } // constructor end
    }
    class Root {
        constructor(angle = 0) {
            this.angle = angle;
        }
    }
    // _________ INITIALIZE THE TREE _________
    // Root just acts as a parent element for the trunk. 
    // With the root there is no need for checking for parent element in Branch constructor
    const root = new Root();
    const tree = new Tree(canvas.width / 2, canvas.height, 200, 0); // initialize tree with trunk params
    // tree.trunk.drawBranch() // why it draws everything and in one width and col?
    console.log(tree.everyLevelBranches);
});
//# sourceMappingURL=script.js.map