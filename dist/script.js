"use strict";
window.addEventListener('load', function () {
    //GLOBALS
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    ctx.lineCap = "round";
    //  SET CANVAS SIZES AND CHANGE THEM AT WINDOW RESIZE
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        tree.drawTheTree(); // tree possibly not ready at resize
    });
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
            let childBranch = new Branch(this.xF, this.yF, this.len * 0.8, angleDiff, this.lineWidth * 0.75, parent);
            // _________ rebranching at different positions. Not worth it for now. _________
            // childBranch.x0 = this.xF + Math.cos(this.angle/180* Math.PI) * this.lineWidth/4 * (childBranch.angle/ Math.abs(childBranch.angle))
            // childBranch.y0 = this.yF + Math.sin(this.angle/180* Math.PI) * this.lineWidth/4 * (childBranch.angle/ Math.abs(childBranch.angle))
            // _________ _________
            childBranch.parent = this;
            childBranch.level = this.level + 1;
            this.children.push(childBranch);
            // setTimeout(() => {childBranch.drawBranch()} , 50)
            return childBranch;
        }
        drawBranch() {
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = 'rgb(10,' + (30 + 12 * this.level) + ', 0)';
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(this.x0, this.y0);
            // ctx.bezierCurveTo(this.x0, this.y0, (this.x0 + this.xF)/2 + 10, (this.y0 + this.yF)/2 -10, this.xF, this.yF);
            ctx.lineTo(this.xF, this.yF);
            // ctx.fillStyle = 'white'
            // ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF+this.x0)/2 + 10, (this.y0+this.yF)/2)
            ctx.stroke();
            // console.log('drawBranch')
            ctx.closePath();
        }
    }
    class Tree {
        constructor(initX, initY, initLen, initAngle, branchingProbability = 0.8, maxLevel = 5, allBranches = [[]]) {
            this.initX = initX;
            this.initY = initY;
            this.initLen = initLen;
            this.initAngle = initAngle;
            this.branchingProbability = branchingProbability;
            this.maxLevel = maxLevel;
            this.allBranches = allBranches;
            const startTime = Date.now();
            this.allBranches[0] = [new Branch(initX, initY, initLen, initAngle, 50, root)]; //save trunk as 0lvl branch
            for (let currLvl = 0; currLvl <= this.maxLevel; currLvl++) {
                // prob should = 1 for level 0 (trunk) 
                // this variable lowers branching probability with lever. In range from 1 to branchingProbability linearly
                let branchingProbabilityByLevel = branchingProbability + ((1 - branchingProbability) * ((this.maxLevel - currLvl) / this.maxLevel));
                // console.log(branchingProbabilityByLevel, currLvl)
                this.allBranches.push([]); // push empty array to fill it by the forEach loop
                this.allBranches[currLvl].forEach(element => {
                    // MAKE BRANCHES
                    if (Math.random() < branchingProbabilityByLevel) {
                        this.allBranches[currLvl + 1].push(element.makeChildBranch(element, 20 + Math.random() * 15));
                    }
                    if (Math.random() < branchingProbabilityByLevel) {
                        this.allBranches[currLvl + 1].push(element.makeChildBranch(element, -20 - Math.random() * 15));
                    }
                });
            }
            console.log('Tree constructed in ' + (Date.now() - startTime) + ' ms');
        } // constructor end
        drawTheTree() {
            const startTime = Date.now();
            for (let currLvl = 0; currLvl <= this.maxLevel + 1; currLvl++) {
                let lvlLen = this.allBranches[currLvl].length;
                for (let item = 0; item < lvlLen; item++) {
                    this.allBranches[currLvl][item].drawBranch();
                }
            }
            console.log('drawTheTree in ' + (Date.now() - startTime) + ' ms');
        }
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
    // tree.drawTheTree() //all at once
    // console.log(tree.allBranches)
    // let timer = 0
    // _________ ANIMATE _________
    let lvl = 0;
    let item = 0;
    let lastTime = 0;
    let accumulatedTime = 0;
    const timeLimit = 20;
    function animate(timeStamp) {
        const timeDelta = timeStamp - lastTime;
        // console.log(timeDelta)
        lastTime = timeStamp;
        // break the loop
        if (lvl > tree.maxLevel && item > tree.allBranches[tree.maxLevel].length) {
            console.log('Animation end');
            return;
        }
        // increase lvl if that was the last item in that level
        if (item >= tree.allBranches[lvl].length) {
            lvl++;
            item = 0;
            console.log('lvl =' + lvl);
        }
        // draw a branch if accumulated Time is higher than timeLimit
        if (accumulatedTime >= timeLimit) {
            // tree.allBranches[lvl].forEach(element => {element.drawBranch()})
            tree.allBranches[lvl][item].drawBranch();
            item++;
            accumulatedTime = 0;
        }
        // or add accumulated time 
        else if (accumulatedTime < timeLimit) {
            accumulatedTime += timeDelta;
        }
        requestAnimationFrame(animate);
        if (Math.floor(1000 / timeDelta) < 50)
            console.log(Math.floor(1000 / timeDelta) + ' FPS'); //FPS
    }
    // animate
    animate(0);
    // _________ ANIMATE _________
});
//# sourceMappingURL=script.js.map