"use strict";
window.addEventListener('load', function () {
    //GLOBALS
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    const segmentingLen = 10;
    const trunkLen = 200;
    const trunkWidth = 60;
    const lenMultiplier = 0.71;
    const widthMultiplier = 0.75;
    const rebranchingAngle = 18;
    const maxLevelGlobal = 10;
    const occasionalBranchesLimit = 1;
    const leafProbability = 0.12;
    // AXIS 1 WILL BE THE WIDER ONE. BOTH AXES ARE PERPENDICULAR TO THE LEAF'S MAIN NERVE (x0,y0 - xF,yF)
    // ratio is relative to Leaf's this.len
    const axis1WidthRatio = 1;
    const axis2WidthRatio = 0.5;
    const axis1LenRatio = -0.15;
    const axis2LenRatio = 0.5;
    const petioleLenRatio = 0.33; //of the whole length
    //  SET CANVAS SIZES AND CHANGE THEM AT WINDOW RESIZE
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        tree.drawTheTree(); // tree possibly not ready at resize
    });
    // TOODOO LIST:
    //     - make segments gradually thiner
    //     - add probability for spawning a leaf
    //     - spawn leaf at the border of the branch, not in the middle
    //     - make growing leaf stages
    class Branch {
        constructor(parent, // parent branch or root
        x0, y0, len, angle, lineWidth, levelShift = 0, xF = 0, //could be ? but then lineTo errors with null
        yF = 0, level = 0, children = [], // list of children branches
        segments = [], // segments endpoints to draw lines between
        drawnSegments = 0, //to track branch drawing progress
        occasionalBranches = 0) {
            this.parent = parent;
            this.x0 = x0;
            this.y0 = y0;
            this.len = len;
            this.angle = angle;
            this.lineWidth = lineWidth;
            this.levelShift = levelShift;
            this.xF = xF;
            this.yF = yF;
            this.level = level;
            this.children = children;
            this.segments = segments;
            this.drawnSegments = drawnSegments;
            this.occasionalBranches = occasionalBranches;
            this.parent = parent;
            // RECALCULATE LEN AND WIDTH WITH levelShift
            this.level = this.parent.level + 1 + this.levelShift;
            // if (this.levelShift > 0) console.log(this.levelShift)
            if (this.level > maxLevelGlobal)
                console.log(this.level);
            // Occasional branch length (or width) = orig.len * lenMultipl^levelShift
            this.lineWidth = this.lineWidth * Math.pow(widthMultiplier, this.levelShift);
            this.len = this.len * Math.pow(lenMultiplier, this.levelShift);
            this.len = this.len + this.len * Math.random() * 0.15;
            // recalculate the angle according to parent branch first 
            this.angle = this.parent.angle + this.angle;
            // THEN CALCULATE BRANCH TIP (FINAL) COORDINATES
            this.xF = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len;
            this.yF = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len;
            // SEGMENTING A BRANCH
            // let segAmountByLevel = Math.ceil(this.len / segmentingLen) //MAY RESULT IN DIFFERENT AMOUNT FOR SAME LEVEL, WHICH 'FREEZES' ANIMATION (because of waiting for the last segments to draw)
            let segAmountByLevel = Math.ceil(((trunkLen * (Math.pow(lenMultiplier, this.level))) / segmentingLen) + (this.level / 2));
            // console.log(segAmountByLevel)
            for (let seg = 0; seg < segAmountByLevel; seg++) {
                this.segments.push({ x0: 0, y0: 0, xF: 0, yF: 0 });
                // Calculate coordinates analogically to branch xF yF, but for shorter lengths. 
                // segment is in range from (seg/segAmount) to ((seg +1)/segAmount) * len
                this.segments[seg].x0 = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len * (seg / segAmountByLevel);
                this.segments[seg].y0 = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len * (seg / segAmountByLevel);
                this.segments[seg].xF = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len * ((seg + 1) / segAmountByLevel);
                this.segments[seg].yF = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len * ((seg + 1) / segAmountByLevel);
            }
        } // Branch constructor
        makeChildBranch(angleDiff, levelShift) {
            let childBranch = new Branch(this, this.xF, this.yF, this.len * lenMultiplier, angleDiff, this.lineWidth * widthMultiplier, levelShift);
            this.children.push(childBranch);
            return childBranch;
        }
        // make levelshifted Branch at random segment
        makeGrandChildBranch(angleDiff, levelShift) {
            let randomSegmentIndex = Math.floor(Math.random() * this.segments.length);
            let grandChildBranch = new Branch(this, this.segments[randomSegmentIndex].xF, this.segments[randomSegmentIndex].yF, this.len * lenMultiplier, angleDiff, this.lineWidth * widthMultiplier, levelShift);
            this.occasionalBranches++;
            this.children.push(grandChildBranch);
            return grandChildBranch;
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
            // gradient.addColorStop(0, 'rgb(80,' + (10 + 10*this.level) + ', 0)');
            // gradient.addColorStop(1, 'rgb(80,' + (20 + 10*this.level) + ', 0)');
            gradient.addColorStop(0, 'rgb(50,' + (12 * this.parent.level) + ', 0)');
            gradient.addColorStop(1, 'rgb(50,' + (12 * this.level) + ', 0)');
            // gradient.addColorStop(0, 'rgb(10,' + (10 + 10*this.level) + ',' + (100*this.levelShift) + ')' );
            // gradient.addColorStop(1, 'rgb(10,' + (20 + 10*this.level) + ',' + (100*this.levelShift) + ')' );
            ctx.strokeStyle = gradient;
            ctx.lineCap = "round";
            // ctx.lineWidth = this.lineWidth
            // linearly change lineWidth for each segment 
            // this.lineWidth = this.lineWidth * Math.pow(widthMultiplier, this.levelShift)
            ctx.lineWidth = this.lineWidth + ((this.segments.length - this.drawnSegments) / this.segments.length) * (this.lineWidth / widthMultiplier - this.lineWidth); // this.lineWidth/widthMultiplier makes width as +1 lvl
            ctx.beginPath();
            ctx.moveTo(this.segments[this.drawnSegments].x0, this.segments[this.drawnSegments].y0);
            ctx.lineTo(this.segments[this.drawnSegments].xF, this.segments[this.drawnSegments].yF);
            ctx.stroke();
            ctx.closePath();
            this.drawnSegments++;
            // ADD LEAF - many conditions ahead
            if (Math.random() < leafProbability && this.level >= tree.maxLevel - 1 && this.segments.length > this.drawnSegments) {
                if (this.drawnSegments % 4 === 0) {
                    const leafL = new Leaf(this.segments[this.drawnSegments].x0, this.segments[this.drawnSegments].y0, 35, this.angle - 45, 1);
                    leafL.drawLeaf();
                }
                else if (this.drawnSegments % 2 === 0) {
                    const leafR = new Leaf(this.segments[this.drawnSegments].x0, this.segments[this.drawnSegments].y0, 35, this.angle + 45, 1);
                    leafR.drawLeaf();
                }
            }
        }
    }
    class Tree {
        constructor(initX, initY, initLen, initAngle, maxLevel = maxLevelGlobal, branchingProbability = 0.8, allBranches = [[]]) {
            this.initX = initX;
            this.initY = initY;
            this.initLen = initLen;
            this.initAngle = initAngle;
            this.maxLevel = maxLevel;
            this.branchingProbability = branchingProbability;
            this.allBranches = allBranches;
            const startTime = Date.now();
            this.allBranches[0] = [new Branch(root, initX, initY, initLen, initAngle, trunkWidth)]; //save trunk as 0lvl branch
            // append array for every level ahead. Needed for levelShifted branches
            for (let lvl = 0; lvl < this.maxLevel; lvl++) {
                this.allBranches.push([]); //
            }
            // console.log(this.allBranches)
            for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
                // prob should = 1 for level 0 (trunk) 
                // this variable lowers branching probability with level. In range from 1 to branchingProbability linearly
                let branchingProbabilityByLevel = this.branchingProbability + ((1 - branchingProbability) * ((this.maxLevel - currLvl) / this.maxLevel));
                let occasionalBranchingProbability = ((this.maxLevel - currLvl + 1) / this.maxLevel); // always spawn at lvl 0
                // console.log(branchingProbabilityByLevel, currLvl)
                // this.allBranches.push([]) // push empty array to fill it by the forEach loop
                this.allBranches[currLvl].forEach(element => {
                    // MAKE BRANCHES
                    if (Math.random() < branchingProbabilityByLevel) {
                        this.allBranches[currLvl + 1].push(element.makeChildBranch(rebranchingAngle + Math.random() * rebranchingAngle, 0));
                    }
                    if (Math.random() < branchingProbabilityByLevel) {
                        this.allBranches[currLvl + 1].push(element.makeChildBranch(-rebranchingAngle - Math.random() * rebranchingAngle, 0));
                    }
                    // OCCASIONAL BRANCHING WITH LEVEL SHIFT (children level is not parent level + 1)
                    // compare occasionalBranches to occasionalBranchesLimit  
                    if (Math.random() < occasionalBranchingProbability && element.occasionalBranches < occasionalBranchesLimit) {
                        // random level shift
                        let levelShift = 1 + Math.round(Math.random() * 2);
                        // console.log('occasional branching')
                        if (element.level + 1 + levelShift < this.maxLevel) {
                            const occasionalBranch = element.makeGrandChildBranch(-rebranchingAngle + Math.random() * 2 * rebranchingAngle, levelShift);
                            this.allBranches[currLvl + 1 + levelShift].push(occasionalBranch);
                            // console.log('occasional, lvl =' + (currLvl+levelShift))
                        }
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
        constructor(angle = 0, //Rotates the tree. 
        level = -1, lineWidth = trunkWidth * 1.7) {
            this.angle = angle;
            this.level = level;
            this.lineWidth = lineWidth;
        }
    }
    class Leaf {
        constructor(
        // public parent: Branch, // parent branch
        x0, y0, len, angle, lineWidth = 2, xF = 0, //could be ? but then lineTo errors with null
        yF = 0, maxStages = 5, currentStage = 0, 
        //initialize empty currentStageParameters object to fill it up
        currentStageParameters = { xF: 0, yF: 0, xFPetiole: 0, yFPetiole: 0, xR1: 0, yR1: 0, xL1: 0, yL1: 0, xR2: 0, yR2: 0, xL2: 0, yL2: 0 }, allStages = []) {
            this.x0 = x0;
            this.y0 = y0;
            this.len = len;
            this.angle = angle;
            this.lineWidth = lineWidth;
            this.xF = xF;
            this.yF = yF;
            this.maxStages = maxStages;
            this.currentStage = currentStage;
            this.currentStageParameters = currentStageParameters;
            this.allStages = allStages;
            ctx.lineWidth = this.lineWidth;
            // CALCULATE TIP (FINAL) COORDINATES. LEAF'S MAIN NERVE ENDS HERE
            this.xF = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len;
            this.yF = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len;
            this.currentStageParameters.xF = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len;
            this.currentStageParameters.yF = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len;
            // PETIOLE'S END COORDS
            this.currentStageParameters.xFPetiole = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len * petioleLenRatio;
            this.currentStageParameters.yFPetiole = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len * petioleLenRatio;
            // BEZIER CURVES - AXIS 1
            const axis1 = this.calcBezierPointsForPerpendicularAxis(axis1LenRatio, axis1WidthRatio);
            // console.log(axis1)
            // BEZIER CURVES - AXIS 2
            const axis2 = this.calcBezierPointsForPerpendicularAxis(axis2LenRatio, axis2WidthRatio);
            // console.log(axis2)
            // FILL UP THIS STAGE
            this.currentStageParameters.xR1 = axis1.xR;
            this.currentStageParameters.yR1 = axis1.yR;
            this.currentStageParameters.xL1 = axis1.xL;
            this.currentStageParameters.yL1 = axis1.yL;
            // ____________
            this.currentStageParameters.xR2 = axis2.xR;
            this.currentStageParameters.yR2 = axis2.yR;
            this.currentStageParameters.xL2 = axis2.xL;
            this.currentStageParameters.yL2 = axis2.yL;
            // PUSH TO allStages
            this.allStages.push(this.currentStageParameters);
        } //Leaf constructor
        calcBezierPointsForPerpendicularAxis(axisLenRatio, axisWidthRatio) {
            let x0Axis = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len * axisLenRatio;
            let y0Axis = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len * axisLenRatio;
            // calculate points on line perpendiuclar to the main nerve
            let xR = x0Axis + Math.sin((90 + this.angle) / 180 * Math.PI) * this.len * axisWidthRatio / 2; // /2 because its only one half
            let yR = y0Axis - Math.cos((90 + this.angle) / 180 * Math.PI) * this.len * axisWidthRatio / 2;
            let xL = x0Axis + Math.sin((-90 + this.angle) / 180 * Math.PI) * this.len * axisWidthRatio / 2;
            let yL = y0Axis - Math.cos((-90 + this.angle) / 180 * Math.PI) * this.len * axisWidthRatio / 2;
            return { xR: xR, yR: yR, xL: xL, yL: yL };
        }
        drawLeaf() {
            ctx.beginPath();
            ctx.strokeStyle = 'rgb(10,60,0)';
            //MAIN NERVE
            ctx.moveTo(this.x0, this.y0);
            ctx.lineTo(this.xF, this.yF);
            // stg for shorter code 
            const stg = this.allStages[0];
            ctx.stroke();
            ctx.closePath();
            // BEZIER CURVES FOR BOTH SIDES OF A LEAF
            ctx.beginPath();
            ctx.moveTo(stg.xFPetiole, stg.yFPetiole);
            // right side of a leaf
            ctx.bezierCurveTo(stg.xR1, stg.yR1, stg.xR2, stg.yR2, this.xF, this.yF);
            ctx.moveTo(stg.xFPetiole, stg.yFPetiole);
            // left side of a leaf
            ctx.bezierCurveTo(stg.xL1, stg.yL1, stg.xL2, stg.yL2, this.xF, this.yF);
            ctx.closePath();
            ctx.fillStyle = 'rgb(10,80,0)';
            ctx.fill();
            ctx.stroke();
        }
    }
    // _________ INITIALIZE THE TREE _________
    // Root just acts as a parent element for the trunk. 
    // With the root there is no need for checking for parent element in Branch constructor
    const root = new Root();
    const tree = new Tree(canvas.width / 2, canvas.height, trunkLen, 0); // initialize tree with trunk params. TRUNK LENGTH HERE
    // tree.drawTheTree() //all at once
    console.log(tree.allBranches);
    let branchesAll = 0;
    tree.allBranches.forEach(level => {
        branchesAll += level.length;
    });
    console.log('branches amount = ' + branchesAll);
    // _________ ANIMATE SEGMENTS _________
    let lvl = 0;
    let lastTime = 0;
    let accumulatedTime = 0;
    const timeLimit = 10;
    let thisForEachCompleted = 0;
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
                if (branch.drawnSegments >= branch.segments.length) {
                    // branchesCompletedThisLvl ++
                    thisForEachCompleted++;
                }
                else if (branch.drawnSegments < branch.segments.length) {
                    branch.drawBranchBySegments();
                    accumulatedTime = 0;
                }
            });
            branchesCompletedThisLvl = thisForEachCompleted;
            thisForEachCompleted = 0;
            if (branchesCompletedThisLvl === tree.allBranches[lvl].length) {
                branchesCompletedThisLvl = 0;
                lvl++;
                // console.log('lvl = ' + lvl)
            }
        }
        //OR ACCUMULATE PASSED TIME
        else if (accumulatedTime < timeLimit) {
            accumulatedTime += timeDelta;
        }
        requestAnimationFrame(animateByLSegments);
        // if (Math.floor(1000/timeDelta) < 50){
        //     console.log(Math.floor(1000/timeDelta) + ' FPS!!!') // FPS ALERT
        // }
    }
    // animate
    animateByLSegments(0);
    // _________ ANIMATE SEGMENTS _________
    // class Cloud {
    //     constructor (context: CanvasRenderingContext2D) {
    //     // begin custom shape
    //     context.beginPath();
    //     context.moveTo(170, 80);
    //     context.bezierCurveTo(130, 100, 130, 150, 230, 150);
    //     context.bezierCurveTo(250, 180, 320, 180, 340, 150);
    //     context.bezierCurveTo(420, 150, 420, 120, 390, 100);
    //     context.bezierCurveTo(430, 40, 370, 30, 340, 50);
    //     context.bezierCurveTo(320, 5, 250, 20, 250, 50);
    //     context.bezierCurveTo(200, 5, 150, 20, 170, 80);
    //     // complete custom shape
    //     context.closePath();
    //     context.lineWidth = 5;
    //     context.fillStyle = '#8ED6FF';
    //     context.fill();
    //     context.strokeStyle = 'blue';
    //     context.stroke();
    //     }
    // }
    // const cloud = new Cloud (ctx)
    // console.log(cloud)
}); //window.addEventListener('load', function(){ }) ends here
//# sourceMappingURL=script.js.map