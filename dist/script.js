"use strict";
window.addEventListener('load', function () {
    //GLOBALS
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    // ctx.lineCap = "round"; doesnt work
    let segmentingLen = 20;
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
        yF = 0, level = 0, children = [], // list of children branches
        segments = [], // remove empty array type?
        drawnSegments = 0) {
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
            this.segments = segments;
            this.drawnSegments = drawnSegments;
            this.parent = parent;
            // recalculate the angle according to parent branch first 
            this.angle = this.parent.angle + this.angle;
            // THEN CALCULATE BRANCH TIP (FINAL) COORDINATES
            this.xF = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len;
            this.yF = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len;
            // SEGMENTING A BRANCH
            let segAmount = Math.ceil(this.len / segmentingLen);
            for (let seg = 0; seg < segAmount; seg++) {
                this.segments.push({ x0: 0, y0: 0, xF: 0, yF: 0 });
                // Calculate coordinates analogically to branch xF yF, but for shorter lengths. 
                // segment is in range from (seg/segAmount) to ((seg +1)/segAmount) * len
                this.segments[seg].x0 = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len * (seg / segAmount);
                this.segments[seg].y0 = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len * (seg / segAmount);
                this.segments[seg].xF = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len * ((seg + 1) / segAmount);
                this.segments[seg].yF = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len * ((seg + 1) / segAmount);
            }
        } // Branch constructor
        makeChildBranch(parent, angleDiff) {
            let childBranch = new Branch(this.xF, this.yF, this.len * 0.71 + Math.random() * this.len * 0.15, angleDiff, this.lineWidth * 0.8, parent);
            childBranch.parent = this;
            childBranch.level = this.level + 1;
            this.children.push(childBranch);
            return childBranch;
        }
        drawBranch() {
            // Add the gradient 
            const gradient = ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF);
            gradient.addColorStop(0, 'rgb(10,' + (10 + 10 * this.level) + ', 0)');
            gradient.addColorStop(1, 'rgb(10,' + (20 + 10 * this.level) + ', 0)');
            // gradient.addColorStop(0, 'rgb(10,0,' + (10 + 5*this.level)  + ')');
            // gradient.addColorStop(1, 'rgb(10,0,' + (20 + 5*this.level)  + ')');
            ctx.strokeStyle = gradient;
            // ctx.strokeStyle = 'rgb(10,' + (40 + 10*this.level) + ', 0)'
            ctx.lineCap = "round";
            ctx.lineWidth = this.lineWidth;
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
        drawBranchBySegments() {
            // gradient color for the whole branch
            const gradient = ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF);
            gradient.addColorStop(0, 'rgb(80,' + (10 + 10 * this.level) + ', 0)');
            gradient.addColorStop(1, 'rgb(80,' + (20 + 10 * this.level) + ', 0)');
            // gradient.addColorStop(0, 'rgb(10,0,' + (10 + 5*this.level)  + ')');
            // gradient.addColorStop(1, 'rgb(10,0,' + (20 + 5*this.level)  + ')');
            ctx.strokeStyle = gradient;
            ctx.lineCap = "round";
            ctx.lineWidth = this.lineWidth;
            ctx.beginPath();
            this.segments[this.drawnSegments].x0;
            ctx.moveTo(this.segments[this.drawnSegments].x0, this.segments[this.drawnSegments].y0);
            ctx.lineTo(this.segments[this.drawnSegments].xF, this.segments[this.drawnSegments].yF);
            // ctx.fillStyle = 'white'
            // ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF+this.x0)/2 + 10, (this.y0+this.yF)/2)
            ctx.stroke();
            // console.log('drawBranch')
            ctx.closePath();
            this.drawnSegments++;
        }
    }
    class Tree {
        constructor(initX, initY, initLen, initAngle, maxLevel = 15, branchingProbability = 0.8, allBranches = [[]]) {
            this.initX = initX;
            this.initY = initY;
            this.initLen = initLen;
            this.initAngle = initAngle;
            this.maxLevel = maxLevel;
            this.branchingProbability = branchingProbability;
            this.allBranches = allBranches;
            const startTime = Date.now();
            this.allBranches[0] = [new Branch(initX, initY, initLen, initAngle, 40, root)]; //save trunk as 0lvl branch
            for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
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
            for (let currLvl = 0; currLvl <= this.maxLevel; currLvl++) {
                // console.log(this.allBranches[currLvl])
                this.allBranches[currLvl].forEach((element) => {
                    element.drawBranch();
                });
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
    console.log(tree.allBranches);
    // _________ ANIMATE SEGMENTS 1 _________
    let lvl = 0;
    let lastTime = 0;
    let accumulatedTime = 0;
    const timeLimit = 10;
    let branchesCompletedThisLvl = 0;
    // if (branchesCompletedThisLvl) {}
    function animateByLSegments(timeStamp) {
        const timeDelta = timeStamp - lastTime;
        lastTime = timeStamp;
        // BREAK THE LOOP IF REACHED MAX LVL
        if (lvl > tree.maxLevel) {
            console.log('___Animation_in___' + timeStamp + 'ms___');
            return;
        }
        // DRAW A FRAME IF TIMELIMIT PASSED
        if (accumulatedTime >= timeLimit) {
            //for every branch
            tree.allBranches[lvl].forEach(branch => {
                // 
                if (branch.drawnSegments < branch.segments.length) {
                    branch.drawBranchBySegments();
                    accumulatedTime = 0;
                }
                else if (branch.drawnSegments >= branch.segments.length) {
                    branchesCompletedThisLvl++;
                }
            });
            if (branchesCompletedThisLvl >= tree.allBranches[lvl].length) {
                branchesCompletedThisLvl = 0;
                lvl++;
                console.log('lvl = ' + lvl);
            }
        }
        //OR ACCUMULATE PASSED TIME
        else if (accumulatedTime < timeLimit) {
            accumulatedTime += timeDelta;
        }
        requestAnimationFrame(animateByLSegments);
        if (Math.floor(1000 / timeDelta) < 50) {
            console.log(Math.floor(1000 / timeDelta) + ' FPS!!!'); // FPS ALERT
        }
    }
    // animate
    animateByLSegments(0);
    // _________ ANIMATE SEGMENTS 1 _________
});
//# sourceMappingURL=script.js.map