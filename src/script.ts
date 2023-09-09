window.addEventListener('load', function() {
//GLOBALS
const canvas = document.getElementById('canvas1') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const canvas2 = document.getElementById('canvas2') as HTMLCanvasElement;
const ctx2 = canvas2.getContext('2d') as CanvasRenderingContext2D
// const canvas2 = document.body.appendChild(document.createElement("canvas"));
// ctx.globalAlpha = 0.3;


const segmentingLen = 10
const trunkLen = 200
const trunkWidth = 60
const lenMultiplier = 0.75
const widthMultiplier = 0.7
const rebranchingAngle = 18
const maxLevelGlobal = 1
const occasionalBranchesLimit = 0.3

// AXIS 1 WILL BE THE WIDER ONE. BOTH AXES ARE PERPENDICULAR TO THE LEAF'S MAIN NERVE (x0,y0 - xF,yF)
// ratio is relative to Leaf's this.len
const axis1WidthRatio = 1
const axis2WidthRatio  = 0.5
const axis1LenRatio = -0.15
const axis2LenRatio = 0.5
const petioleLenRatio = 0.33 //of the whole length
const leafProbability = 0.5

//  SET CANVAS SIZES AND CHANGE THEM AT WINDOW RESIZE
canvas.width = window.innerWidth
canvas.height = window.innerHeight
canvas2.width = window.innerWidth
canvas2.height = window.innerHeight

window.addEventListener('resize', function() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas2.width = window.innerWidth
    canvas2.height = window.innerHeight
    tree.drawTheTree() // tree possibly not ready at resize
})

// TOODOO LIST:
//     - make growing leaf stages

class Branch {
    constructor(
        public parent: Branch|Root, // parent branch or root
        public x0: number,
        public y0: number,
        public len: number,
        public angle: number,
        public lineWidth: number,
        public levelShift: number = 0,
        public xF: number = 0, //could be ? but then lineTo errors with null
        public yF: number  = 0,
        public level: number = 0,
        public children: Branch[] = [], // list of children branches
        public segments: {x0: number, y0: number, xF: number, yF: number, width: number}[] = [], // segments endpoints to draw lines between
        public drawnSegments: number = 0, //to track branch drawing progress
        public occasionalBranches = 0,
        public leaves: Leaf[] = []
    ){
        this.parent = parent
        // console.log(this.leaves)

        // RECALCULATE LEN AND WIDTH WITH levelShift
        this.level = this.parent.level + 1 + this.levelShift
        // if (this.levelShift > 0) console.log(this.levelShift)
        if (this.level > maxLevelGlobal) console.log(this.level)

        // Occasional branch length (or width) = orig.len * lenMultipl^levelShift
        this.lineWidth = this.lineWidth * Math.pow(widthMultiplier, this.levelShift)
        this.len = this.len * Math.pow(lenMultiplier, this.levelShift)
        this.len = this.len + this.len*Math.random()*0.15  //randomize len

        // recalculate the angle according to parent branch first 
        this.angle = this.parent.angle + this.angle
        // THEN CALCULATE BRANCH TIP (FINAL) COORDINATES
        this.xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len
        this.yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len

        // SEGMENTING A BRANCH
        // let segAmountByLevel = Math.ceil(this.len / segmentingLen) //MAY RESULT IN DIFFERENT AMOUNT FOR SAME LEVEL, WHICH 'FREEZES' ANIMATION (because of waiting for the last segments to draw)
        
        let segAmountByLevel = Math.ceil( ((trunkLen*(Math.pow(lenMultiplier, this.level))) / segmentingLen) + (this.level/2) )
        // console.log(segAmountByLevel)

        for (let seg=0; seg < segAmountByLevel; seg++){
            this.segments.push({x0: 0, y0: 0, xF: 0, yF: 0, width: 100})
            // Calculate coordinates analogically to branch xF yF, but for shorter lengths. 
            // segment is in range from (seg/segAmount) to ((seg +1)/segAmount) * len
            this.segments[seg].x0 = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len * (seg/segAmountByLevel)
            this.segments[seg].y0 = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len * (seg/segAmountByLevel)
            this.segments[seg].xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len * ((seg +1)/segAmountByLevel)
            this.segments[seg].yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len * ((seg +1)/segAmountByLevel)
            // linearly change lineWidth for each segment 
            this.segments[seg].width = this.lineWidth + ((segAmountByLevel - seg + 1) / segAmountByLevel) * (this.lineWidth/widthMultiplier - this.lineWidth) // this.lineWidth/widthMultiplier makes width as +1 lvl
        }
    } // Branch constructor

    makeChildBranch(angleDiff: number, levelShift: number) {
        let childBranch: Branch = new Branch (this, this.xF, this.yF, this.len*lenMultiplier, angleDiff, this.lineWidth*widthMultiplier, levelShift)
        this.children.push(childBranch)
        return childBranch
    }

    // make levelshifted Branch at random segment
    makeGrandChildBranch(angleDiff: number, levelShift: number) {
        let randomSegmentIndex = Math.floor(Math.random()*this.segments.length)
        let grandChildBranch: Branch = new Branch (this, this.segments[randomSegmentIndex].xF, this.segments[randomSegmentIndex].yF, this.len*lenMultiplier, angleDiff, this.lineWidth*widthMultiplier, levelShift)
        this.occasionalBranches ++
        this.children.push(grandChildBranch)
        return grandChildBranch
    }

    drawBranch() {
        // Add the gradient 
        const gradient = ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF);
        gradient.addColorStop(0, 'rgb(10,' + (10 + 10*this.level) + ', 0)');
        gradient.addColorStop(1, 'rgb(10,' + (20 + 10*this.level) + ', 0)');

        // gradient.addColorStop(0, 'rgb(10,0,' + (10 + 5*this.level)  + ')');
        // gradient.addColorStop(1, 'rgb(10,0,' + (20 + 5*this.level)  + ')');
        ctx.strokeStyle = gradient
        // ctx.strokeStyle = 'rgb(10,' + (40 + 10*this.level) + ', 0)'

        ctx.lineCap = "round";
        ctx.lineWidth = this.lineWidth
        ctx.beginPath();
        ctx.moveTo(this.x0, this.y0)
        ctx.lineTo(this.xF, this.yF)
        // ctx.fillStyle = 'white'
        // ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF+this.x0)/2 + 10, (this.y0+this.yF)/2)
        ctx.stroke()
        // console.log('drawBranch')
        ctx.closePath()
    }

    drawBranchBySegments() {
        // gradient color for the whole branch
        const gradient = ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF);
        // gradient.addColorStop(0, 'rgb(80,' + (10 + 10*this.level) + ', 0)');
        // gradient.addColorStop(1, 'rgb(80,' + (20 + 10*this.level) + ', 0)');

        gradient.addColorStop(0, 'rgb(50,' + (12*this.parent.level) + ', 0)');
        gradient.addColorStop(1, 'rgb(50,' + (12*this.level) + ', 0)');

        // gradient.addColorStop(0, 'rgb(10,' + (10 + 10*this.level) + ',' + (100*this.levelShift) + ')' );
        // gradient.addColorStop(1, 'rgb(10,' + (20 + 10*this.level) + ',' + (100*this.levelShift) + ')' );
        ctx.strokeStyle = gradient
        ctx.lineCap = "round";

        ctx.lineWidth = this.segments[this.drawnSegments].width
        ctx.beginPath();
        ctx.moveTo(this.segments[this.drawnSegments].x0, this.segments[this.drawnSegments].y0)
        ctx.lineTo(this.segments[this.drawnSegments].xF, this.segments[this.drawnSegments].yF)
        ctx.stroke()
        ctx.closePath()

        // ctx.shadowColor = 'black'
        // ctx.shadowOffsetX = 10
        // ctx.shadowOffsetY = 10
        // ctx.shadowBlur = 5

        this.drawnSegments ++

        // ADD LEAF - many conditions ahead
        if (Math.random() < leafProbability && this.level >= tree.maxLevel-1 && this.segments.length > this.drawnSegments) {
            let lineWidth = this.segments[this.drawnSegments].width

            if (this.drawnSegments % 4 === 0) {
                //recalculate leaf starting point to match the segment width
                let x0Leaf = this.segments[this.drawnSegments].x0 - Math.cos(this.angle/180* Math.PI) * lineWidth/2
                let y0Leaf = this.segments[this.drawnSegments].y0 - Math.sin(this.angle/180* Math.PI) * lineWidth/2
                const leafL = new Leaf (this.segments[this.drawnSegments], x0Leaf, y0Leaf, 35, this.angle -40 - Math.random()*10, 2)
                this.leaves.push(leafL)
                // leafL.drawAllLeafStages()
                leafL.drawLeafStage()
            }
            else if (this.drawnSegments % 2 === 0) {
                //recalculate leaf starting point to match the segment width
                let x0Leaf = this.segments[this.drawnSegments].x0 + Math.cos(this.angle/180* Math.PI) * lineWidth/2
                let y0Leaf = this.segments[this.drawnSegments].y0 + Math.sin(this.angle/180* Math.PI) * lineWidth/2
                const leafR = new Leaf (this.segments[this.drawnSegments], x0Leaf, y0Leaf, 35, this.angle + 40 + Math.random()*10, 2)
                this.leaves.push(leafR)
                // leafR.drawAllLeafStages()
                leafR.drawLeafStage()
            }
        }
    }
}

