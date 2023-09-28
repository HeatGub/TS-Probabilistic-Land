"use strict";
// START ON LOAD
window.addEventListener('load', function () {
    // ________________________________________ GLOBALS ________________________________________
    // ctx.globalAlpha = 0.3;
    const globalCanvasesList = [];
    const canvasContainer = document.getElementById('canvasContainer');
    // HORIZON HEIGHT
    const horizonHeight = canvasContainer.offsetHeight * 0.5;
    document.documentElement.style.cssText = "--horizonHeight:" + horizonHeight + "px";
    // LIGHTSOURCE
    const lightSourceCanvas = document.getElementById('lightSourceCanvas');
    const lightSourceGlowCanvas = document.getElementById('lightSourceGlowCanvas');
    const lightSourcePositionX = Math.random() * this.window.innerWidth;
    const lightSourcePositionY = Math.random() * horizonHeight;
    const lightSourceSize = 100 + Math.random() * 150;
    lightSourceCanvas.style.width = lightSourceSize + 'px';
    lightSourceCanvas.style.height = lightSourceSize + 'px';
    lightSourceCanvas.style.left = (lightSourcePositionX - lightSourceSize / 2) + 'px';
    lightSourceCanvas.style.top = (lightSourcePositionY - lightSourceSize / 2) + 'px';
    lightSourceGlowCanvas.style.width = lightSourceSize * 2 + 'px';
    lightSourceGlowCanvas.style.height = lightSourceSize * 2 + 'px';
    lightSourceGlowCanvas.style.left = (lightSourcePositionX - lightSourceSize) + 'px';
    lightSourceGlowCanvas.style.top = (lightSourcePositionY - lightSourceSize) + 'px';
    // const lightSourceCenter = lightSourceCanvas.style.left/2
    // console.log(lightSourceCanvas.style.width)
    // create Branch public shadowSegments, 
    const initialsegmentingLen = 100;
    const trunkLen = 120;
    const lenMultiplier = 0.8;
    const trunkWidthAsPartOfLen = 0.5;
    const widthMultiplier = 0.7;
    const rebranchingAngle = 23;
    const maxLevelGlobal = 6;
    const branchingProbabilityBooster = 0.5;
    const occasionalBranchesLimit = 0;
    const treeDistanceScaling = 1; // range 0-1
    // const shadowSpread = -0.3 // -1 to 0 is shrinked shadow, 0 is shadow straight behind, 
    const shadowColor = 'rgba(10, 10, 10, 1)';
    // const shadowAngle = -1 // range -1 to +1 works fine. 1 gives 45 angle
    const shadowAngleMultiplier = 5;
    const shadowSpread = 0.75; // > 0 for now
    const blurStrength = 20;
    // AXIS 1 WILL BE THE WIDER ONE. BOTH AXES ARE PERPENDICULAR TO THE LEAF'S MAIN NERVE (x0,y0 - xF,yF)
    // ratio is relative to Leaf's this.len
    const axis1WidthRatio = 1;
    const axis2WidthRatio = 0.5;
    const axis1LenRatio = -0.15;
    const axis2LenRatio = 0.5;
    const petioleLenRatio = 0.2; //of the whole length
    const leafyLevels = 3;
    const globalLeafProbability = 0.02; // SAME PROBABILITY FOR EACH SIDE
    const leafLineWidthAsPartOfLeafLen = 0.05;
    const leafLenScaling = 1.2;
    const leavesGrowingOrder = 0.25;
    const growLimitingLeavesAmount = 10; // branches drawing will stop when this amount of growing leaves is reached
    const leafMaxStageGlobal = 2;
    const whileLoopRetriesEachFrameLeaves = 100; // when that = 1 --> ~1 FPS for leafMaxStageGlobal = 60
    // const segRedMultiplier = 20
    // const segGreenMultiplier = 20
    // const segBlueMultiplier = 20
    //  SET CANVASES SIZES AND CHANGE THEM AT WINDOW RESIZE
    window.addEventListener('resize', function () {
        globalCanvasesList.forEach((canvas) => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
        // tree.drawTheTree() // tree possibly not ready at resize
    });
    // ________________________________________ GLOBALS ________________________________________
    // ________________________________________ BRANCH ________________________________________
    class Branch {
        constructor(parent, // parent branch or root
        x0, y0, len, angle, branchWidth, levelShift = 0, xF = 0, //could be ? but then lineTo errors with null
        yF = 0, level = 0, children = [], // list of children branches
        segments = [], // segments endpoints to draw lines between
        drawnSegments = 0, //to track branch drawing progress
        occasionalBranches = 0, tree = parent.tree, shadowSegments = []) {
            this.parent = parent;
            this.x0 = x0;
            this.y0 = y0;
            this.len = len;
            this.angle = angle;
            this.branchWidth = branchWidth;
            this.levelShift = levelShift;
            this.xF = xF;
            this.yF = yF;
            this.level = level;
            this.children = children;
            this.segments = segments;
            this.drawnSegments = drawnSegments;
            this.occasionalBranches = occasionalBranches;
            this.tree = tree;
            this.shadowSegments = shadowSegments;
            this.parent = parent;
            // console.log(this.leaves)
            // RECALCULATE LEN AND WIDTH WITH levelShift
            this.level = this.parent.level + 1 + this.levelShift;
            // Occasional branch length (or width) = orig.len * lenMultipl^levelShift
            this.branchWidth = this.branchWidth * Math.pow(widthMultiplier, this.levelShift);
            this.len = this.len * Math.pow(lenMultiplier, this.levelShift);
            this.len = this.len + this.len * Math.random() * 0.15; //randomize len
            // recalculate the angle according to parent branch first 
            this.angle = this.parent.angle + this.angle;
            // THEN CALCULATE BRANCH TIP (FINAL) COORDINATES
            this.xF = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len;
            this.yF = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len;
            // ____________ SEGMENTING A BRANCH ____________
            // let segAmountByLevel = Math.ceil( ((trunkLen*(Math.pow(lenMultiplier, this.level))) / initialsegmentingLen) + (this.level) )
            let segAmountByLevel = Math.ceil(((trunkLen * (Math.pow(lenMultiplier, this.level))) / initialsegmentingLen) + (this.level));
            for (let seg = 0; seg < segAmountByLevel; seg++) {
                // EXIT LOOP IF SEGMENT IS NEARLY TOUCHING THE GROUND (this.tree.initY-this.tree.trunkLen/10)
                // this.level > 0 not to affect the trunk
                if (this.level > 0 && seg >= 1 && this.segments[seg - 1].y0 > (this.tree.initY - this.tree.trunkLen / 10) || this.level > 0 && seg >= 1 && this.segments[seg - 1].yF > (this.tree.initY - this.tree.trunkLen / 10)) {
                    return;
                }
                this.segments.push({ x0: 0, y0: 0, xF: 0, yF: 0, width: 0, leaves: [] });
                // Calculate coordinates analogically to branch xF yF, but for shorter lengths. 
                // segment is in range from (seg/segAmount) to ((seg +1)/segAmount) * len
                this.segments[seg].x0 = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len * (seg / segAmountByLevel);
                this.segments[seg].y0 = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len * (seg / segAmountByLevel);
                this.segments[seg].xF = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len * ((seg + 1) / segAmountByLevel);
                this.segments[seg].yF = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len * ((seg + 1) / segAmountByLevel);
                // linearly change branchWidth for each segment 
                this.segments[seg].width = this.branchWidth + ((segAmountByLevel - seg + 1) / segAmountByLevel) * (this.branchWidth / widthMultiplier - this.branchWidth); // this.branchWidth/widthMultiplier makes width as +1 lvl
                // // SHADOW SEGMENT
                this.shadowSegments.push({ x0: 0, y0: 0, xF: 0, yF: 0, width: 0, blur: 0 });
                this.shadowSegments[seg].y0 = this.tree.initY + (this.tree.initY - this.segments[seg].y0) * shadowSpread;
                this.shadowSegments[seg].yF = this.tree.initY + (this.tree.initY - this.segments[seg].yF) * shadowSpread;
                this.shadowSegments[seg].x0 = this.segments[seg].x0 + (this.tree.initY - this.segments[seg].y0) * shadowSpread * this.tree.shadowAngle;
                this.shadowSegments[seg].xF = this.segments[seg].xF + (this.tree.initY - this.segments[seg].yF) * shadowSpread * this.tree.shadowAngle;
                this.shadowSegments[seg].width = this.segments[this.drawnSegments].width + ((this.tree.initY - this.segments[this.drawnSegments].y0) * (shadowSpread / 200)) + (Math.abs((this.tree.initX - this.segments[this.drawnSegments].x0))) * (shadowSpread / 200);
                this.shadowSegments[seg].blur = (this.tree.initY - this.segments[seg].y0) / this.tree.canvas.height * blurStrength;
                this.segments[seg].leaves.forEach((leaf) => {
                    leaf.blur = this.shadowSegments[seg].blur;
                });
                // _________________ ADD LEAVES AT SEGMENT _________________
                // if (maxLevelGlobal - leafyLevels < this.level && seg >= segAmountByLevel/6 && seg % spawnLeafEverySegments === 0) { // seg >= segAmountByLevel/6  to disable appearing leaves at the very beginning (overlapping branches)
                const singleSegmentLength = this.len * (1 / segAmountByLevel);
                const spawnLeafEverySegments = Math.ceil(this.tree.minimalDistanceBetweenLeaves / singleSegmentLength);
                if (maxLevelGlobal - leafyLevels < this.level && seg % spawnLeafEverySegments === 0) { // seg >= segAmountByLevel/6  to disable appearing leaves at the very beginning (overlapping branches)
                    const thisLeafSize = (this.tree.averageLeafSize * 0.7 + this.tree.averageLeafSize * 0.3 * Math.random()) * leafLenScaling; // randomize leaf size
                    const leafProbabilityByLevel = globalLeafProbability - globalLeafProbability * ((maxLevelGlobal - this.level) / leafyLevels / 2); // linearly change probability with level from around globalLeafProbability/2 to globalLeafProbability (for leafy levels)
                    // console.log(leafProbabilityByLevel)
                    // LEFT LEAF
                    if (Math.random() < leafProbabilityByLevel) {
                        // recalculate leaf starting point to match the segment width
                        const x0Leaf = this.segments[seg].x0 - Math.cos(this.angle / 180 * Math.PI) * this.segments[seg].width / 2;
                        const y0Leaf = this.segments[seg].y0 - Math.sin(this.angle / 180 * Math.PI) * this.segments[seg].width / 2;
                        const x0LeafShadow = this.shadowSegments[seg].x0 - Math.cos(this.angle / 180 * Math.PI) * this.shadowSegments[seg].width / 2;
                        const y0LeafShadow = this.shadowSegments[seg].y0 + Math.sin(this.angle / 180 * Math.PI) * this.shadowSegments[seg].width / 2; // opposite sign to (y0Leaf) because shadow leaves are rotated
                        const leafL = new Leaf(this, x0Leaf, y0Leaf, thisLeafSize * 0.9, this.angle - 40 - Math.random() * 10, x0LeafShadow, y0LeafShadow);
                        this.segments[seg].leaves.push(leafL);
                        // console.log('L ')
                    }
                    // MIDDLE LEAF
                    if (Math.random() < leafProbabilityByLevel) {
                        //recalculate leaf starting point to match the segment width
                        // const x0Leaf  = this.segments[seg].x0
                        const x0Leaf = this.segments[seg].x0 - (Math.cos(this.angle / 180 * Math.PI) * this.segments[seg].width / 4) + Math.random() * (Math.cos(this.angle / 180 * Math.PI) * this.segments[seg].width / 2); // randomize to range 1/4 - 3/4 of segWidth
                        // const y0Leaf  = this.segments[seg].y0 + Math.random()*(Math.sin(this.angle/180* Math.PI) * minimalDistanceBetweenLeaves/2) // randomized
                        const y0Leaf = this.segments[seg].y0;
                        const x0LeafShadow = this.shadowSegments[seg].x0 - (Math.cos(this.angle / 180 * Math.PI) * this.shadowSegments[seg].width / 4) + Math.random() * (Math.cos(this.angle / 180 * Math.PI) * this.shadowSegments[seg].width / 2);
                        const y0LeafShadow = this.shadowSegments[seg].y0;
                        const leafM = new Leaf(this, x0Leaf, y0Leaf, thisLeafSize, this.angle - 10 + Math.random() * 20, x0LeafShadow, y0LeafShadow); // slightly bigger than side leaves
                        this.segments[seg].leaves.push(leafM);
                        // console.log(' M ')
                    }
                    // RIGHT LEAF
                    if (Math.random() < leafProbabilityByLevel) {
                        //recalculate leaf starting point to match the segment width
                        const x0Leaf = this.segments[seg].x0 + Math.cos(this.angle / 180 * Math.PI) * this.segments[seg].width / 2;
                        const y0Leaf = this.segments[seg].y0 + Math.sin(this.angle / 180 * Math.PI) * this.segments[seg].width / 2;
                        const x0LeafShadow = this.shadowSegments[seg].x0 + Math.cos(this.angle / 180 * Math.PI) * this.shadowSegments[seg].width / 2;
                        const y0LeafShadow = this.shadowSegments[seg].y0 - Math.sin(this.angle / 180 * Math.PI) * this.shadowSegments[seg].width / 2; // opposite sign
                        const leafR = new Leaf(this, x0Leaf, y0Leaf, thisLeafSize * 0.9, this.angle + 40 + Math.random() * 10, x0LeafShadow, y0LeafShadow);
                        this.segments[seg].leaves.push(leafR);
                        // console.log('   R ')
                    }
                }
            }
        } // Branch constructor
        makeChildBranch(angleDiff, levelShift) {
            let childBranch = new Branch(this, this.xF, this.yF, this.len * lenMultiplier, angleDiff, this.branchWidth * widthMultiplier, levelShift);
            this.children.push(childBranch);
            return childBranch;
        }
        // make levelshifted Branch at random segment
        makeGrandChildBranch(angleDiff, levelShift) {
            let randomSegmentIndex = Math.floor(Math.random() * this.segments.length);
            let grandChildBranch = new Branch(this, this.segments[randomSegmentIndex].xF, this.segments[randomSegmentIndex].yF, this.len * lenMultiplier, angleDiff, this.branchWidth * widthMultiplier, levelShift);
            this.occasionalBranches++;
            this.children.push(grandChildBranch);
            return grandChildBranch;
        }
        drawBranch() {
            // Add the gradient 
            const gradient = this.tree.ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF);
            // gradient.addColorStop(0, 'rgb(10,' + (0 + 5*this.level) + ', 0)')
            // gradient.addColorStop(1, 'rgb(10,' + (10 + 5*this.level) + ', 0)')
            this.tree.ctx.strokeStyle = gradient;
            this.tree.ctx.lineCap = "round";
            this.tree.ctx.lineWidth = this.branchWidth;
            this.tree.ctx.beginPath();
            this.tree.ctx.moveTo(this.x0, this.y0);
            this.tree.ctx.lineTo(this.xF, this.yF);
            // ctx.fillStyle = 'white'
            // ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF+this.x0)/2 + 10, (this.y0+this.yF)/2)
            this.tree.ctx.stroke();
            // console.log('drawBranch')
            this.tree.ctx.closePath();
        }
        drawBranchBySegments() {
            // gradient color for the whole branch
            const gradient = this.tree.ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF);
            // gradient.addColorStop(0, 'rgb(80,' + (10 + 10*this.level) + ', 0)')
            // gradient.addColorStop(1, 'rgb(80,' + (20 + 10*this.level) + ', 0)')
            // gradient.addColorStop(0, 'rgb(50,' + (5*this.parent.level) + ', 0)')
            // gradient.addColorStop(1, 'rgb(50,' + (5*this.level) + ', 0)')
            gradient.addColorStop(0, 'rgba(0, ' + (20 * this.parent.level) + ', 0 , 1)');
            gradient.addColorStop(1, 'rgba(0,' + (20 * this.level) + ', 0)');
            this.tree.ctx.strokeStyle = gradient;
            this.tree.ctx.lineCap = "round";
            this.tree.ctx.lineWidth = this.segments[this.drawnSegments].width;
            this.tree.ctx.beginPath();
            this.tree.ctx.moveTo(this.segments[this.drawnSegments].x0, this.segments[this.drawnSegments].y0);
            this.tree.ctx.lineTo(this.segments[this.drawnSegments].xF, this.segments[this.drawnSegments].yF);
            this.tree.ctx.stroke();
            this.tree.ctx.closePath();
            //  CHANGE LEAF STATE TO GROWING
            if (this.segments[this.drawnSegments].leaves.length > 0) { // if there are any leaves on this segment, let them grow from now on
                this.segments[this.drawnSegments].leaves.forEach((leaf) => {
                    leaf.state = "growing";
                    this.tree.growingLeavesList.push(leaf); // APPEND TO THE GROWING LEAVES LIST
                });
            }
            this.drawSegmentShadow();
            this.drawnSegments++;
        }
        drawSegmentShadow() {
            this.tree.ctxShadows.strokeStyle = shadowColor;
            this.tree.ctxShadows.lineCap = "round";
            this.tree.ctxShadows.lineWidth = this.shadowSegments[this.drawnSegments].width;
            this.tree.ctxShadows.filter = 'blur(' + this.shadowSegments[this.drawnSegments].blur + 'px)';
            this.tree.ctxShadows.beginPath();
            this.tree.ctxShadows.moveTo(this.shadowSegments[this.drawnSegments].x0, this.shadowSegments[this.drawnSegments].y0);
            this.tree.ctxShadows.lineTo(this.shadowSegments[this.drawnSegments].xF, this.shadowSegments[this.drawnSegments].yF);
            this.tree.ctxShadows.stroke();
            this.tree.ctxShadows.closePath();
        }
    }
    // ________________________________________ BRANCH ________________________________________
    // ________________________________________ TREE ________________________________________
    class Tree {
        constructor(initX, initY, trunkLen, shadowAngle, trunkWidth = trunkLen * trunkWidthAsPartOfLen, initAngle = 0, maxLevel = maxLevelGlobal, branchingProbability = branchingProbabilityBooster, allBranches = [[]], growingLeavesList = [], 
        // public canvas = document.getElementById('canvasBranches') as HTMLCanvasElement,
        canvas = canvasContainer.appendChild(document.createElement("canvas")), // create canvas
        ctx = canvas.getContext('2d'), canvasShadows = canvasContainer.appendChild(document.createElement("canvas")), // create canvas for tree shadow
        ctxShadows = canvasShadows.getContext('2d'), averageLeafSize = trunkLen / 5, minimalDistanceBetweenLeaves = averageLeafSize) {
            this.initX = initX;
            this.initY = initY;
            this.trunkLen = trunkLen;
            this.shadowAngle = shadowAngle;
            this.trunkWidth = trunkWidth;
            this.initAngle = initAngle;
            this.maxLevel = maxLevel;
            this.branchingProbability = branchingProbability;
            this.allBranches = allBranches;
            this.growingLeavesList = growingLeavesList;
            this.canvas = canvas;
            this.ctx = ctx;
            this.canvasShadows = canvasShadows;
            this.ctxShadows = ctxShadows;
            this.averageLeafSize = averageLeafSize;
            this.minimalDistanceBetweenLeaves = minimalDistanceBetweenLeaves;
            this.canvas.style.zIndex = String(initY); // higher z-index makes element appear on top
            // SET INITIAL CANVASES SIZE
            this.canvas.classList.add('canvas');
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            globalCanvasesList.push(this.canvas);
            //  SHADOWS CANVAS
            this.canvasShadows.classList.add('canvasShadows');
            this.canvasShadows.width = window.innerWidth;
            this.canvasShadows.height = window.innerHeight;
            globalCanvasesList.push(this.canvasShadows);
            const root = new Root(this);
            const startTime = Date.now();
            this.allBranches[0] = [new Branch(root, this.initX, this.initY, this.trunkLen, this.initAngle, this.trunkWidth)]; //save trunk as 0lvl branch
            // append array for every level ahead. Needed for levelShifted branches
            for (let i = 0; i < this.maxLevel; i++) {
                this.allBranches.push([]); //
            }
            for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
                // prob should = 1 for level 0 (trunk) 
                // this variable lowers branching probability with level. In range from 1 to branchingProbability linearly
                let branchingProbabilityByLevel = this.branchingProbability + ((1 - branchingProbability) * ((this.maxLevel - currLvl) / this.maxLevel));
                // console.log(branchingProbabilityByLevel)
                let occasionalBranchingProbability = ((this.maxLevel - currLvl + 1) / this.maxLevel); // always spawn at lvl 0
                // console.log(branchingProbabilityByLevel, currLvl)
                // this.allBranches.push([]) // push empty array to fill it by the forEach loop
                this.allBranches[currLvl].forEach(element => {
                    // MAKE BRANCHES IF
                    if (element.yF < (this.initY - this.trunkLen / 10)) { // IF PARENT'S END IS NOT ON THE GROUND LEVEL
                        // branchingProbabilityByLevel check
                        if (Math.random() < branchingProbabilityByLevel) {
                            this.allBranches[currLvl + 1].push(element.makeChildBranch(rebranchingAngle + Math.random() * rebranchingAngle, 0));
                        }
                        if (Math.random() < branchingProbabilityByLevel) {
                            this.allBranches[currLvl + 1].push(element.makeChildBranch(-rebranchingAngle - Math.random() * rebranchingAngle, 0));
                        }
                        // OCCASIONAL BRANCHING WITH LEVEL SHIFT (children level is not parent level + 1)
                        // compare occasionalBranches to occasionalBranchesLimit  
                        if (Math.random() < occasionalBranchingProbability && element.occasionalBranches <= occasionalBranchesLimit) {
                            // random level shift
                            let levelShift = 1 + Math.round(Math.random() * 2);
                            // console.log('occasional branching')
                            if (element.level + 1 + levelShift < this.maxLevel) {
                                const occasionalBranch = element.makeGrandChildBranch(-rebranchingAngle + Math.random() * 2 * rebranchingAngle, levelShift);
                                this.allBranches[currLvl + 1 + levelShift].push(occasionalBranch);
                                // console.log('occasional, lvl =' + (currLvl+levelShift))
                            }
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
                    // console.log(element.branchWidth)
                });
            }
            console.log('drawTheTree in ' + (Date.now() - startTime) + ' ms');
        }
    }
    // ________________________________________ TREE ________________________________________
    // ________________________________________ ROOT ________________________________________
    // Root just acts as a parent element for the trunk. 
    // With the root there is no need to check for parent element in Branch constructor
    class Root {
        constructor(tree, angle = 0, // Rotates the tree
        level = -1) {
            this.tree = tree;
            this.angle = angle;
            this.level = level;
        }
    }
    // ________________________________________ ROOT ________________________________________
    // ________________________________________ LEAF ________________________________________
    class Leaf {
        constructor(
        // public parentSeg: {x0: number, y0: number, xF: number, yF: number, width: number}, // parent segment
        parentBranch, x0, y0, len, angle, x0LeafShadow, y0LeafShadow, lineWidth = len * leafLineWidthAsPartOfLeafLen, xF = 0, yF = 0, maxStages = -1 + leafMaxStageGlobal, currentStage = 0, growthStages = [], canvas = canvasContainer.appendChild(document.createElement("canvas")), // create canvas
        ctx = canvas.getContext('2d'), canvasCoords = { x: 0, y: 0 }, // canvasTopLeftCorner
        x0rel = 0, // relative coordinates (for the leaf canvas positioning)
        y0rel = 0, state = "hidden", tree = parentBranch.tree, canvasShadow = canvasContainer.appendChild(document.createElement("canvas")), ctxShadow = canvasShadow.getContext('2d'), shadowStages = [], xFLeafShadow = 0, yFLeafShadow = 0, shadowCanvasCoords = { x: 0, y: 0 }, // canvasTopLeftCorner
        x0relShadow = 0, // relative coordinates (for the leaf canvas positioning)
        y0relShadow = 0, shadowLen = 0, blur = 0, colors = { r: 0, g: 0, b: 0 }) {
            this.parentBranch = parentBranch;
            this.x0 = x0;
            this.y0 = y0;
            this.len = len;
            this.angle = angle;
            this.x0LeafShadow = x0LeafShadow;
            this.y0LeafShadow = y0LeafShadow;
            this.lineWidth = lineWidth;
            this.xF = xF;
            this.yF = yF;
            this.maxStages = maxStages;
            this.currentStage = currentStage;
            this.growthStages = growthStages;
            this.canvas = canvas;
            this.ctx = ctx;
            this.canvasCoords = canvasCoords;
            this.x0rel = x0rel;
            this.y0rel = y0rel;
            this.state = state;
            this.tree = tree;
            this.canvasShadow = canvasShadow;
            this.ctxShadow = ctxShadow;
            this.shadowStages = shadowStages;
            this.xFLeafShadow = xFLeafShadow;
            this.yFLeafShadow = yFLeafShadow;
            this.shadowCanvasCoords = shadowCanvasCoords;
            this.x0relShadow = x0relShadow;
            this.y0relShadow = y0relShadow;
            this.shadowLen = shadowLen;
            this.blur = blur;
            this.colors = colors;
            // RESIZE CANVAS (canvasCoords and 0rels depend on it)
            this.canvas.width = this.len * 1.4;
            this.canvas.height = this.len * 1.4;
            // final len in final stage
            this.xF = this.x0 + Math.sin(this.angle / 180 * Math.PI) * this.len;
            this.yF = this.y0 - Math.cos(this.angle / 180 * Math.PI) * this.len;
            // top left corner of the canvas
            this.canvasCoords.x = (this.x0 + this.xF) / 2 - this.canvas.width / 2;
            this.canvasCoords.y = (this.y0 + this.yF) / 2 - this.canvas.height / 2;
            // relative leaf starting coords (for a smaller canvas)
            this.x0rel = this.x0 - this.canvasCoords.x;
            this.y0rel = this.y0 - this.canvasCoords.y;
            // MOVE CANVAS
            this.canvas.style.left = this.canvasCoords.x + 'px';
            this.canvas.style.top = this.canvasCoords.y + 'px';
            this.canvas.style.zIndex = String(this.tree.initY + 1); // z-index of its tree +1
            this.canvas.classList.add('leafCanvas');
            this.ctx.lineWidth = this.lineWidth; // petiole width
            // _____________________________ LEAF SHADOW _____________________________
            // this.shadowLen = this.len + (this.tree.initY+this.y0LeafShadow)*shadowSpread/100 + Math.abs((this.tree.initX-this.x0LeafShadow)*shadowSpread/100) // shadow len depends on x and y distance from the tree init coords
            this.shadowLen = this.len + (this.tree.initY - this.y0LeafShadow) * -shadowSpread / 80 + Math.abs((this.tree.initX - this.x0LeafShadow) * shadowSpread / 80);
            // console.log(-(this.tree.initY - this.y0LeafShadow ))
            this.canvasShadow.width = this.shadowLen * 1.5; // little bit bigger area for blurring
            this.canvasShadow.height = this.shadowLen * 1.5;
            // final len in final stage
            this.xFLeafShadow = this.x0LeafShadow + Math.sin(this.angle / 180 * Math.PI) * this.shadowLen;
            this.yFLeafShadow = this.y0LeafShadow + Math.cos(this.angle / 180 * Math.PI) * this.shadowLen;
            // top left corner of the canvas
            this.shadowCanvasCoords.x = (this.x0LeafShadow + this.xFLeafShadow) / 2 - this.canvasShadow.width / 2;
            this.shadowCanvasCoords.y = (this.y0LeafShadow + this.yFLeafShadow) / 2 - this.canvasShadow.height / 2;
            // coords relative to shadow canvas
            this.x0relShadow = this.x0LeafShadow - this.shadowCanvasCoords.x;
            this.y0relShadow = this.y0LeafShadow - this.shadowCanvasCoords.y;
            this.canvasShadow.style.left = this.shadowCanvasCoords.x + 'px';
            this.canvasShadow.style.top = this.shadowCanvasCoords.y + 'px';
            this.canvasShadow.classList.add('leafShadowCanvas');
            this.ctxShadow.lineCap = "round";
            // CHECK LENGTH
            // console.log(this.len, Math.sqrt((this.xFLeafShadow-this.x0LeafShadow)**2 + (this.yFLeafShadow-this.y0LeafShadow)**2))
            // _____________________________ LEAF SHADOW _____________________________
            // _____________________________ LEAF STAGES _____________________________
            for (let stg = 0; stg <= this.maxStages; stg++) {
                // push zeros to fill the object
                this.growthStages.push({ stageLen: 0, xF: 0, yF: 0, xFPetiole: 0, yFPetiole: 0, xR1: 0, yR1: 0, xL1: 0, yL1: 0, xR2: 0, yR2: 0, xL2: 0, yL2: 0 });
                this.growthStages[stg].stageLen = this.len * ((stg + 1) / (this.maxStages + 1)); // +1 to make stage 0 leaf longer than 0 
                // CALCULATE TIP (FINAL) COORDINATES. LEAF'S MAIN NERVE ENDS HERE
                this.growthStages[stg].xF = this.x0rel + Math.sin(this.angle / 180 * Math.PI) * this.growthStages[stg].stageLen;
                this.growthStages[stg].yF = this.y0rel - Math.cos(this.angle / 180 * Math.PI) * this.growthStages[stg].stageLen;
                // PETIOLE'S END COORDS
                this.growthStages[stg].xFPetiole = this.x0rel + Math.sin(this.angle / 180 * Math.PI) * this.growthStages[stg].stageLen * petioleLenRatio;
                this.growthStages[stg].yFPetiole = this.y0rel - Math.cos(this.angle / 180 * Math.PI) * this.growthStages[stg].stageLen * petioleLenRatio;
                // 0.5 is no rotation. 0-1 range
                // let rotateLeafRightFrom0To1 = 0.35 + Math.sin(this.angle/180* Math.PI)*0.3 + Math.random()*0.30
                let rotateLeafRightFrom0To1 = 0.35 + Math.sin(this.angle / 180 * Math.PI) * 0.3; // move up this line or add randomization
                // BEZIER CURVES - AXIS 1
                const axis1 = this.calcBezierPointsForPerpendicularAxis(axis1LenRatio, axis1WidthRatio, rotateLeafRightFrom0To1, stg);
                // BEZIER CURVES - AXIS 2
                const axis2 = this.calcBezierPointsForPerpendicularAxis(axis2LenRatio, axis2WidthRatio, rotateLeafRightFrom0To1, stg);
                // FILL UP THIS STAGE
                this.growthStages[stg].xR1 = axis1.xR;
                this.growthStages[stg].yR1 = axis1.yR;
                this.growthStages[stg].xL1 = axis1.xL;
                this.growthStages[stg].yL1 = axis1.yL;
                this.growthStages[stg].xR2 = axis2.xR;
                this.growthStages[stg].yR2 = axis2.yR;
                this.growthStages[stg].xL2 = axis2.xL;
                this.growthStages[stg].yL2 = axis2.yL;
                // ________________ LEAF SHADOW FOR THIS STAGE ________________
                this.shadowStages.push({ stageLen: 0, xF: 0, yF: 0, xFPetiole: 0, yFPetiole: 0, xR1: 0, yR1: 0, xL1: 0, yL1: 0, xR2: 0, yR2: 0, xL2: 0, yL2: 0 });
                this.shadowStages[stg].stageLen = this.shadowLen * ((stg + 1) / (this.maxStages + 1));
                this.shadowStages[stg].xF = this.x0relShadow + Math.sin(this.angle / 180 * Math.PI) * this.shadowStages[stg].stageLen;
                this.shadowStages[stg].yF = this.y0relShadow + Math.cos(this.angle / 180 * Math.PI) * this.shadowStages[stg].stageLen;
                // PETIOLE'S END COORDS
                this.shadowStages[stg].xFPetiole = this.x0relShadow + Math.sin(this.angle / 180 * Math.PI) * this.shadowStages[stg].stageLen * petioleLenRatio;
                this.shadowStages[stg].yFPetiole = this.y0relShadow + Math.cos(this.angle / 180 * Math.PI) * this.shadowStages[stg].stageLen * petioleLenRatio;
                // let shadowRotateLeafRightFrom0To1 = 0.35 + Math.sin(this.angle/180* Math.PI)*0.3 // move up this line or add randomization
                // BEZIER CURVES - AXIS 1
                const axis1Shadow = this.calcBezierPointsForPerpendicularAxisShadow(axis1LenRatio, axis1WidthRatio, rotateLeafRightFrom0To1, stg);
                // BEZIER CURVES - AXIS 2
                const axis2Shadow = this.calcBezierPointsForPerpendicularAxisShadow(axis2LenRatio, axis2WidthRatio, rotateLeafRightFrom0To1, stg);
                // FILL UP THIS STAGE
                this.shadowStages[stg].xR1 = axis1Shadow.xR;
                this.shadowStages[stg].yR1 = axis1Shadow.yR;
                this.shadowStages[stg].xL1 = axis1Shadow.xL;
                this.shadowStages[stg].yL1 = axis1Shadow.yL;
                this.shadowStages[stg].xR2 = axis2Shadow.xR;
                this.shadowStages[stg].yR2 = axis2Shadow.yR;
                this.shadowStages[stg].xL2 = axis2Shadow.xL;
                this.shadowStages[stg].yL2 = axis2Shadow.yL;
            }
            // _____________________________ LEAF STAGES _____________________________
        } //Leaf constructor
        calcBezierPointsForPerpendicularAxis(axisLenRatio, axisWidthRatio, moveAxis, index) {
            let x0Axis = this.x0rel + Math.sin(this.angle / 180 * Math.PI) * this.growthStages[index].stageLen * axisLenRatio;
            let y0Axis = this.y0rel - Math.cos(this.angle / 180 * Math.PI) * this.growthStages[index].stageLen * axisLenRatio;
            // calculate points on line perpendiuclar to the main nerve
            let xR = x0Axis + Math.sin((90 + this.angle) / 180 * Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (moveAxis); // /2 because its only one half
            let yR = y0Axis - Math.cos((90 + this.angle) / 180 * Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (moveAxis);
            let xL = x0Axis + Math.sin((-90 + this.angle) / 180 * Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (1 - moveAxis);
            let yL = y0Axis - Math.cos((-90 + this.angle) / 180 * Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (1 - moveAxis);
            return { xR: xR, yR: yR, xL: xL, yL: yL };
        }
        calcBezierPointsForPerpendicularAxisShadow(axisLenRatio, axisWidthRatio, moveAxis, index) {
            let x0Axis = this.x0relShadow + Math.sin(this.angle / 180 * Math.PI) * this.shadowStages[index].stageLen * axisLenRatio;
            let y0Axis = this.y0relShadow + Math.cos(this.angle / 180 * Math.PI) * this.shadowStages[index].stageLen * axisLenRatio;
            // calculate points on line perpendiuclar to the main nerve
            let xR = x0Axis + Math.sin((90 + this.angle) / 180 * Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (moveAxis); // /2 because its only one half
            let yR = y0Axis + Math.cos((90 + this.angle) / 180 * Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (moveAxis);
            let xL = x0Axis + Math.sin((-90 + this.angle) / 180 * Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (1 - moveAxis);
            let yL = y0Axis + Math.cos((-90 + this.angle) / 180 * Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (1 - moveAxis);
            return { xR: xR, yR: yR, xL: xL, yL: yL };
        }
        drawLeafStage() {
            // clear whole previous frame
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.beginPath();
            // this.ctx.strokeStyle = 'rgba(10, 30, 0, 1)'
            this.ctx.strokeStyle = 'rgba(0,0,0, 1)';
            //MAIN NERVE
            this.ctx.moveTo(this.x0rel, this.y0rel);
            this.ctx.lineTo(this.growthStages[this.currentStage].xF, this.growthStages[this.currentStage].yF);
            this.ctx.stroke();
            this.ctx.closePath();
            // BEZIER CURVES FOR BOTH SIDES OF A LEAF
            this.ctx.beginPath();
            this.ctx.moveTo(this.growthStages[this.currentStage].xFPetiole, this.growthStages[this.currentStage].yFPetiole);
            // right side of a leaf
            this.ctx.bezierCurveTo(this.growthStages[this.currentStage].xR1, this.growthStages[this.currentStage].yR1, this.growthStages[this.currentStage].xR2, this.growthStages[this.currentStage].yR2, this.growthStages[this.currentStage].xF, this.growthStages[this.currentStage].yF);
            this.ctx.moveTo(this.growthStages[this.currentStage].xFPetiole, this.growthStages[this.currentStage].yFPetiole);
            // left side of a leaf
            this.ctx.bezierCurveTo(this.growthStages[this.currentStage].xL1, this.growthStages[this.currentStage].yL1, this.growthStages[this.currentStage].xL2, this.growthStages[this.currentStage].yL2, this.growthStages[this.currentStage].xF, this.growthStages[this.currentStage].yF);
            this.ctx.closePath();
            // let greenish = 70 + ((this.maxStages-this.currentStage)/this.maxStages)*180
            // this.ctx.fillStyle = 'rgba(10,' + greenish + ',0, 1)'
            this.ctx.fillStyle = 'rgba(0,0,0, 1)';
            this.ctx.fill();
            this.ctx.stroke();
            this.drawLeafShadow();
        }
        drawLeafShadow() {
            // clear whole previous frame
            this.ctxShadow.clearRect(0, 0, this.canvasShadow.width, this.canvasShadow.height);
            let blur = (this.tree.initY - this.y0) / this.tree.canvas.height * blurStrength;
            this.ctxShadow.filter = 'blur(' + blur + 'px)';
            // petiole's shadow width
            this.ctxShadow.lineWidth = this.lineWidth + (this.tree.initY - this.y0LeafShadow) * -shadowSpread / 1000 + Math.abs((this.tree.initX - this.x0LeafShadow) * shadowSpread / 1000);
            this.ctxShadow.beginPath();
            this.ctxShadow.strokeStyle = shadowColor;
            // this.ctxShadow.strokeStyle = 'blue'
            //MAIN NERVE
            this.ctxShadow.moveTo(this.x0relShadow, this.y0relShadow);
            this.ctxShadow.lineTo(this.shadowStages[this.currentStage].xF, this.shadowStages[this.currentStage].yF);
            this.ctxShadow.stroke();
            this.ctxShadow.closePath();
            this.ctxShadow.lineWidth = this.lineWidth; // thinner line
            // BEZIER CURVES FOR BOTH SIDES OF A LEAF
            this.ctxShadow.beginPath();
            this.ctxShadow.moveTo(this.shadowStages[this.currentStage].xFPetiole, this.shadowStages[this.currentStage].yFPetiole);
            // right side of a leaf
            this.ctxShadow.bezierCurveTo(this.shadowStages[this.currentStage].xR1, this.shadowStages[this.currentStage].yR1, this.shadowStages[this.currentStage].xR2, this.shadowStages[this.currentStage].yR2, this.shadowStages[this.currentStage].xF, this.shadowStages[this.currentStage].yF);
            this.ctxShadow.moveTo(this.shadowStages[this.currentStage].xFPetiole, this.shadowStages[this.currentStage].yFPetiole);
            // left side of a leaf
            this.ctxShadow.bezierCurveTo(this.shadowStages[this.currentStage].xL1, this.shadowStages[this.currentStage].yL1, this.shadowStages[this.currentStage].xL2, this.shadowStages[this.currentStage].yL2, this.shadowStages[this.currentStage].xF, this.shadowStages[this.currentStage].yF);
            this.ctxShadow.closePath();
            this.ctxShadow.fillStyle = shadowColor;
            this.ctxShadow.fill();
            this.ctxShadow.stroke();
        }
    }
    // ________________________________________ LEAF ________________________________________
    // ________________________________________ INITIATIONS ________________________________________
    let alreadyAnimating = false;
    // PLANT (SPAWN) TREE AT CLICK COORDS
    canvasContainer.addEventListener("click", (event) => {
        if (alreadyAnimating === false && event.y > horizonHeight) {
            // console.log(event.x, event.y)
            // console.log(event.srcElement.offsetParent.childNodes)
            console.log(event.srcElement);
            let shadowAngle = -(lightSourcePositionX - event.x) / window.innerWidth * shadowAngleMultiplier;
            let groundHeight = window.innerHeight - horizonHeight;
            let groundMiddle = window.innerHeight - (window.innerHeight - horizonHeight) / 2;
            let scaleByTheGroundPosition = (event.y - groundMiddle) / groundHeight * 2; // in range -1 to 1
            // _________ INITIALIZE THE TREE _________
            let treeTrunkScaledLength = trunkLen + trunkLen * scaleByTheGroundPosition * treeDistanceScaling; // normal scale at the half of ground canvas
            const tree = new Tree(event.x, event.y, treeTrunkScaledLength, shadowAngle);
            animateTheTree(tree);
        }
    });
    // ________________________________________ INITIATIONS ________________________________________
    // ________________________________________ ANIMATION ________________________________________
    function animateTheTree(tree) {
        document.body.style.cursor = 'wait'; // waiting cursor
        alreadyAnimating = true;
        let lvl = 0;
        let lastTime = 0;
        let accumulatedTime = 0;
        const timeLimit = 10;
        let branchesCompletedThisForEach = 0;
        let branchesCompletedThisLvl = 0;
        let currIndexLeaves = 0;
        let whileLoopCounterLeaves = 0;
        function animate(timeStamp) {
            const timeDelta = timeStamp - lastTime;
            lastTime = timeStamp;
            // TILL whileLoopCounterLeaves = whileLoopRetriesLeaves AND growingLeavesList.length = 0
            while (whileLoopCounterLeaves <= whileLoopRetriesEachFrameLeaves && tree.growingLeavesList.length > 0) {
                // console.log('len = ' + growingLeavesList.length + ', indx = ' + currIndexLeaves)
                let leaf = tree.growingLeavesList[currIndexLeaves];
                // GROWING - DRAW
                if (leaf.state === "growing" && leaf.currentStage < leaf.maxStages) {
                    leaf.drawLeafStage();
                    leaf.currentStage++;
                    currIndexLeaves++;
                    if (Math.random() < leavesGrowingOrder) {
                        currIndexLeaves--;
                    } // CHANCE TO DRAW THE SAME LEAF AGAIN.
                    if (Math.random() < 1 / 100) {
                        currIndexLeaves = 0;
                    } // CHANCE TO RESET INDEX TO 0
                }
                // GROWN - label as grown if maxStage reached
                else if (leaf.currentStage === leaf.maxStages) {
                    leaf.drawLeafStage();
                    leaf.currentStage++;
                    leaf.state === "grown";
                    // console.log('grwn')
                    let spliceIndex = tree.growingLeavesList.indexOf(leaf);
                    // remove already grown leaf from the growing list
                    tree.growingLeavesList.splice(spliceIndex, 1); // 2nd parameter means remove one item only
                    // currIndexLeaves--
                }
                // RESET currIndexLeaves if LAST LEAF from the list was reached
                if (currIndexLeaves === tree.growingLeavesList.length) {
                    currIndexLeaves = 0;
                    // console.log('currIndexLeaves = 0')
                }
                whileLoopCounterLeaves++;
                // console.log(growingLeavesList.length)
            }
            whileLoopCounterLeaves = 0;
            // ________________ BREAK THE LOOP ________________
            if (lvl > tree.maxLevel && tree.growingLeavesList.length === 0) {
                console.log('___Animation_in___' + timeStamp + 'ms___');
                // console.log(growingLeavesList)
                alreadyAnimating = false;
                document.body.style.cursor = 'auto'; // waiting cursor
                return;
            }
            // OR ACCUMULATE PASSED TIME
            else if (accumulatedTime < timeLimit) {
                accumulatedTime += timeDelta;
            }
            // DRAW A FRAME IF TIMELIMIT PASSED
            // else if (accumulatedTime >= timeLimit && lvl <= tree.maxLevel){
            // WAIT TILL growingLeavesList.length < growgrowLimitingLeavesAmountAmount to draw further segments
            else if (accumulatedTime >= timeLimit && lvl <= tree.maxLevel && tree.growingLeavesList.length <= growLimitingLeavesAmount) {
                // for every branch
                tree.allBranches[lvl].forEach(branch => {
                    // if this branch is completly drawn 
                    if (branch.drawnSegments >= branch.segments.length) {
                        branchesCompletedThisForEach++;
                    }
                    // if not, draw it
                    else if (branch.drawnSegments < branch.segments.length) {
                        branch.drawBranchBySegments();
                        accumulatedTime = 0;
                    }
                }); // forEach end
                branchesCompletedThisLvl = branchesCompletedThisForEach;
                branchesCompletedThisForEach = 0;
                // go next level if completed all the branches at this frame
                if (branchesCompletedThisLvl === tree.allBranches[lvl].length) {
                    branchesCompletedThisLvl = 0;
                    lvl++;
                    // console.log('lvl = ' + lvl)
                }
            }
            requestAnimationFrame(animate);
            // if (Math.floor(1000/timeDelta) < 50){
            //     console.log(Math.floor(1000/timeDelta) + ' FPS!!!') // FPS ALERT
            // }
        }
        animate(0);
    }
    // ________________________________________ ANIMATION ________________________________________
    // ________________________________________ SIDEBAR ________________________________________
    const CATEGORY1 = document.getElementById('category1');
    const CATEGORY2 = document.getElementById('category2');
    const parametersObjectsList = [];
    // type parameterObject = {name: string, category: string, min: number, max: number, value:number}
    for (let i = 0; i < 10; i++) {
        let ctgr = CATEGORY1;
        if (i > 3) {
            ctgr = CATEGORY2;
        }
        const obj = { name: String(i), category: ctgr, min: i, max: i * 2, value: (i + i * 2) / 2, title: 'title ' + i };
        parametersObjectsList.push(obj);
    }
    function createSliderWithTextInput(name, category, min, max, value, title) {
        const sidebarElement = document.createElement("div");
        sidebarElement.classList.add("sidebarElement");
        // console.log(sidebarElement)
        category.appendChild(sidebarElement);
        const namePar = document.createElement("p");
        namePar.innerText = name;
        sidebarElement.appendChild(namePar);
        const span = document.createElement("span");
        sidebarElement.appendChild(span);
        const slider = document.createElement("input"); // create canvas
        slider.type = 'range';
        slider.classList.add("sliderClass");
        slider.setAttribute('data-slider', 'dejtaset' + name);
        slider.id = name + 'RangeInput';
        slider.min = String(min);
        slider.max = String(max);
        slider.step = String(0.1);
        slider.value = String(value);
        slider.title = title;
        span.appendChild(slider);
        const sliderText = document.createElement("input");
        sliderText.setAttribute('data-sliderText', 'dejtaset' + name);
        slider.id = name + 'TextInput';
        sliderText.type = 'text';
        sliderText.value = String(value);
        span.appendChild(sliderText);
    }
    // __________ CREATE SLIDERS __________
    parametersObjectsList.forEach(element => {
        createSliderWithTextInput(element.name, element.category, element.min, element.max, element.value, element.title);
    });
    const rangeInputs = document.querySelectorAll('.sidebarElement input[type="range"]');
    const textInputs = document.querySelectorAll('.sidebarElement input[type="text"]');
    // __________ CREATE SLIDERS __________
    // UPDATE NUMBER INPUT BY SLIDER
    rangeInputs.forEach((rangeInput) => {
        rangeInput.addEventListener("input", (event) => {
            const eventTarget = event.target;
            const dataOf = eventTarget.dataset.slider;
            const sliderText = document.querySelector(`[data-sliderText="${dataOf}"]`);
            sliderText.value = String(eventTarget.value);
        });
    });
    // UPDATE SLIDER BY NUMBER INPUT
    textInputs.forEach((textInput) => {
        textInput.addEventListener("change", (event) => {
            const eventTarget = event.target;
            const dataOf = eventTarget.dataset.slidertext;
            const slider = document.querySelector(`[data-slider="${dataOf}"]`);
            slider.value = String(eventTarget.value);
        });
    });
    // // SNAP PARAMETERS
    // function snapCurrentParameters () {
    //     rangeInputs.forEach((rangeInput) => {
    //         const inputElement = rangeInput as HTMLInputElement  // because (rangeInput: HTMLInputElement) was not accepted by TS
    //         console.log(inputElement.dataset.slider, inputElement.value)
    //     })
    // }
    // snapCurrentParameters()
    // SIDEBAR OPENING AND CLOSING
    const closeSidebarButton = document.getElementById('closeSidebarButton');
    const sidebar = document.getElementById('sidebar');
    sidebar.style.display = 'none';
    closeSidebarButton.addEventListener("click", () => {
        if (sidebar.style.display == 'none') {
            closeSidebarButton.style.left = String(500) + 'px';
            sidebar.style.display = 'block';
        }
        else if (sidebar.style.display != 'none') {
            closeSidebarButton.style.left = String(0);
            sidebar.style.display = 'none';
        }
    });
    // ________________________________________ SIDEBAR ________________________________________
    // ________________________________________ MOUNTAIN ________________________________________
    class Mountain {
        constructor(initialAmountOfNodes, octaves, targetHeight, canvasBottom, 
        // let width = 600,
        width = canvasContainer.offsetWidth, lowestPoint = Infinity, highestPoint = 0, currentAmountOfNodes = initialAmountOfNodes, currentOctave = 0, allPoints = [], randomPoints = [], canvas = canvasContainer.appendChild(document.createElement("canvas")), ctx = canvas.getContext('2d'), canvasShadow = canvasContainer.appendChild(document.createElement("canvas")), ctxShadow = canvasShadow.getContext('2d')) {
            this.initialAmountOfNodes = initialAmountOfNodes;
            this.octaves = octaves;
            this.targetHeight = targetHeight;
            this.canvasBottom = canvasBottom;
            this.width = width;
            this.lowestPoint = lowestPoint;
            this.highestPoint = highestPoint;
            this.currentAmountOfNodes = currentAmountOfNodes;
            this.currentOctave = currentOctave;
            this.allPoints = allPoints;
            this.randomPoints = randomPoints;
            this.canvas = canvas;
            this.ctx = ctx;
            this.canvasShadow = canvasShadow;
            this.ctxShadow = ctxShadow;
            this.currentAmountOfNodes = this.initialAmountOfNodes; // to silence TS declared but never read
            while (this.currentOctave < this.octaves) {
                this.fillPointsOnTheLineBetweenNodes(this.currentAmountOfNodes);
                this.currentAmountOfNodes = this.currentAmountOfNodes * 2;
                this.currentOctave++;
            }
            // console.log(this.randomPoints)
            // let generatedMountainHeight = highestPoint-lowestPoint
            this.smoothOut();
            // this.allPoints = this.allPoints.slice(0, this.width) // trim array to initial width
            this.rescale();
            // this.drawMountain()
            this.ctx.lineWidth = 1;
            this.canvas.style.bottom = this.canvasBottom + 'px';
            this.canvas.classList.add('mountainCanvas');
            this.canvas.width = window.innerWidth;
            // this.canvas.height = this.highestPoint- this.lowestPoint
            this.canvas.height = this.targetHeight + 0; // ADD VAL FOR HIGHER MOUNTAIN
            this.canvasShadow.classList.add('mountainShadowCanvas');
            this.canvasShadow.height = this.targetHeight * shadowSpread * 1.05; // little bit more for blur
            this.canvasShadow.width = window.innerWidth;
            this.canvasShadow.style.top = this.canvasBottom + 'px';
            this.ctx.globalCompositeOperation = 'destination-atop'; // for drawing stroke in the same color as fill
            this.ctxShadow.globalCompositeOperation = 'destination-atop'; // for drawing stroke in the same color as fill
            this.drawMountain();
            // this.drawShadow()
        }
        fillPointsOnTheLineBetweenNodes(nodes_amount) {
            this.randomPoints = []; // clean up for next iteration
            let amplitude = this.initialAmountOfNodes ** this.octaves / nodes_amount; // has to be >1
            let stepLen = Math.ceil(this.width / (nodes_amount - 1));
            // console.log(stepLen)
            let step = 0;
            while (step * stepLen < this.width + stepLen) { // + stepLen to make one next step
                this.randomPoints.push({ x: step * stepLen, y: Math.random() * amplitude });
                // console.log(step*stepLen)
                // step ++
                step++;
            }
            // FILL POINTS BETWEEN randomPoints
            for (let fillingStep = 0; fillingStep < this.randomPoints.length - 1; fillingStep++) {
                for (let currIndex = fillingStep * stepLen; currIndex < (fillingStep + 1) * stepLen; currIndex++) {
                    let thisNodeInfluence = ((fillingStep + 1) * stepLen - currIndex) / stepLen; // linearly decreasing 1-0
                    let nextNodeInfluence = (currIndex - (fillingStep * stepLen)) / stepLen; // linearly rising 0-1
                    // allPoints[currIndex] = randomPoints[fillingStep].y * thisNodeInfluence + randomPoints[fillingStep+1].y * nextNodeInfluence
                    if (this.currentOctave === 0) {
                        // console.log('fillingStep')
                        this.allPoints[currIndex] = this.randomPoints[fillingStep].y * thisNodeInfluence + this.randomPoints[fillingStep + 1].y * nextNodeInfluence;
                    }
                    else { //calculate average
                        this.allPoints[currIndex] += this.randomPoints[fillingStep].y * thisNodeInfluence + this.randomPoints[fillingStep + 1].y * nextNodeInfluence;
                    }
                }
                // console.log('allPoints len = ' + this.allPoints.length)
            }
            // console.log('________________ allPoints len = ' + allPoints.length)
        }
        // SMOOTHING BY AVERAGING NEIGHBOURING POINTS
        smoothOut() {
            for (let point = 1; point < this.allPoints.length - 1; point++) {
                this.allPoints[point] = (this.allPoints[point - 1] + this.allPoints[point] + this.allPoints[point + 1]) / 3;
            }
            //higher smoothness - averaging 5 points
            // for (let point = 2; point < this.allPoints.length-2; point++) {
            //     this.allPoints[point] = (this.allPoints[point-2] + this.allPoints[point-1] + this.allPoints[point] + this.allPoints[point+1] + this.allPoints[point+2])/5
            // }
        }
        rescale() {
            this.findMinAndMax();
            let scalingFactor = this.targetHeight / (this.highestPoint - this.lowestPoint);
            // console.log((this.highestPoint - this.lowestPoint))
            // console.log(scalingFactor)
            for (let i = 0; i < this.allPoints.length; i++) {
                this.allPoints[i] = (this.allPoints[i] - this.lowestPoint) * scalingFactor;
            }
        }
        findMinAndMax() {
            for (let i = 0; i < this.allPoints.length; i++) {
                if (this.allPoints[i] < this.lowestPoint) {
                    this.lowestPoint = this.allPoints[i];
                }
                else if (this.allPoints[i] > this.highestPoint) {
                    this.highestPoint = this.allPoints[i];
                }
            }
        }
        drawMountain() {
            this.ctx.lineWidth = 1;
            const gradient = this.ctx.createLinearGradient(this.canvasShadow.width / 2, 0, this.canvasShadow.width / 2, this.canvas.height);
            gradient.addColorStop(0, 'rgb(20,20,20,1)');
            // gradient.addColorStop(0.25, 'rgb(50,50,50,1)')
            gradient.addColorStop(1, 'rgb(0,0,0,1)');
            this.ctx.fillStyle = gradient;
            this.ctx.strokeStyle = gradient;
            // let colorBrightness = 100
            // let howFar = 1- (horizonHeight - this.canvasBottom) / (window.innerHeight - horizonHeight)
            // console.log(howFar)
            // let color = 'rgba('+ howFar*colorBrightness + ',' + howFar*colorBrightness + ',' + howFar*colorBrightness + ', 1 )'
            // this.ctx.strokeStyle = color
            // this.ctx.fillStyle = color
            // this.ctx.filter = 'blur(3px)'
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.allPoints[0]);
            for (let point = 0; point < this.allPoints.length - 1; point++) {
                this.ctx.lineTo(point, this.allPoints[point]);
                this.ctx.lineTo(point + 1, this.allPoints[point + 1]);
            }
            this.ctx.lineTo(this.allPoints.length - 1, this.allPoints[this.allPoints.length - 1]);
            this.ctx.lineTo(this.allPoints.length - 1, this.highestPoint);
            this.ctx.lineTo(0, this.highestPoint);
            this.ctx.lineTo(0, this.allPoints[0]);
            this.ctx.stroke();
            this.ctx.closePath();
            this.ctx.fill();
            console.log(this.allPoints.length);
            // this.drawMist()
        }
        drawShadow() {
            const gradient = this.ctxShadow.createLinearGradient(this.canvasShadow.width / 2, 0, this.canvasShadow.width / 2, this.canvasShadow.height);
            gradient.addColorStop(0, 'rgb(0,0,0,1)');
            gradient.addColorStop(1, 'rgb(0,0,0,0)');
            this.ctxShadow.fillStyle = gradient;
            let h = this.targetHeight;
            this.ctxShadow.lineWidth = 1;
            // let color = 'rgba(0,0,0, 0.5)'
            // this.ctxShadow.strokeStyle = color
            // this.ctxShadow.fillStyle = color
            this.ctxShadow.beginPath();
            this.ctxShadow.moveTo(0, h - this.allPoints[0]);
            this.ctxShadow.filter = 'blur(5px)';
            // this.ctxShadow.stroke()
            for (let point = 0; point < this.allPoints.length - 1; point++) {
                let verticalAngleInfluence = ((h - this.allPoints[point]) / h) ** 0.7;
                let shadowAngle = -((lightSourcePositionX - point) / window.innerWidth) / 4 * shadowAngleMultiplier * verticalAngleInfluence;
                this.ctxShadow.lineTo(point + point * shadowAngle, (h - this.allPoints[point]) * shadowSpread);
                this.ctxShadow.lineTo(point + 1 + (point + 1) * shadowAngle, (h - this.allPoints[point + 1]) * shadowSpread);
            }
            // this.ctxShadow.lineTo(this.allPoints.length, (h - this.allPoints[this.allPoints.length]) * shadowSpread)
            this.ctxShadow.lineTo(this.allPoints.length - 1, (h - this.highestPoint) * shadowSpread);
            this.ctxShadow.lineTo(0, (h - this.highestPoint) * shadowSpread);
            this.ctxShadow.lineTo(0, (h - this.allPoints[0]) * shadowSpread);
            this.ctxShadow.closePath();
            this.ctxShadow.stroke();
            this.ctxShadow.fill();
            // SHADOW
            // this.ctxShadow.shadowColor = 'white'
            // this.ctxShadow.shadowOffsetX = 10
            // this.ctxShadow.shadowOffsetY = 10
            // this.ctxShadow.shadowBlur = 5
            // this.ctxShadow.fill()
            // console.log(this.canvas)
            // console.log(this.canvasShadow)
        }
    }
    const mountainFarthest = new Mountain(4, 10, 250, horizonHeight);
    // mountainFarthest.drawStraightShadow()
    mountainFarthest.drawShadow();
    console.log(window.innerWidth);
    console.log(window.outerWidth);
    // mountainFarthest.drawMist()
    mountainFarthest;
    // const mountainClosest = new Mountain(4,10, 400, 0)
    // mountainClosest
    // for (let m=1; m < 3; m++) {
    //     const mountain = new Mountain(4,10, 65*m**1.4, horizonHeight - 80*(m-1)**2)
    //     mountain
    //     mountain.drawStraightShadow()
    //     // console.log(mountain.canvas.height)
    // }
    // mountain
    // console.log(mountain)
    // ________________________________________ MOUNTAIN ________________________________________
    // SIN WAVES TESTS
    // const wavePointsList = []
    // for (let i = 0; i< perlinCanvas.width; i++) {
    //     let sinWave = 600 + Math.sin(-Math.PI/2 + (i/perlinCanvas.width)*Math.PI*2)*200
    //     let randomPoint = Math.random()*100
    //     let sumofWaves =  sinWave + randomPoint
    //     wavePointsList.push(sumofWaves)
    // }
    // console.log(wavePointsList)
    // for (let i = 0; i < wavePointsList.length-1; i++) {
    //     // perlinCtx.filter = 'blur(0px)'
    //     console.log(wavePointsList[i])
    //     perlinCtx.beginPath();
    //     perlinCtx.strokeStyle = 'rgba(150,150,150, 1)'
    //     perlinCtx.moveTo(i, wavePointsList[i])
    //     perlinCtx.lineTo(i+1, wavePointsList[i+1])
    //     perlinCtx.stroke()
    //     perlinCtx.closePath()
    // }
}); //window.addEventListener('load', function(){ }) ENDS HERE
//# sourceMappingURL=script.js.map