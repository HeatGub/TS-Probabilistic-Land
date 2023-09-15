// START ON LOAD
window.addEventListener('load', function() {
// ________________________________________ GLOBALS ________________________________________
const canvas = document.getElementById('canvasBranches') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
// const canvasContainer = document.getElementById('canvasContainer')as HTMLCanvasElement
// const canvas2 = document.getElementById('canvas2') as HTMLCanvasElement;
// const ctx2 = canvas2.getContext('2d') as CanvasRenderingContext2D
// const canvas2 = document.body.appendChild(document.createElement("canvas"));
// ctx.globalAlpha = 0.3;

const segmentingLen = 25
const trunkLen = 200
const trunkWidth = 60
const lenMultiplier = 0.75
const widthMultiplier = 0.7
const rebranchingAngle = 19
const maxLevelGlobal = 6
const occasionalBranchesLimit = 0.9
// AXIS 1 WILL BE THE WIDER ONE. BOTH AXES ARE PERPENDICULAR TO THE LEAF'S MAIN NERVE (x0,y0 - xF,yF)
// ratio is relative to Leaf's this.len
const axis1WidthRatio = 1
const axis2WidthRatio  = 0.5
const axis1LenRatio = -0.15
const axis2LenRatio = 0.5
const petioleLenRatio = 0.33 //of the whole length
const leafyLevels = 4
const globalLeafProbability = 0.2
const growingLeavesList: Leaf[] = []

//  SET CANVAS SIZES AND CHANGE THEM AT WINDOW RESIZE
canvas.width = window.innerWidth
canvas.height = window.innerHeight

window.addEventListener('resize', function() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    // canvasContainer.style.width = window.innerWidth + 'px'
    // canvasContainer.style.height = window.innerHeight + 'px'
    tree.drawTheTree() // tree possibly not ready at resize
})
// ________________________________________ GLOBALS ________________________________________

// ________________________________________ BRANCH ________________________________________
class Branch {
    constructor(
        public parent: Branch|Root, // parent branch or root
        public x0: number,
        public y0: number,
        public len: number,
        public angle: number,
        public branchWidth: number,
        public levelShift: number = 0,
        public xF: number = 0, //could be ? but then lineTo errors with null
        public yF: number  = 0,
        public level: number = 0,
        public children: Branch[] = [], // list of children branches
        public segments: { x0: number, y0: number, xF: number, yF: number, width: number, leaves: Leaf[] }[] = [], // segments endpoints to draw lines between
        public drawnSegments: number = 0, //to track branch drawing progress
        public occasionalBranches = 0,
        // public leaves: Leaf[] = []
    ){
        this.parent = parent
        // console.log(this.leaves)

        // RECALCULATE LEN AND WIDTH WITH levelShift
        this.level = this.parent.level + 1 + this.levelShift
        // if (this.levelShift > 0) console.log(this.levelShift)
        if (this.level > maxLevelGlobal) console.log(this.level)

        // Occasional branch length (or width) = orig.len * lenMultipl^levelShift
        this.branchWidth = this.branchWidth * Math.pow(widthMultiplier, this.levelShift)
        this.len = this.len * Math.pow(lenMultiplier, this.levelShift)
        this.len = this.len + this.len*Math.random()*0.15  //randomize len

        // recalculate the angle according to parent branch first 
        this.angle = this.parent.angle + this.angle
        // THEN CALCULATE BRANCH TIP (FINAL) COORDINATES
        this.xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len
        this.yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len

        // ____________ SEGMENTING A BRANCH ____________
        let segAmountByLevel = Math.ceil( ((trunkLen*(Math.pow(lenMultiplier, this.level))) / segmentingLen) + (this.level/2) )
        // console.log(segAmountByLevel)

        for (let seg=0; seg < segAmountByLevel; seg++){
            this.segments.push({x0: 0, y0: 0, xF: 0, yF: 0, width: 0, leaves: []})
            // Calculate coordinates analogically to branch xF yF, but for shorter lengths. 
            // segment is in range from (seg/segAmount) to ((seg +1)/segAmount) * len
            this.segments[seg].x0 = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len * (seg/segAmountByLevel)
            this.segments[seg].y0 = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len * (seg/segAmountByLevel)
            this.segments[seg].xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len * ((seg +1)/segAmountByLevel)
            this.segments[seg].yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len * ((seg +1)/segAmountByLevel)
            // linearly change branchWidth for each segment 
            this.segments[seg].width = this.branchWidth + ((segAmountByLevel - seg + 1) / segAmountByLevel) * (this.branchWidth/widthMultiplier - this.branchWidth) // this.branchWidth/widthMultiplier makes width as +1 lvl

            // _________________ ADD LEAVES AT SEGMENTS _________________
            if (maxLevelGlobal - leafyLevels < this.level && Math.random() < globalLeafProbability && seg >= segAmountByLevel/6) { // seg >= segAmountByLevel/6  to disable appearing leaves at the very beginning (overlapping branches)
                let segmentWidth = this.segments[seg].width
                if (seg % 2 === 0) {
                    //recalculate leaf starting point to match the segment width
                    const x0Leaf  = this.segments[seg].x0 - Math.cos(this.angle/180* Math.PI) * segmentWidth/2
                    const y0Leaf  = this.segments[seg].y0 - Math.sin(this.angle/180* Math.PI) * segmentWidth/2
                    const leafL = new Leaf (this.segments[seg], x0Leaf , y0Leaf , 30, this.angle -40 - Math.random()*10)
                    growingLeavesList.push(leafL)
                    this.segments[seg].leaves.push(leafL)
                    // console.log('L ')
                }
                else if (seg % 1 === 0) {
                    //recalculate leaf starting point to match the segment width
                    const x0Leaf  = this.segments[seg].x0 + Math.cos(this.angle/180* Math.PI) * segmentWidth/2
                    const y0Leaf  = this.segments[seg].y0 + Math.sin(this.angle/180* Math.PI) * segmentWidth/2
                    const leafR = new Leaf (this.segments[seg], x0Leaf , y0Leaf , 30, this.angle + 40 + Math.random()*10)
                    growingLeavesList.push(leafR)
                    this.segments[seg].leaves.push(leafR)
                    // console.log('   R ')
                }
            }
        }
    } // Branch constructor

    makeChildBranch(angleDiff: number, levelShift: number) {
        let childBranch: Branch = new Branch (this, this.xF, this.yF, this.len*lenMultiplier, angleDiff, this.branchWidth*widthMultiplier, levelShift)
        this.children.push(childBranch)
        return childBranch
    }

    // make levelshifted Branch at random segment
    makeGrandChildBranch(angleDiff: number, levelShift: number) {
        let randomSegmentIndex = Math.floor(Math.random()*this.segments.length)
        let grandChildBranch: Branch = new Branch (this, this.segments[randomSegmentIndex].xF, this.segments[randomSegmentIndex].yF, this.len*lenMultiplier, angleDiff, this.branchWidth*widthMultiplier, levelShift)
        this.occasionalBranches ++
        this.children.push(grandChildBranch)
        return grandChildBranch
    }

    drawBranch() {
        // Add the gradient 
        const gradient = ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF)
        gradient.addColorStop(0, 'rgb(10,' + (10 + 10*this.level) + ', 0)')
        gradient.addColorStop(1, 'rgb(10,' + (20 + 10*this.level) + ', 0)')
        ctx.strokeStyle = gradient
        ctx.lineCap = "round";
        ctx.lineWidth = this.branchWidth
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
        const gradient = ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF)
        // gradient.addColorStop(0, 'rgb(80,' + (10 + 10*this.level) + ', 0)')
        // gradient.addColorStop(1, 'rgb(80,' + (20 + 10*this.level) + ', 0)')
        gradient.addColorStop(0, 'rgb(50,' + (12*this.parent.level) + ', 0)')
        gradient.addColorStop(1, 'rgb(50,' + (12*this.level) + ', 0)')
        // gradient.addColorStop(0, 'rgb(10,' + (10 + 10*this.level) + ',' + (100*this.levelShift) + ')' )
        // gradient.addColorStop(1, 'rgb(10,' + (20 + 10*this.level) + ',' + (100*this.levelShift) + ')' )
        // ctx.shadowColor = 'black'
        // ctx.shadowOffsetX = 10
        // ctx.shadowOffsetY = 10
        // ctx.shadowBlur = 5
        ctx.strokeStyle = gradient
        ctx.lineCap = "round"

        ctx.lineWidth = this.segments[this.drawnSegments].width
        ctx.beginPath();
        ctx.moveTo(this.segments[this.drawnSegments].x0, this.segments[this.drawnSegments].y0)
        ctx.lineTo(this.segments[this.drawnSegments].xF, this.segments[this.drawnSegments].yF)
        ctx.stroke()
        ctx.closePath()

        //  CHANGE LEAF STATE TO GROWING
        if (this.segments[this.drawnSegments].leaves.length > 0) { // if there are any leaves on this segment, let them grow from now on
            this.segments[this.drawnSegments].leaves.forEach( (leaf) => {leaf.state = "growing"} )
            // console.log("{leaf.state = growing}")
        }

        this.drawnSegments ++
    }
}
// ________________________________________ BRANCH ________________________________________