class Tree {
    constructor(
        readonly initX: number,
        readonly initY: number,
        readonly initLen: number,
        readonly initAngle: number,
        readonly maxLevel: number = maxLevelGlobal,
        readonly branchingProbability: number = 0.8,
        public allBranches: [Branch[]] = [[]],
    ){
        const startTime = Date.now()
        this.allBranches[0] = [new Branch (root, initX, initY, initLen, initAngle, trunkWidth)]   //save trunk as 0lvl branch
        // append array for every level ahead. Needed for levelShifted branches
        for (let lvl = 0; lvl < this.maxLevel; lvl++) {
            this.allBranches.push([]) //
        }
        // console.log(this.allBranches)

        for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
            // prob should = 1 for level 0 (trunk) 
            // this variable lowers branching probability with level. In range from 1 to branchingProbability linearly
            let branchingProbabilityByLevel = this.branchingProbability + ( (1-branchingProbability) * ((this.maxLevel-currLvl)/this.maxLevel) )
            let occasionalBranchingProbability = ((this.maxLevel-currLvl+1)/this.maxLevel) // always spawn at lvl 0
            // console.log(branchingProbabilityByLevel, currLvl)
            // this.allBranches.push([]) // push empty array to fill it by the forEach loop
            this.allBranches[currLvl].forEach( element => {
                // MAKE BRANCHES
                if (Math.random() < branchingProbabilityByLevel){
                    this.allBranches[currLvl+1].push(element.makeChildBranch(rebranchingAngle + Math.random()*rebranchingAngle, 0))
                }
                if (Math.random() < branchingProbabilityByLevel){
                    this.allBranches[currLvl+1].push(element.makeChildBranch(-rebranchingAngle - Math.random()*rebranchingAngle, 0))
                }
                // OCCASIONAL BRANCHING WITH LEVEL SHIFT (children level is not parent level + 1)
                // compare occasionalBranches to occasionalBranchesLimit  
                if (Math.random() < occasionalBranchingProbability && element.occasionalBranches < occasionalBranchesLimit) {
                    // random level shift
                    let levelShift = 1 + Math.round(Math.random()*2)
                    // console.log('occasional branching')
                    if (element.level + 1 + levelShift < this.maxLevel) {
                        const occasionalBranch = element.makeGrandChildBranch(-rebranchingAngle + Math.random()*2*rebranchingAngle, levelShift)                       
                        this.allBranches[currLvl+1+levelShift].push(occasionalBranch)
                        // console.log('occasional, lvl =' + (currLvl+levelShift))
                    }
                }
            })
        }
        console.log('Tree constructed in ' + (Date.now()- startTime) +  ' ms')
    }// constructor end

    drawTheTree() {
        const startTime = Date.now()
        for (let currLvl = 0; currLvl <= this.maxLevel; currLvl++) {
            // console.log(this.allBranches[currLvl])
            this.allBranches[currLvl].forEach( (element) => {
                element.drawBranch()
            })
        }
        console.log('drawTheTree in ' + (Date.now()- startTime) +  ' ms')
    }
}

