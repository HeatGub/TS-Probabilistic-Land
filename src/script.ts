// START ON LOAD
window.addEventListener('load', function() {
// ________________________________________ GLOBALS ________________________________________
// ctx.globalAlpha = 0.3;
const globalCanvasesList = [] as HTMLCanvasElement[]
const canvasContainer = document.getElementById('canvasContainer') as HTMLBodyElement

// HORIZON HEIGHT
const horizonHeight = canvasContainer.clientHeight*0.4
document.documentElement.style.cssText = "--horizonHeight:" + horizonHeight + "px"

// create Branch public shadowSegments, 
const initialsegmentingLen = 20
const trunkLen = 100
const lenMultiplier = 0.9
const trunkWidthAsPartOfLen = 0.3
const widthMultiplier = 0.7
const rebranchingAngle = 18
const maxLevelGlobal = 5
const branchingProbabilityBooster = 1
const occasionalBranchesLimit = 0
const treeDistanceScaling = 0.7 // 0-1

// const shadowSpread = -0.3 // -1 to 0 is shrinked shadow, 0 is shadow straight behind, 
const shadowColor = 'rgba(10, 10, 10, 1)'
// const shadowAngle = -1 // range -1 to +1 works fine. 1 gives 45 angle
const shadowAngleMultiplier = 5
const shadowSpread = 1 // > 0 for now
const blurStrength = 0

// AXIS 1 WILL BE THE WIDER ONE. BOTH AXES ARE PERPENDICULAR TO THE LEAF'S MAIN NERVE (x0,y0 - xF,yF)
// ratio is relative to Leaf's this.len
const axis1WidthRatio = 1
const axis2WidthRatio  = 0.5
const axis1LenRatio = -0.15
const axis2LenRatio = 0.5
const petioleLenRatio = 0.2 //of the whole length
const leafyLevels = 3
const globalLeafProbability = 0.45 // SAME PROBABILITY FOR EACH SIDE
const leafLineWidthAsPartOfLeafLen = 0.05
const leafLenScaling = 1.2

const leavesGrowingOrder = 0.25
const growLimitingLeavesAmount = 10 // branches drawing will stop when this amount of growing leaves is reached
const leafMaxStageGlobal = 10
const whileLoopRetriesEachFrameLeaves = 10 // when that = 1 --> ~1 FPS for leafMaxStageGlobal = 60

//  SET CANVASES SIZES AND CHANGE THEM AT WINDOW RESIZE
window.addEventListener('resize', function() {
    globalCanvasesList.forEach( (canvas) => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    })
    // tree.drawTheTree() // tree possibly not ready at resize
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
        public tree: Tree = parent.tree,
        public shadowSegments: { x0: number, y0: number, xF: number, yF: number, width: number, blur: number}[] = []
    ){
        this.parent = parent
        // console.log(this.leaves)
        // RECALCULATE LEN AND WIDTH WITH levelShift
        this.level = this.parent.level + 1 + this.levelShift

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
        // let segAmountByLevel = Math.ceil( ((trunkLen*(Math.pow(lenMultiplier, this.level))) / initialsegmentingLen) + (this.level) )
        let segAmountByLevel = Math.ceil( ((trunkLen*(Math.pow(lenMultiplier, this.level))) / initialsegmentingLen) + (this.level) )

        for (let seg=0; seg < segAmountByLevel; seg++){
            // EXIT LOOP IF SEGMENT IS NEARLY TOUCHING THE GROUND (this.tree.initY-this.tree.trunkLen/10)
            // this.level > 0 not to affect the trunk
            if (this.level > 0 && seg >= 1  &&  this.segments[seg-1].y0 > (this.tree.initY-this.tree.trunkLen/10) || this.level > 0 && seg >= 1  &&  this.segments[seg-1].yF > (this.tree.initY-this.tree.trunkLen/10)) {
                return
            }

            this.segments.push({x0: 0, y0: 0, xF: 0, yF: 0, width: 0, leaves: []})
            // Calculate coordinates analogically to branch xF yF, but for shorter lengths. 
            // segment is in range from (seg/segAmount) to ((seg +1)/segAmount) * len
            this.segments[seg].x0 = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len * (seg/segAmountByLevel)
            this.segments[seg].y0 = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len * (seg/segAmountByLevel)
            this.segments[seg].xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len * ((seg +1)/segAmountByLevel)
            this.segments[seg].yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len * ((seg +1)/segAmountByLevel)
            // linearly change branchWidth for each segment 
            this.segments[seg].width = this.branchWidth + ((segAmountByLevel - seg + 1) / segAmountByLevel) * (this.branchWidth/widthMultiplier - this.branchWidth) // this.branchWidth/widthMultiplier makes width as +1 lvl

            // // SHADOW SEGMENT
            this.shadowSegments.push({x0: 0, y0: 0, xF: 0, yF: 0, width: 0, blur: 0})
            this.shadowSegments[seg].y0 = this.tree.initY + (this.tree.initY - this.segments[seg].y0) * shadowSpread
            this.shadowSegments[seg].yF = this.tree.initY + (this.tree.initY - this.segments[seg].yF) * shadowSpread
            this.shadowSegments[seg].x0 = this.segments[seg].x0 + (this.tree.initY - this.segments[seg].y0) * shadowSpread * this.tree.shadowAngle
            this.shadowSegments[seg].xF = this.segments[seg].xF + (this.tree.initY - this.segments[seg].yF) * shadowSpread * this.tree.shadowAngle
            this.shadowSegments[seg].width = this.segments[this.drawnSegments].width + ((this.tree.initY - this.segments[this.drawnSegments].y0)*(shadowSpread/200)) + (Math.abs((this.tree.initX - this.segments[this.drawnSegments].x0)))*(shadowSpread/200)
            this.shadowSegments[seg].blur = (this.tree.initY - this.segments[seg].y0) / this.tree.canvas.height* blurStrength
            this.segments[seg].leaves.forEach( (leaf) => {  // pass the same blur to children leaves
                leaf.blur = this.shadowSegments[seg].blur
            } )

            // _________________ ADD LEAVES AT SEGMENT _________________
            // if (maxLevelGlobal - leafyLevels < this.level && seg >= segAmountByLevel/6 && seg % spawnLeafEverySegments === 0) { // seg >= segAmountByLevel/6  to disable appearing leaves at the very beginning (overlapping branches)
            const singleSegmentLength = this.len * (1/segAmountByLevel)
            const spawnLeafEverySegments = Math.ceil(this.tree.minimalDistanceBetweenLeaves / singleSegmentLength)

            if (maxLevelGlobal-leafyLevels < this.level  &&  seg%spawnLeafEverySegments === 0) { // seg >= segAmountByLevel/6  to disable appearing leaves at the very beginning (overlapping branches)
                const thisLeafSize = (this.tree.averageLeafSize*0.7 + this.tree.averageLeafSize*0.3*Math.random()) * leafLenScaling // randomize leaf size

                const leafProbabilityByLevel = globalLeafProbability - globalLeafProbability*((maxLevelGlobal-this.level)/leafyLevels/2) // linearly change probability with level from around globalLeafProbability/2 to globalLeafProbability (for leafy levels)
                // console.log(leafProbabilityByLevel)
    
                // LEFT LEAF
                if (Math.random() < leafProbabilityByLevel) {
                    // recalculate leaf starting point to match the segment width
                    const x0Leaf  = this.segments[seg].x0 - Math.cos(this.angle/180* Math.PI) * this.segments[seg].width/2
                    const y0Leaf  = this.segments[seg].y0 - Math.sin(this.angle/180* Math.PI) * this.segments[seg].width/2
                    const x0LeafShadow  = this.shadowSegments[seg].x0 - Math.cos(this.angle/180* Math.PI) * this.shadowSegments[seg].width/2
                    const y0LeafShadow  = this.shadowSegments[seg].y0 + Math.sin(this.angle/180* Math.PI) * this.shadowSegments[seg].width/2 // opposite sign to (y0Leaf) because shadow leaves are rotated
                    const leafL = new Leaf (this, x0Leaf , y0Leaf , thisLeafSize*0.9, this.angle -40 - Math.random()*10, x0LeafShadow, y0LeafShadow)
                    this.segments[seg].leaves.push(leafL)
                    // console.log('L ')
                }
                // MIDDLE LEAF
                if (Math.random() < leafProbabilityByLevel) {
                    //recalculate leaf starting point to match the segment width
                    // const x0Leaf  = this.segments[seg].x0
                    const x0Leaf  = this.segments[seg].x0 - (Math.cos(this.angle/180* Math.PI) * this.segments[seg].width/4) + Math.random()*(Math.cos(this.angle/180* Math.PI) * this.segments[seg].width/2) // randomize to range 1/4 - 3/4 of segWidth
                    // const y0Leaf  = this.segments[seg].y0 + Math.random()*(Math.sin(this.angle/180* Math.PI) * minimalDistanceBetweenLeaves/2) // randomized
                    const y0Leaf  = this.segments[seg].y0
                    const x0LeafShadow  = this.shadowSegments[seg].x0 - (Math.cos(this.angle/180* Math.PI) * this.shadowSegments[seg].width/4) + Math.random()*(Math.cos(this.angle/180* Math.PI) * this.shadowSegments[seg].width/2)
                    const y0LeafShadow  = this.shadowSegments[seg].y0
                    const leafM = new Leaf (this, x0Leaf , y0Leaf , thisLeafSize, this.angle -10 + Math.random()*20, x0LeafShadow, y0LeafShadow) // slightly bigger than side leaves
                    this.segments[seg].leaves.push(leafM)                 
                    // console.log(' M ')
                }
                // RIGHT LEAF
                if (Math.random() < leafProbabilityByLevel) {
                    //recalculate leaf starting point to match the segment width
                    const x0Leaf  = this.segments[seg].x0 + Math.cos(this.angle/180* Math.PI) * this.segments[seg].width/2
                    const y0Leaf  = this.segments[seg].y0 + Math.sin(this.angle/180* Math.PI) * this.segments[seg].width/2
                    const x0LeafShadow  = this.shadowSegments[seg].x0 + Math.cos(this.angle/180* Math.PI) * this.shadowSegments[seg].width/2
                    const y0LeafShadow  = this.shadowSegments[seg].y0 - Math.sin(this.angle/180* Math.PI) * this.shadowSegments[seg].width/2 // opposite sign
                    const leafR = new Leaf (this, x0Leaf , y0Leaf , thisLeafSize*0.9, this.angle + 40 + Math.random()*10, x0LeafShadow, y0LeafShadow)
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
        const gradient = this.tree.ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF)
        gradient.addColorStop(0, 'rgb(10,' + (10 + 10*this.level) + ', 0)')
        gradient.addColorStop(1, 'rgb(10,' + (20 + 10*this.level) + ', 0)')
        this.tree.ctx.strokeStyle = gradient
        this.tree.ctx.lineCap = "round"
        this.tree.ctx.lineWidth = this.branchWidth
        this.tree.ctx.beginPath();
        this.tree.ctx.moveTo(this.x0, this.y0)
        this.tree.ctx.lineTo(this.xF, this.yF)
        // ctx.fillStyle = 'white'
        // ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF+this.x0)/2 + 10, (this.y0+this.yF)/2)
        this.tree.ctx.stroke()
        // console.log('drawBranch')
        this.tree.ctx.closePath()
    }

    drawBranchBySegments() {
        // gradient color for the whole branch
        const gradient = this.tree.ctx.createLinearGradient(this.x0, this.y0, this.xF, this.yF)
        // gradient.addColorStop(0, 'rgb(80,' + (10 + 10*this.level) + ', 0)')
        // gradient.addColorStop(1, 'rgb(80,' + (20 + 10*this.level) + ', 0)')
        gradient.addColorStop(0, 'rgb(50,' + (12*this.parent.level) + ', 0)')
        gradient.addColorStop(1, 'rgb(50,' + (12*this.level) + ', 0)')
        this.tree.ctx.strokeStyle = gradient
        this.tree.ctx.lineCap = "round"
               
        this.tree.ctx.lineWidth = this.segments[this.drawnSegments].width
        this.tree.ctx.beginPath();
        this.tree.ctx.moveTo(this.segments[this.drawnSegments].x0, this.segments[this.drawnSegments].y0)
        this.tree.ctx.lineTo(this.segments[this.drawnSegments].xF, this.segments[this.drawnSegments].yF)
        this.tree.ctx.stroke()
        this.tree.ctx.closePath()

        //  CHANGE LEAF STATE TO GROWING
        if (this.segments[this.drawnSegments].leaves.length > 0) { // if there are any leaves on this segment, let them grow from now on
            this.segments[this.drawnSegments].leaves.forEach( (leaf) => {
                leaf.state = "growing"
                this.tree.growingLeavesList.push(leaf) // APPEND TO THE GROWING LEAVES LIST
            } )
        }
        this.drawSegmentShadow()
        this.drawnSegments ++
    }

    drawSegmentShadow() {
        this.tree.ctxShadows.strokeStyle = shadowColor
        this.tree.ctxShadows.lineCap = "round"
        this.tree.ctxShadows.lineWidth = this.shadowSegments[this.drawnSegments].width
        this.tree.ctxShadows.filter = 'blur(' + this.shadowSegments[this.drawnSegments].blur + 'px)';
        this.tree.ctxShadows.beginPath();
        this.tree.ctxShadows.moveTo(this.shadowSegments[this.drawnSegments].x0, this.shadowSegments[this.drawnSegments].y0)
        this.tree.ctxShadows.lineTo(this.shadowSegments[this.drawnSegments].xF, this.shadowSegments[this.drawnSegments].yF)
        this.tree.ctxShadows.stroke()
        this.tree.ctxShadows.closePath()
    }
}
// ________________________________________ BRANCH ________________________________________

// ________________________________________ TREE ________________________________________
class Tree {
    constructor(
        readonly initX: number,
        readonly initY: number,
        readonly trunkLen: number,
        readonly shadowAngle:number,
        readonly trunkWidth = trunkLen * trunkWidthAsPartOfLen,
        readonly initAngle: number = 0,
        readonly maxLevel: number = maxLevelGlobal,
        readonly branchingProbability: number = branchingProbabilityBooster,
        public allBranches: [Branch[]] = [[]],
        public growingLeavesList: Leaf[] = [],
        // public canvas = document.getElementById('canvasBranches') as HTMLCanvasElement,
        public canvas = canvasContainer.appendChild(document.createElement("canvas")), // create canvas
        public ctx = canvas.getContext('2d') as CanvasRenderingContext2D,
        public canvasShadows = canvasContainer.appendChild(document.createElement("canvas")), // create canvas for tree shadow
        public ctxShadows = canvasShadows.getContext('2d') as CanvasRenderingContext2D,
        public averageLeafSize = trunkLen/5,
        public minimalDistanceBetweenLeaves = averageLeafSize, // doesnt count the distance between leaves of different branches
    ){
        this.canvas.style.zIndex = String(initY) // higher z-index makes element appear on top
        // SET INITIAL CANVASES SIZE
        this.canvas.classList.add('canvas')
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        globalCanvasesList.push(this.canvas)
        //  SHADOWS CANVAS
        this.canvasShadows.classList.add('canvasShadows')
        this.canvasShadows.width = window.innerWidth
        this.canvasShadows.height = window.innerHeight
        globalCanvasesList.push(this.canvasShadows)

        const root = new Root (this)
        const startTime = Date.now()
        this.allBranches[0] = [new Branch (root, this.initX, this.initY, this.trunkLen, this.initAngle, this.trunkWidth)]   //save trunk as 0lvl branch
        // append array for every level ahead. Needed for levelShifted branches
        for (let i = 0; i < this.maxLevel; i++) {
            this.allBranches.push([]) //
        }
        for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
            // prob should = 1 for level 0 (trunk) 
            // this variable lowers branching probability with level. In range from 1 to branchingProbability linearly
            let branchingProbabilityByLevel = this.branchingProbability + ( (1-branchingProbability) * ((this.maxLevel-currLvl)/this.maxLevel) )
            // console.log(branchingProbabilityByLevel)
            let occasionalBranchingProbability = ((this.maxLevel-currLvl+1)/this.maxLevel) // always spawn at lvl 0
            // console.log(branchingProbabilityByLevel, currLvl)
            // this.allBranches.push([]) // push empty array to fill it by the forEach loop
            this.allBranches[currLvl].forEach( element => {
                // MAKE BRANCHES IF
                if (element.yF < (this.initY - this.trunkLen/10)) { // IF PARENT'S END IS NOT ON THE GROUND LEVEL
                    // branchingProbabilityByLevel check
                    if (Math.random() < branchingProbabilityByLevel){
                        this.allBranches[currLvl+1].push(element.makeChildBranch(rebranchingAngle + Math.random()*rebranchingAngle, 0))
                    }
                    if (Math.random() < branchingProbabilityByLevel){
                        this.allBranches[currLvl+1].push(element.makeChildBranch(-rebranchingAngle - Math.random()*rebranchingAngle, 0))
                    }
                    // OCCASIONAL BRANCHING WITH LEVEL SHIFT (children level is not parent level + 1)
                    // compare occasionalBranches to occasionalBranchesLimit  
                    if (Math.random() < occasionalBranchingProbability && element.occasionalBranches <= occasionalBranchesLimit) {
                        // random level shift
                        let levelShift = 1 + Math.round(Math.random()*2)
                        // console.log('occasional branching')
                        if (element.level + 1 + levelShift < this.maxLevel) {
                            const occasionalBranch = element.makeGrandChildBranch(-rebranchingAngle + Math.random()*2*rebranchingAngle, levelShift)                       
                            this.allBranches[currLvl+1+levelShift].push(occasionalBranch)
                            // console.log('occasional, lvl =' + (currLvl+levelShift))
                        }
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
        public tree: Tree,
        public angle: number = 0, // Rotates the tree
        public level: number = -1,
    ){
}}
// ________________________________________ ROOT ________________________________________

// ________________________________________ LEAF ________________________________________
class Leaf {
    constructor (
        // public parentSeg: {x0: number, y0: number, xF: number, yF: number, width: number}, // parent segment
        public parentBranch: Branch,
        public x0: number,
        public y0: number,
        public len: number,
        public angle: number,
        public x0LeafShadow: number,
        public y0LeafShadow: number,
        public lineWidth: number = len*leafLineWidthAsPartOfLeafLen,
        public xF: number = 0,
        public yF: number  = 0,
        public maxStages = -1 + leafMaxStageGlobal,
        public currentStage = 0,
        public growthStages: {stageLen:number, xF: number, yF: number, xFPetiole: number, yFPetiole: number, xR1: number, yR1: number, xL1: number, yL1: number, xR2: number, yR2: number, xL2: number, yL2: number}[] = [],
        public canvas = canvasContainer.appendChild(document.createElement("canvas")), // create canvas
        public ctx = canvas.getContext('2d') as CanvasRenderingContext2D,
        public canvasCoords = {x: 0, y: 0}, // canvasTopLeftCorner
        public x0rel = 0, // relative coordinates (for the leaf canvas positioning)
        public y0rel = 0,
        public state : "hidden" | "growing" | "grown" = "hidden",
        public tree: Tree = parentBranch.tree,
        public canvasShadow = canvasContainer.appendChild(document.createElement("canvas")),
        public ctxShadow = canvasShadow.getContext('2d') as CanvasRenderingContext2D,
        public shadowStages: {stageLen:number, xF: number, yF: number, xFPetiole: number, yFPetiole: number, xR1: number, yR1: number, xL1: number, yL1: number, xR2: number, yR2: number, xL2: number, yL2: number}[] = [],
        public xFLeafShadow: number = 0,
        public yFLeafShadow: number = 0,
        public shadowCanvasCoords = {x: 0, y: 0}, // canvasTopLeftCorner
        public x0relShadow = 0, // relative coordinates (for the leaf canvas positioning)
        public y0relShadow = 0,
        public shadowLen = 0,
        public blur = 0,
        public colors: {r:number, g: number, b: number} = {r:0, g:0, b:0},
    ) {
        // RESIZE CANVAS (canvasCoords and 0rels depend on it)
        this.canvas.width = this.len*1.4
        this.canvas.height = this.len*1.4
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
        this.canvas.style.zIndex = String(this.tree.initY+1) // z-index of its tree +1

        this.canvas.classList.add('leafCanvas')
        this.ctx.lineWidth = this.lineWidth // petiole width

        // _____________________________ LEAF SHADOW _____________________________
        // this.shadowLen = this.len + (this.tree.initY+this.y0LeafShadow)*shadowSpread/100 + Math.abs((this.tree.initX-this.x0LeafShadow)*shadowSpread/100) // shadow len depends on x and y distance from the tree init coords
        this.shadowLen = this.len + (this.tree.initY-this.y0LeafShadow)*-shadowSpread/80 + Math.abs((this.tree.initX-this.x0LeafShadow)*shadowSpread/80)
        // console.log(-(this.tree.initY - this.y0LeafShadow ))

        this.canvasShadow.width = this.shadowLen * 1.5 // little bit bigger area for blurring
        this.canvasShadow.height = this.shadowLen * 1.5
        // final len in final stage
        this.xFLeafShadow = this.x0LeafShadow + Math.sin(this.angle/180* Math.PI) * this.shadowLen
        this.yFLeafShadow = this.y0LeafShadow + Math.cos(this.angle/180* Math.PI) * this.shadowLen
        // top left corner of the canvas
        this.shadowCanvasCoords.x = (this.x0LeafShadow + this.xFLeafShadow)/2 - this.canvasShadow.width/2
        this.shadowCanvasCoords.y = (this.y0LeafShadow + this.yFLeafShadow)/2 - this.canvasShadow.height/2
        // coords relative to shadow canvas
        this.x0relShadow = this.x0LeafShadow - this.shadowCanvasCoords.x
        this.y0relShadow = this.y0LeafShadow - this.shadowCanvasCoords.y
        this.canvasShadow.style.left = this.shadowCanvasCoords.x + 'px'
        this.canvasShadow.style.top = this.shadowCanvasCoords.y + 'px'
        this.canvasShadow.classList.add('leafShadowCanvas')
        this.ctxShadow.lineCap = "round"

        // CHECK LENGTH
        // console.log(this.len, Math.sqrt((this.xFLeafShadow-this.x0LeafShadow)**2 + (this.yFLeafShadow-this.y0LeafShadow)**2))
        // _____________________________ LEAF SHADOW _____________________________

        // _____________________________ LEAF STAGES _____________________________
        for (let stg=0; stg <= this.maxStages; stg++) {
            // push zeros to fill the object
            this.growthStages.push({stageLen:0, xF: 0, yF: 0, xFPetiole: 0, yFPetiole: 0, xR1: 0, yR1: 0, xL1: 0, yL1: 0, xR2: 0, yR2: 0, xL2: 0, yL2: 0})
            this.growthStages[stg].stageLen = this.len * ((stg+1)/(this.maxStages+1))  // +1 to make stage 0 leaf longer than 0 
            // CALCULATE TIP (FINAL) COORDINATES. LEAF'S MAIN NERVE ENDS HERE
            this.growthStages[stg].xF = this.x0rel + Math.sin(this.angle/180* Math.PI) * this.growthStages[stg].stageLen
            this.growthStages[stg].yF = this.y0rel - Math.cos(this.angle/180* Math.PI) * this.growthStages[stg].stageLen
            // PETIOLE'S END COORDS
            this.growthStages[stg].xFPetiole = this.x0rel + Math.sin(this.angle/180* Math.PI) * this.growthStages[stg].stageLen * petioleLenRatio
            this.growthStages[stg].yFPetiole = this.y0rel - Math.cos(this.angle/180* Math.PI) * this.growthStages[stg].stageLen * petioleLenRatio
            // 0.5 is no rotation. 0-1 range
            // let rotateLeafRightFrom0To1 = 0.35 + Math.sin(this.angle/180* Math.PI)*0.3 + Math.random()*0.30
            let rotateLeafRightFrom0To1 = 0.35 + Math.sin(this.angle/180* Math.PI)*0.3 // move up this line or add randomization
            // BEZIER CURVES - AXIS 1
            const axis1 = this.calcBezierPointsForPerpendicularAxis(axis1LenRatio, axis1WidthRatio, rotateLeafRightFrom0To1, stg)
            // BEZIER CURVES - AXIS 2
            const axis2 = this.calcBezierPointsForPerpendicularAxis(axis2LenRatio, axis2WidthRatio, rotateLeafRightFrom0To1, stg)
            // FILL UP THIS STAGE
            this.growthStages[stg].xR1 = axis1.xR
            this.growthStages[stg].yR1 = axis1.yR
            this.growthStages[stg].xL1 = axis1.xL
            this.growthStages[stg].yL1 = axis1.yL
            this.growthStages[stg].xR2 = axis2.xR
            this.growthStages[stg].yR2 = axis2.yR
            this.growthStages[stg].xL2 = axis2.xL
            this.growthStages[stg].yL2 = axis2.yL

            // ________________ LEAF SHADOW FOR THIS STAGE ________________
            this.shadowStages.push({stageLen:0, xF: 0, yF: 0, xFPetiole: 0, yFPetiole: 0, xR1: 0, yR1: 0, xL1: 0, yL1: 0, xR2: 0, yR2: 0, xL2: 0, yL2: 0})
            this.shadowStages[stg].stageLen = this.shadowLen * ((stg+1)/(this.maxStages+1))
            this.shadowStages[stg].xF = this.x0relShadow + Math.sin(this.angle/180* Math.PI) * this.shadowStages[stg].stageLen
            this.shadowStages[stg].yF = this.y0relShadow + Math.cos(this.angle/180* Math.PI) * this.shadowStages[stg].stageLen
            // PETIOLE'S END COORDS
            this.shadowStages[stg].xFPetiole = this.x0relShadow + Math.sin(this.angle/180* Math.PI) * this.shadowStages[stg].stageLen * petioleLenRatio
            this.shadowStages[stg].yFPetiole = this.y0relShadow + Math.cos(this.angle/180* Math.PI) * this.shadowStages[stg].stageLen * petioleLenRatio

            // let shadowRotateLeafRightFrom0To1 = 0.35 + Math.sin(this.angle/180* Math.PI)*0.3 // move up this line or add randomization

            // BEZIER CURVES - AXIS 1
            const axis1Shadow = this.calcBezierPointsForPerpendicularAxisShadow(axis1LenRatio, axis1WidthRatio, rotateLeafRightFrom0To1, stg)
            // BEZIER CURVES - AXIS 2
            const axis2Shadow = this.calcBezierPointsForPerpendicularAxisShadow(axis2LenRatio, axis2WidthRatio, rotateLeafRightFrom0To1, stg)
            // FILL UP THIS STAGE
            this.shadowStages[stg].xR1 = axis1Shadow.xR
            this.shadowStages[stg].yR1 = axis1Shadow.yR
            this.shadowStages[stg].xL1 = axis1Shadow.xL
            this.shadowStages[stg].yL1 = axis1Shadow.yL
            this.shadowStages[stg].xR2 = axis2Shadow.xR
            this.shadowStages[stg].yR2 = axis2Shadow.yR
            this.shadowStages[stg].xL2 = axis2Shadow.xL
            this.shadowStages[stg].yL2 = axis2Shadow.yL
        }
        // _____________________________ LEAF STAGES _____________________________
    } //Leaf constructor

    calcBezierPointsForPerpendicularAxis (axisLenRatio: number, axisWidthRatio: number, moveAxis:number, index: number) {
        let x0Axis = this.x0rel + Math.sin(this.angle/180* Math.PI) * this.growthStages[index].stageLen * axisLenRatio
        let y0Axis = this.y0rel - Math.cos(this.angle/180* Math.PI) * this.growthStages[index].stageLen * axisLenRatio
        // calculate points on line perpendiuclar to the main nerve
        let xR =  x0Axis + Math.sin((90 + this.angle)/180* Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (moveAxis) // /2 because its only one half
        let yR =  y0Axis - Math.cos((90 + this.angle)/180* Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (moveAxis)
        let xL =  x0Axis + Math.sin((-90 + this.angle)/180* Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        let yL =  y0Axis - Math.cos((-90 + this.angle)/180* Math.PI) * this.growthStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        return {xR: xR, yR: yR, xL: xL, yL: yL}
    }

    calcBezierPointsForPerpendicularAxisShadow (axisLenRatio: number, axisWidthRatio: number, moveAxis:number, index: number) {
        let x0Axis = this.x0relShadow + Math.sin(this.angle/180* Math.PI) * this.shadowStages[index].stageLen * axisLenRatio
        let y0Axis = this.y0relShadow + Math.cos(this.angle/180* Math.PI) * this.shadowStages[index].stageLen * axisLenRatio
        // calculate points on line perpendiuclar to the main nerve
        let xR =  x0Axis + Math.sin((90 + this.angle)/180* Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (moveAxis) // /2 because its only one half
        let yR =  y0Axis + Math.cos((90 + this.angle)/180* Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (moveAxis)
        let xL =  x0Axis + Math.sin((-90 + this.angle)/180* Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        let yL =  y0Axis + Math.cos((-90 + this.angle)/180* Math.PI) * this.shadowStages[index].stageLen * axisWidthRatio * (1-moveAxis)
        return {xR: xR, yR: yR, xL: xL, yL: yL}
    }

    drawLeafStage () {
        // clear whole previous frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(10, 30, 0, 1)'
        //MAIN NERVE
        this.ctx.moveTo(this.x0rel, this.y0rel)
        this.ctx.lineTo(this.growthStages[this.currentStage].xF, this.growthStages[this.currentStage].yF)
        this.ctx.stroke()
        this.ctx.closePath()

        // BEZIER CURVES FOR BOTH SIDES OF A LEAF
        this.ctx.beginPath();
        this.ctx.moveTo(this.growthStages[this.currentStage].xFPetiole, this.growthStages[this.currentStage].yFPetiole)
        // right side of a leaf
        this.ctx.bezierCurveTo(this.growthStages[this.currentStage].xR1, this.growthStages[this.currentStage].yR1, this.growthStages[this.currentStage].xR2, this.growthStages[this.currentStage].yR2, this.growthStages[this.currentStage].xF, this.growthStages[this.currentStage].yF)
        this.ctx.moveTo(this.growthStages[this.currentStage].xFPetiole, this.growthStages[this.currentStage].yFPetiole)
        // left side of a leaf
        this.ctx.bezierCurveTo(this.growthStages[this.currentStage].xL1, this.growthStages[this.currentStage].yL1, this.growthStages[this.currentStage].xL2, this.growthStages[this.currentStage].yL2, this.growthStages[this.currentStage].xF, this.growthStages[this.currentStage].yF)
        this.ctx.closePath()
        let greenish = 70 + ((this.maxStages-this.currentStage)/this.maxStages)*180
        this.ctx.fillStyle = 'rgba(10,' + greenish + ',0, 1)'
        this.ctx.fill()
        this.ctx.stroke()
        this.drawLeafShadow()
    }

    drawLeafShadow () {
        // clear whole previous frame
        this.ctxShadow.clearRect(0, 0, this.canvasShadow.width, this.canvasShadow.height)
        let blur = (this.tree.initY - this.y0) / this.tree.canvas.height* blurStrength
        this.ctxShadow.filter = 'blur(' + blur + 'px)'
        
        // petiole's shadow width
        this.ctxShadow.lineWidth = this.lineWidth + (this.tree.initY-this.y0LeafShadow)*-shadowSpread/1000 + Math.abs((this.tree.initX-this.x0LeafShadow)*shadowSpread/1000)
        this.ctxShadow.beginPath()
        this.ctxShadow.strokeStyle = shadowColor
        // this.ctxShadow.strokeStyle = 'blue'
        //MAIN NERVE
        this.ctxShadow.moveTo(this.x0relShadow, this.y0relShadow)
        this.ctxShadow.lineTo(this.shadowStages[this.currentStage].xF, this.shadowStages[this.currentStage].yF)
        this.ctxShadow.stroke()
        this.ctxShadow.closePath()

        this.ctxShadow.lineWidth = this.lineWidth // thinner line
        // BEZIER CURVES FOR BOTH SIDES OF A LEAF
        this.ctxShadow.beginPath();
        this.ctxShadow.moveTo(this.shadowStages[this.currentStage].xFPetiole, this.shadowStages[this.currentStage].yFPetiole)
        // right side of a leaf
        this.ctxShadow.bezierCurveTo(this.shadowStages[this.currentStage].xR1, this.shadowStages[this.currentStage].yR1, this.shadowStages[this.currentStage].xR2, this.shadowStages[this.currentStage].yR2, this.shadowStages[this.currentStage].xF, this.shadowStages[this.currentStage].yF)
        this.ctxShadow.moveTo(this.shadowStages[this.currentStage].xFPetiole, this.shadowStages[this.currentStage].yFPetiole)
        // left side of a leaf
        this.ctxShadow.bezierCurveTo(this.shadowStages[this.currentStage].xL1, this.shadowStages[this.currentStage].yL1, this.shadowStages[this.currentStage].xL2, this.shadowStages[this.currentStage].yL2, this.shadowStages[this.currentStage].xF, this.shadowStages[this.currentStage].yF)
        this.ctxShadow.closePath()
        this.ctxShadow.fillStyle = shadowColor
        this.ctxShadow.fill()
        this.ctxShadow.stroke()

    }
}
// ________________________________________ LEAF ________________________________________

// ________________________________________ INITIATIONS ________________________________________
// _________ INITIALIZE THE TREE _________
// Root just acts as a parent element for the trunk. 
// With the root there is no need for checking for parent element in Branch constructor
// const tree = new Tree (window.innerWidth/2, window.innerHeight*0.35, trunkLen) // initialize tree with trunk params. TRUNK LENGTH HERE
// tree.drawTheTree() //all at once
// console.log(tree.allBranches)
// console.log(growingLeavesList)
// console.log('leaves amount = ' + growingLeavesList.length)

let alreadyAnimating = false
// PLANT (SPAWN) TREE AT CLICK COORDS
canvasContainer.addEventListener("click", (event) => {
    if (alreadyAnimating === false && event.y > horizonHeight) {
        // console.log(event.x, event.y)
        // TREE DISTANCE SCALING
        let shadowAngle = - (window.innerWidth/2 - event.x) / window.innerWidth * shadowAngleMultiplier
        // let treeTrunkScaledLength = trunkLen + trunkLen * ((event.y - window.innerHeight/2)/ window.innerHeight) * treeDistanceScaling // normal scale at the half of window height
        
        
        let groundHeight = window.innerHeight - horizonHeight
        let groundMiddle = window.innerHeight - (window.innerHeight - horizonHeight)/2
        
        let scaleByTheGroundPosition = (event.y - groundMiddle)/groundHeight*2 // in range -1 to 1
        console.log(scaleByTheGroundPosition)
        
        let treeTrunkScaledLength = trunkLen + trunkLen * scaleByTheGroundPosition * treeDistanceScaling // normal scale at the half of ground canvas
        const tree = new Tree (event.x, event.y, treeTrunkScaledLength, shadowAngle)
        animateTheTree(tree)
    }
})
// ________________________________________ INITIATIONS ________________________________________

// ________________________________________ ANIMATION ________________________________________
function animateTheTree (tree: Tree) {
    document.body.style.cursor = 'wait' // waiting cursor
    alreadyAnimating = true
    let lvl = 0
    let lastTime = 0
    let accumulatedTime = 0
    const timeLimit = 10

    let branchesCompletedThisForEach = 0
    let branchesCompletedThisLvl = 0

    let currIndexLeaves = 0
    let whileLoopCounterLeaves = 0

    function animate(timeStamp: number,) {
        const timeDelta = timeStamp - lastTime
        lastTime = timeStamp

        // TILL whileLoopCounterLeaves = whileLoopRetriesLeaves AND growingLeavesList.length = 0
        while (whileLoopCounterLeaves <= whileLoopRetriesEachFrameLeaves && tree.growingLeavesList.length > 0) {
            // console.log('len = ' + growingLeavesList.length + ', indx = ' + currIndexLeaves)
            let leaf = tree.growingLeavesList[currIndexLeaves]

            // GROWING - DRAW
            if (leaf.state === "growing" && leaf.currentStage < leaf.maxStages) {
                leaf.drawLeafStage()
                leaf.currentStage ++
                currIndexLeaves ++
                if (Math.random() < leavesGrowingOrder) {currIndexLeaves--} // CHANCE TO DRAW THE SAME LEAF AGAIN.
                if (Math.random() < 1/100) {currIndexLeaves = 0} // CHANCE TO RESET INDEX TO 0
            }
            // GROWN - label as grown if maxStage reached
            else if (leaf.currentStage === leaf.maxStages) {
                leaf.drawLeafStage()
                leaf.currentStage ++
                leaf.state === "grown"
                // console.log('grwn')
                let spliceIndex = tree.growingLeavesList.indexOf(leaf)
                // remove already grown leaf from the growing list
                tree.growingLeavesList.splice(spliceIndex, 1) // 2nd parameter means remove one item only
                // currIndexLeaves--
            }
            // RESET currIndexLeaves if LAST LEAF from the list was reached
            if (currIndexLeaves === tree.growingLeavesList.length) {
                currIndexLeaves = 0
                // console.log('currIndexLeaves = 0')
            }
            whileLoopCounterLeaves ++
            // console.log(growingLeavesList.length)
        }
        whileLoopCounterLeaves = 0


        // ________________ BREAK THE LOOP ________________
        if (lvl > tree.maxLevel && tree.growingLeavesList.length === 0 ) {
            console.log('___Animation_in___' + timeStamp + 'ms___')
            // console.log(growingLeavesList)
            alreadyAnimating = false
            document.body.style.cursor = 'auto' // waiting cursor
            return
        }

        // OR ACCUMULATE PASSED TIME
        else if (accumulatedTime < timeLimit){
            accumulatedTime += timeDelta
        }

        // DRAW A FRAME IF TIMELIMIT PASSED
        // else if (accumulatedTime >= timeLimit && lvl <= tree.maxLevel){

        // WAIT TILL growingLeavesList.length < growgrowLimitingLeavesAmountAmount to draw further segments
        else if (accumulatedTime >= timeLimit  &&  lvl <= tree.maxLevel  &&  tree.growingLeavesList.length <= growLimitingLeavesAmount){
            // for every branch
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

        requestAnimationFrame(animate)

        // if (Math.floor(1000/timeDelta) < 50){
        //     console.log(Math.floor(1000/timeDelta) + ' FPS!!!') // FPS ALERT
        // }
    }
    animate(0)
}

// ________________________________________ ANIMATION ________________________________________

// ________________________________________ SIDEBAR ________________________________________
const CATEGORY1 = document.getElementById('category1') as HTMLElement
const CATEGORY2 = document.getElementById('category2') as HTMLElement

const parametersObjectsList = [] 
// type parameterObject = {name: string, category: string, min: number, max: number, value:number}
for (let i=0; i< 10; i++){
    let ctgr = CATEGORY1
    if (i>3) {
        ctgr = CATEGORY2
    }
    const obj = {name: String(i), category: ctgr, min: i, max: i*2, value: (i+i*2)/2 }
    parametersObjectsList.push(obj)
}

function createSliderWithTextInput (name: string, category: HTMLElement, min: number, max: number, value: number) {
    const sidebarElement = document.createElement("div")
    sidebarElement.classList.add("sidebarElement")
    // console.log(sidebarElement)
    category.appendChild(sidebarElement)
    const namePar = document.createElement("p")
    namePar.innerText = name
    sidebarElement.appendChild(namePar)

    const span = document.createElement("span")
    sidebarElement.appendChild(span)

    const slider = document.createElement("input") // create canvas
    slider.type = 'range';
    slider.classList.add("sliderClass")
    slider.setAttribute('data-slider', 'dejtaset' + name)
    slider.id = name + 'RangeInput'
    slider.min = String(min)
    slider.max = String(max)
    slider.step = String(0.1)
    slider.value = String(value)
    span.appendChild(slider)

    const sliderText = document.createElement("input")
    sliderText.setAttribute('data-sliderText', 'dejtaset' + name)
    slider.id = name + 'TextInput'
    sliderText.type = 'text';
    sliderText.value = String(value)
    span.appendChild(sliderText)
}

// __________ CREATE SLIDERS __________
parametersObjectsList.forEach ( element => {
    createSliderWithTextInput(element.name, element.category, element.min, element.max, element.value)
})
const rangeInputs = document.querySelectorAll('.sidebarElement input[type="range"]')
const textInputs = document.querySelectorAll('.sidebarElement input[type="text"]')
// __________ CREATE SLIDERS __________

// UPDATE NUMBER INPUT BY SLIDER
rangeInputs.forEach((rangeInput) => {
    rangeInput.addEventListener("input", (event) => {
        const eventTarget = event.target as HTMLInputElement
        const dataOf = eventTarget.dataset.slider
        const sliderText = document.querySelector(`[data-sliderText="${dataOf}"]`) as HTMLInputElement
        sliderText.value = String(eventTarget.value)
    })
})

// UPDATE SLIDER BY NUMBER INPUT
textInputs.forEach((textInput) => {
    textInput.addEventListener("change", (event) => {
        const eventTarget = event.target as HTMLInputElement
        const dataOf = eventTarget.dataset.slidertext
        const slider = document.querySelector(`[data-slider="${dataOf}"]`) as HTMLInputElement
        slider.value = String(eventTarget.value)
    })
})

// // SNAP PARAMETERS
// function snapCurrentParameters () {
//     rangeInputs.forEach((rangeInput) => {
//         const inputElement = rangeInput as HTMLInputElement  // because (rangeInput: HTMLInputElement) was not accepted by TS
//         console.log(inputElement.dataset.slider, inputElement.value)
//     })
// }
// snapCurrentParameters()

// SIDEBAR OPENINIG AND CLOSING
const closeSidebarButton = document.getElementById('closeSidebarButton') as HTMLBodyElement
const sidebar = document.getElementById('sidebar') as HTMLBodyElement
sidebar.style.display = 'none'
closeSidebarButton.addEventListener("click", () => {
    if (sidebar.style.display == 'none') {
        closeSidebarButton.style.left = String(500) + 'px'
        sidebar.style.display = 'block'
    }
    else if (sidebar.style.display != 'none') {
        closeSidebarButton.style.left = String(0)
        sidebar.style.display = 'none'
    }
});
// ________________________________________ SIDEBAR ________________________________________

}) //window.addEventListener('load', function(){ }) ends here





// BRANCH COUNTER
// let branchesAll = 0
// tree.allBranches.forEach( level => {
//     branchesAll += level.length
// } )
// console.log('branches amount = ' + branchesAll)