// ________________________________________ TREE ________________________________________
class Tree {
    constructor(
        readonly initX: number,
        readonly initY: number,
        readonly initLen: number,
        readonly initAngle: number,
        readonly maxLevel: number = maxLevelGlobal,
        readonly branchingProbability: number = 0.8,
        public allBranches: [Branch[]] = [[]],
        // public growingLeavesList: Leaf[] = [],
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
                // console.log(element.branchWidth)
            })
        }
        console.log('drawTheTree in ' + (Date.now()- startTime) +  ' ms')
    }
}
// ________________________________________ TREE ________________________________________

// ________________________________________ ROOT ________________________________________
class Root {
    constructor(
        public angle: number = 0, // Rotates the tree
        public level: number = -1,
    ){
}}
// ________________________________________ ROOT ________________________________________

// ________________________________________ LEAF ________________________________________
class Leaf {
    constructor (
        public parentSeg: {x0: number, y0: number, xF: number, yF: number, width: number}, // parent segment
        public x0: number,
        public y0: number,
        public len: number,
        public angle: number,
        public lineWidth: number = 2,
        public xF: number = 0,
        public yF: number  = 0,
        public maxStages = -1 + 2,
        public currentStage = 0,
        public allStages: {stageLen:number, xF: number, yF: number, xFPetiole: number, yFPetiole: number, xR1: number, yR1: number, xL1: number, yL1: number, xR2: number, yR2: number, xL2: number, yL2: number}[] = [],
        public canvas = document.body.appendChild(document.createElement("canvas")), // create canvas
        public ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D, // CHANGE THAT. Initialize something, but maybe not that much
        public canvasCoords = {x: 0, y: 0}, // canvasTopLeftCorner
        public x0rel = 0, // relative coordinates (for the leaf canvas positioning)
        public y0rel = 0,
        public state : "hidden" | "growing" | "grown" = "hidden"
    ) {
        // RESIZE CANVAS (canvasCoords and 0rels depend on it)
        this.canvas.width = this.len
        this.canvas.height = this.len
        // final len in final stage
        this.xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len
        this.yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len
        // top left corner of the canvas
        this.canvasCoords.x = (this.x0 + this.xF)/2 - this.canvas.width/2
        this.canvasCoords.y = (this.y0 + this.yF)/2 - this.canvas.height/2
        // relative leaf starting coords (for a smaller canvas)
        this.x0rel = this.x0 - this.canvasCoords.x
        this.y0rel = this.y0 - this.canvasCoords.y

        // MOVE CANVAS 
        this.canvas.style.left = this.canvasCoords.x + 'px'
        this.canvas.style.top = this.canvasCoords.y + 'px'
        this.canvas.classList.add('leafCanvas')
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        this.ctx.lineWidth = this.lineWidth

        // LEAF STAGES
        for (let stg=0; stg <= this.maxStages; stg++) {
            // push zeros to fill the object
            this.allStages.push({stageLen:0, xF: 0, yF: 0, xFPetiole: 0, yFPetiole: 0, xR1: 0, yR1: 0, xL1: 0, yL1: 0, xR2: 0, yR2: 0, xL2: 0, yL2: 0})

            this.allStages[stg].stageLen = this.len * ((stg+1)/(this.maxStages+1))  // +1 to make stage 0 leaf longer than 0 
            // console.log(this.allStages[stg].stageLen)
            let stageLen =  this.allStages[stg].stageLen

            // CALCULATE TIP (FINAL) COORDINATES. LEAF'S MAIN NERVE ENDS HERE
            this.allStages[stg].xF = this.x0rel + Math.sin(this.angle/180* Math.PI) * stageLen
            this.allStages[stg].yF = this.y0rel - Math.cos(this.angle/180* Math.PI) * stageLen
        
            // PETIOLE'S END COORDS
            this.allStages[stg].xFPetiole = this.x0rel + Math.sin(this.angle/180* Math.PI) * stageLen * petioleLenRatio
            this.allStages[stg].yFPetiole = this.y0rel - Math.cos(this.angle/180* Math.PI) * stageLen * petioleLenRatio

            // 0.5 is no rotation. 0-1 range
            let rotateLeafRightFrom0To1 = 0.35 + Math.random()*0.30 + Math.sin(this.angle/180* Math.PI)*0.3

            // BEZIER CURVES - AXIS 1
            const axis1 = this.calcBezierPointsForPerpendicularAxis(axis1LenRatio, axis1WidthRatio, rotateLeafRightFrom0To1, stg)
            // BEZIER CURVES - AXIS 2
            const axis2 = this.calcBezierPointsForPerpendicularAxis(axis2LenRatio, axis2WidthRatio, rotateLeafRightFrom0To1, stg)

            // FILL UP THIS STAGE
            this.allStages[stg].xR1 = axis1.xR
            this.allStages[stg].yR1 = axis1.yR
            this.allStages[stg].xL1 = axis1.xL
            this.allStages[stg].yL1 = axis1.yL
            this.allStages[stg].xR2 = axis2.xR
            this.allStages[stg].yR2 = axis2.yR
            this.allStages[stg].xL2 = axis2.xL
            this.allStages[stg].yL2 = axis2.yL
        } // LEAF STAGES end
        // console.log(this)
    } //Leaf constructor