class Root {
    constructor(
        public angle: number = 0, // Rotates the tree
        public level: number = -1,
        // public lineWidth: number = trunkWidth*2
    ){
}}

class Leaf {
    constructor (
        public parentSegment: {x0: number, y0: number, xF: number, yF: number, width: number}, // parent branch
        public x0: number,
        public y0: number,
        public len: number,
        public angle: number,
        public lineWidth: number = 4,
        public xF: number = 0,
        public yF: number  = 0,
        public maxStages = 4,
        public currentStage = 0,
        public allStages: {stageLen:number, xF: number, yF: number, xFPetiole: number, yFPetiole: number, xR1: number, yR1: number, xL1: number, yL1: number, xR2: number, yR2: number, xL2: number, yL2: number}[] = [],
        public ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D // CHANGE THAT. Initialize something, but maybe not that much
    ) {
        // final len in final stage
        this.xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len
        this.yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len

        const canvasLeaf = document.body.appendChild(document.createElement("canvas"))
        canvasLeaf.classList.add('leafCanvas');
        this.ctx = canvasLeaf.getContext('2d') as CanvasRenderingContext2D
        canvasLeaf.style.left = this.x0.toString() + 'px'
        canvasLeaf.style.top = this.y0.toString() + 'px'

        // canvasLeaf.style.rotate = this.angle.toString() + 'deg'

        canvasLeaf.style.width = '10px'
        canvasLeaf.style.height = '10px'
        // canvasLeaf.style.width = this.len.toString() + 'px'
        // canvasLeaf.style.height = this.len.toString() + 'px'

        for (let stg=0; stg<this.maxStages; stg++) {
            // push zeros to fill the object
            this.allStages.push({stageLen:0, xF: 0, yF: 0, xFPetiole: 0, yFPetiole: 0, xR1: 0, yR1: 0, xL1: 0, yL1: 0, xR2: 0, yR2: 0, xL2: 0, yL2: 0})

            this.allStages[stg].stageLen = this.len * (stg/this.maxStages)
            // console.log(this.allStages[stg].stageLen)
            let stageLen =  this.allStages[stg].stageLen
            // console.log(stageLen)

            // CALCULATE TIP (FINAL) COORDINATES. LEAF'S MAIN NERVE ENDS HERE
            this.allStages[stg].xF = this.x0 + Math.sin(this.angle/180* Math.PI) * stageLen
            this.allStages[stg].yF = this.y0 - Math.cos(this.angle/180* Math.PI) * stageLen
        
            // PETIOLE'S END COORDS
            this.allStages[stg].xFPetiole = this.x0 + Math.sin(this.angle/180* Math.PI) * stageLen * petioleLenRatio
            this.allStages[stg].yFPetiole = this.y0 - Math.cos(this.angle/180* Math.PI) * stageLen * petioleLenRatio

            // 0.5 is no rotation. 0-1 range
            let rotateLeafRightFrom0To1 = 0.35 + Math.random()*0.30 + Math.sin(this.angle/180* Math.PI)*0.3 

            // BEZIER CURVES - AXIS 1
            const axis1 = this.calcBezierPointsForPerpendicularAxis(axis1LenRatio, axis1WidthRatio, rotateLeafRightFrom0To1, stg)
            // console.log(axis1)
            // BEZIER CURVES - AXIS 2
            const axis2 = this.calcBezierPointsForPerpendicularAxis(axis2LenRatio, axis2WidthRatio, rotateLeafRightFrom0To1, stg)
            // console.log(axis2)

            // FILL UP THIS STAGE
            this.allStages[stg].xR1 = axis1.xR
            this.allStages[stg].yR1 = axis1.yR
            this.allStages[stg].xL1 = axis1.xL
            this.allStages[stg].yL1 = axis1.yL
        // ____________
            this.allStages[stg].xR2 = axis2.xR
            this.allStages[stg].yR2 = axis2.yR
            this.allStages[stg].xL2 = axis2.xL
            this.allStages[stg].yL2 = axis2.yL
            

            // console.log(this.allStages)
        }
        // console.log(this)
    } //Leaf constructor

    calcBezierPointsForPerpendicularAxis (axisLenRatio: number, axisWidthRatio: number, moveAxis:number, index: number) {
        let x0Axis = this.x0 + Math.sin(this.angle/180* Math.PI) *   this.allStages[index].stageLen * axisLenRatio
        let y0Axis = this.y0 - Math.cos(this.angle/180* Math.PI) *   this.allStages[index].stageLen * axisLenRatio
        // calculate points on line perpendiuclar to the main nerve
        let xR =  x0Axis + Math.sin((90 + this.angle)/180* Math.PI) *   this.allStages[index].stageLen * axisWidthRatio * (moveAxis) // /2 because its only one half
        let yR =  y0Axis - Math.cos((90 + this.angle)/180* Math.PI) *   this.allStages[index].stageLen * axisWidthRatio * (moveAxis)
        let xL =  x0Axis + Math.sin((-90 + this.angle)/180* Math.PI) *   this.allStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        let yL =  y0Axis - Math.cos((-90 + this.angle)/180* Math.PI) *   this.allStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        return {xR: xR, yR: yR, xL: xL, yL: yL}
    }

    // drawAllLeafStages () {
    //     for (let i = 0; i < this.maxStages; i++) {
    //         ctx.beginPath();
    //         ctx.strokeStyle = 'rgb(10,60,0)'
    //         //MAIN NERVE
    //         ctx.moveTo(this.x0, this.y0)
    //         ctx.lineTo(this.allStages[i].xF, this.allStages[i].yF)