    calcBezierPointsForPerpendicularAxis (axisLenRatio: number, axisWidthRatio: number, moveAxis:number, index: number) {
        let x0Axis = this.x0rel + Math.sin(this.angle/180* Math.PI) * this.allStages[index].stageLen * axisLenRatio
        let y0Axis = this.y0rel - Math.cos(this.angle/180* Math.PI) * this.allStages[index].stageLen * axisLenRatio
        // calculate points on line perpendiuclar to the main nerve
        let xR =  x0Axis + Math.sin((90 + this.angle)/180* Math.PI) * this.allStages[index].stageLen * axisWidthRatio * (moveAxis) // /2 because its only one half
        let yR =  y0Axis - Math.cos((90 + this.angle)/180* Math.PI) * this.allStages[index].stageLen * axisWidthRatio * (moveAxis)
        let xL =  x0Axis + Math.sin((-90 + this.angle)/180* Math.PI) * this.allStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        let yL =  y0Axis - Math.cos((-90 + this.angle)/180* Math.PI) * this.allStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        return {xR: xR, yR: yR, xL: xL, yL: yL}
    }

    drawLeafStage () {
        // clear whole previous frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgb(10,30,0)'
        //MAIN NERVE
        this.ctx.moveTo(this.x0rel, this.y0rel)
        this.ctx.lineTo(this.allStages[this.currentStage].xF, this.allStages[this.currentStage].yF)
        this.ctx.stroke()
        this.ctx.closePath()

        // BEZIER CURVES FOR BOTH SIDES OF A LEAF
        this.ctx.beginPath();
        this.ctx.moveTo(this.allStages[this.currentStage].xFPetiole, this.allStages[this.currentStage].yFPetiole)
        // right side of a leaf
        this.ctx.bezierCurveTo(this.allStages[this.currentStage].xR1, this.allStages[this.currentStage].yR1, this.allStages[this.currentStage].xR2, this.allStages[this.currentStage].yR2, this.allStages[this.currentStage].xF, this.allStages[this.currentStage].yF)
        this.ctx.moveTo(this.allStages[this.currentStage].xFPetiole, this.allStages[this.currentStage].yFPetiole)
        // left side of a leaf
        this.ctx.bezierCurveTo(this.allStages[this.currentStage].xL1, this.allStages[this.currentStage].yL1, this.allStages[this.currentStage].xL2, this.allStages[this.currentStage].yL2, this.allStages[this.currentStage].xF, this.allStages[this.currentStage].yF)
        this.ctx.closePath()

        let greenish = 70 + ((this.maxStages-this.currentStage)/this.maxStages)*180

        this.ctx.fillStyle = 'rgb(10,' + greenish + ',0)'
        this.ctx.fill()
        this.ctx.stroke()

        // console.log('drawLeafStage')
    }

}
// ________________________________________ LEAF ________________________________________