    //         // ctx.lineWidth = this.lineWidth * (this.currentStage/this.maxStages)
    //         ctx.stroke()
    //         ctx.closePath()

    //         // BEZIER CURVES FOR BOTH SIDES OF A LEAF
    //         ctx.beginPath();
    //         ctx.moveTo(this.allStages[i].xFPetiole, this.allStages[i].yFPetiole)
    //         // right side of a leaf
    //         ctx.bezierCurveTo(this.allStages[i].xR1, this.allStages[i].yR1, this.allStages[i].xR2, this.allStages[i].yR2, this.allStages[i].xF, this.allStages[i].yF)
    //         ctx.moveTo(this.allStages[i].xFPetiole, this.allStages[i].yFPetiole)
    //         // left side of a leaf
    //         ctx.bezierCurveTo(this.allStages[i].xL1, this.allStages[i].yL1, this.allStages[i].xL2, this.allStages[i].yL2, this.allStages[i].xF, this.allStages[i].yF)
    //         ctx.closePath()

    //         ctx.fillStyle = 'rgb(10,80,0)'
    //         ctx.fill()
    //         ctx.stroke()
    //         // console.log('stageDraw')
    //     }
    // }

    drawLeafStage () {
        // ctx2.save()
        // ctx2.rotate(this.angle)
        // ctx2.clearRect(this.x0, this.y0, 100, this.len)
        // ctx2.clearRect(0, 0, canvas2.width, canvas2.height)
        // ctx2.restore()

        // this.ctx.moveTo(this.x0, this.y0)

        ctx2.beginPath();
        ctx2.strokeStyle = 'rgb(10,60,0)'
        //MAIN NERVE
        ctx2.moveTo(this.x0, this.y0)
        ctx2.lineTo(this.allStages[this.currentStage].xF, this.allStages[this.currentStage].yF)

        ctx2.stroke()
        ctx2.closePath()

        // BEZIER CURVES FOR BOTH SIDES OF A LEAF
        ctx2.beginPath();
        ctx2.moveTo(this.allStages[this.currentStage].xFPetiole, this.allStages[this.currentStage].yFPetiole)
        // right side of a leaf
        ctx2.bezierCurveTo(this.allStages[this.currentStage].xR1, this.allStages[this.currentStage].yR1, this.allStages[this.currentStage].xR2, this.allStages[this.currentStage].yR2, this.allStages[this.currentStage].xF, this.allStages[this.currentStage].yF)
        ctx2.moveTo(this.allStages[this.currentStage].xFPetiole, this.allStages[this.currentStage].yFPetiole)
        // left side of a leaf
        ctx2.bezierCurveTo(this.allStages[this.currentStage].xL1, this.allStages[this.currentStage].yL1, this.allStages[this.currentStage].xL2, this.allStages[this.currentStage].yL2, this.allStages[this.currentStage].xF, this.allStages[this.currentStage].yF)
        ctx2.closePath()

        ctx2.fillStyle = 'rgb(10,80,0)'
        ctx2.fill()
        ctx2.stroke()
        
        // console.log('drawLeafStage')

        this.currentStage ++
    }

}

// _________ INITIALIZE THE TREE _________
// Root just acts as a parent element for the trunk. 
// With the root there is no need for checking for parent element in Branch constructor
const root = new Root ()
const tree = new Tree (canvas.width/2, canvas.height, trunkLen, 0) // initialize tree with trunk params. TRUNK LENGTH HERE
// tree.drawTheTree() //all at once
console.log(tree.allBranches)
// const leafTest = new Leaf (250, 200, 150, 180)
// leafTest.drawLeaf()


let branchesAll = 0
tree.allBranches.forEach( level => {
    branchesAll += level.length
} )
console.log('branches amount = ' + branchesAll)

// _________ ANIMATE SEGMENTS _________
let lvl = 0
let lastTime = 0
let accumulatedTime = 0
const timeLimit = 10

let thisForEachCompleted = 0
let branchesCompletedThisLvl = 0

function animateTheTree(timeStamp: number) {
    const timeDelta = timeStamp - lastTime
    lastTime = timeStamp
    
    // BREAK THE LOOP IF REACHED MAX LVL
    if (lvl > tree.maxLevel) {
        console.log('___Animation_in___' + timeStamp + 'ms___')
        return
    }

    // DRAW A FRAME IF TIMELIMIT PASSED
    if (accumulatedTime >= timeLimit){
        //for every branch
        tree.allBranches[lvl].forEach(branch => {
            // if this branch is completly drawn 
            if (branch.drawnSegments >= branch.segments.length) {
                thisForEachCompleted ++
            }
            // if not, draw it
            else if (branch.drawnSegments < branch.segments.length) {
                branch.drawBranchBySegments()
                accumulatedTime = 0
            }
            
            // LEAVES
            if (branch.leaves) {
                branch.leaves.forEach( (leaf) => {
                    // leaf.currentStage > 0 to wait for a segment to rise
                    if (leaf.currentStage > 0 && leaf.currentStage < leaf.maxStages) {
                        leaf.drawLeafStage()
                    }
                } )
            }

        })
        branchesCompletedThisLvl = thisForEachCompleted
        thisForEachCompleted = 0

        // go next level if completed all the branches at this frame
        if (branchesCompletedThisLvl === tree.allBranches[lvl].length){
            branchesCompletedThisLvl = 0
            lvl++
        // console.log('lvl = ' + lvl)
        }
    }
    //OR ACCUMULATE PASSED TIME
    else if (accumulatedTime < timeLimit){
        accumulatedTime += timeDelta
    }

    requestAnimationFrame(animateTheTree)

    // if (Math.floor(1000/timeDelta) < 50){
    //     console.log(Math.floor(1000/timeDelta) + ' FPS!!!') // FPS ALERT
    // }
}
// animate
animateTheTree(0)
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

}) //window.addEventListener('load', function(){ }) ends here