// ________________________________________ INITIATIONS ________________________________________
// _________ INITIALIZE THE TREE _________
// Root just acts as a parent element for the trunk. 
// With the root there is no need for checking for parent element in Branch constructor
const root = new Root ()
const tree = new Tree (canvas.width/2, canvas.height-60, trunkLen, 0) // initialize tree with trunk params. TRUNK LENGTH HERE
// tree.drawTheTree() //all at once
console.log(tree.allBranches)
// console.log(growingLeavesList)
// console.log('leaves amount = ' + growingLeavesList.length)


// BRANCH COUNTER
// let branchesAll = 0
// tree.allBranches.forEach( level => {
//     branchesAll += level.length
// } )
// console.log('branches amount = ' + branchesAll)
// ________________________________________ INITIATIONS ________________________________________

// ________________________________________ ANIMATION ________________________________________
let lvl = 0
let lastTime = 0
let accumulatedTime = 0
const timeLimit = 10

let branchesCompletedThisForEach = 0
let branchesCompletedThisLvl = 0

let whileLoopCounter = 0
const leavesPackSize = 5
let currIndex = 0

function animateTheTree(timeStamp: number) {
    const timeDelta = timeStamp - lastTime
    lastTime = timeStamp

    // TILL whileLoopCounter = leavesPackSize AND growingLeavesList.length = 0
    while (whileLoopCounter <= leavesPackSize && growingLeavesList.length > 0) {
        // console.log('len = ' + growingLeavesList.length + ', indx = ' + currIndex)
        let leaf = growingLeavesList[currIndex]

        // GROWN - label as grown if maxStage reached
        if (leaf.currentStage >= leaf.maxStages) {
            leaf.drawLeafStage()
            leaf.state === "grown"
            // console.log('grwn')
            let spliceIndex = growingLeavesList.indexOf(leaf)
            // remove already grown leaf from the growing list
            growingLeavesList.splice(spliceIndex, 1) // 2nd parameter means remove one item only
            // currIndex--
        }
        // GROWING - draw
        else if (leaf.state === "growing" && leaf.currentStage < leaf.maxStages) {
            leaf.drawLeafStage()
            leaf.currentStage ++
            currIndex ++
        }
        // RESET currIndex if LAST LEAF from the list was reached
        if (currIndex === growingLeavesList.length) {
            currIndex = 0
            console.log('currIndex = 0')
        }

        whileLoopCounter ++

    }
    whileLoopCounter = 0


    // ________________ BREAK THE LOOP ________________
    if (lvl > tree.maxLevel && growingLeavesList.length === 0 ) {
        console.log('___Animation_in___' + timeStamp + 'ms___')
        // console.log(growingLeavesList)
        return
    }

    // OR ACCUMULATE PASSED TIME
    else if (accumulatedTime < timeLimit){
        accumulatedTime += timeDelta
    }

    // DRAW A FRAME IF TIMELIMIT PASSED
    else if (accumulatedTime >= timeLimit && lvl <= tree.maxLevel){
        //for every branch
        tree.allBranches[lvl].forEach(branch => {
            // if this branch is completly drawn 
            if (branch.drawnSegments >= branch.segments.length) {
                branchesCompletedThisForEach ++
            }
            // if not, draw it
            else if (branch.drawnSegments < branch.segments.length) {
                branch.drawBranchBySegments()
                accumulatedTime = 0
            }

        }) // forEach end
        branchesCompletedThisLvl = branchesCompletedThisForEach
        branchesCompletedThisForEach = 0

        // go next level if completed all the branches at this frame
        if (branchesCompletedThisLvl === tree.allBranches[lvl].length){
            branchesCompletedThisLvl = 0
            lvl++
        // console.log('lvl = ' + lvl)
        }
    }

    requestAnimationFrame(animateTheTree)

    // if (Math.floor(1000/timeDelta) < 50){
    //     console.log(Math.floor(1000/timeDelta) + ' FPS!!!') // FPS ALERT
    // }
}
animateTheTree(0)
// ________________________________________ ANIMATION ________________________________________

}) //window.addEventListener('load', function(){ }) ends here






// // LEAVES - JUST DRAW EACH 
// growingLeavesList.forEach( (leaf) => {
//     // leaf.currentStage > 0 to wait for a segment to rise
//     if (leaf.currentStage >= leaf.maxStages) {
//         leaf.drawLeafStage()
//         leaf.state === "grown"
//         // thisFrameGrownLeaves ++
//         // console.log('grwn')
//         let spliceIndex = growingLeavesList.indexOf(leaf)
//         // console.log(spliceIndex)
//         // remove already grown leaf from the growing list
//         growingLeavesList.splice(spliceIndex, 1) // 2nd parameter means remove one item only
//     }
//     else if (leaf.state === "growing" && leaf.currentStage < leaf.maxStages) {
//         leaf.drawLeafStage()
//         leaf.currentStage ++
//     }
// } )
// // console.log(growingLeavesList.length)

