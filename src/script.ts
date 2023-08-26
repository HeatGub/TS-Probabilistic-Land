window.addEventListener('load', function() {
//GLOBALS
const canvas = document.getElementById('canvas1') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
ctx.lineCap = "round";

//  SET CANVAS SIZES AND CHANGE THEM AT WINDOW RESIZE
canvas.width = window.innerWidth
canvas.height = window.innerHeight
window.addEventListener('resize', function() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    tree.drawTheTree() // tree possibly not ready at resize
})

class Branch {
    constructor(
        public x0: number,
        public y0: number,
        public len: number,
        public angle: number,
        private lineWidth: number = 20, //trunk width
        public parent: Branch|Root, // parent branch or root
        private xF: number = 0, //could be ? but then lineTo errors with null
        private yF: number  = 0,
        private level: number = 0,
        public children: Branch[] = [], // list of children branches
        // public segments: [{x0: number, y0: number, xF: number, yF: number}] = [{x0: 0, y0: 0, xF: 0, yF: 0}]
        public segments: {x0: number, y0: number, xF: number, yF: number}[] = []   // remove empty array type?
    ){
        this.parent = parent
        // recalculate the angle according to parent branch first 
        this.angle = this.parent.angle + this.angle
        // THEN CALCULATE TIP (FINAL) COORDINATES
        this.xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len
        this.yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len

        // SEGMENTING
        let segmentingLen = 20
        let segmentsAmount = Math.ceil(this.len / segmentingLen)
        for (let segment=0; segment< segmentsAmount; segment++){
            this.segments.push({x0: 0, y0: 0, xF: 0, yF: 0})
            this.segments[segment].x0 = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len * (segment/segmentsAmount)
            this.segments[segment].y0 = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len * (segment/segmentsAmount)
            this.segments[segment].xF = this.x0 + Math.sin(this.angle/180* Math.PI) * this.len * ((segment +1)/segmentsAmount)
            this.segments[segment].yF = this.y0 - Math.cos(this.angle/180* Math.PI) * this.len * ((segment +1)/segmentsAmount)

            ctx.beginPath();
            ctx.lineCap = "round";
            ctx.lineWidth = this.lineWidth
            ctx.strokeStyle = 'rgb(10,' + (40 + 10* segment) + ', 0)'

            ctx.moveTo(this.segments[segment].x0, this.segments[segment].y0)
            ctx.lineTo(this.segments[segment].xF, this.segments[segment].yF)
            ctx.stroke()        
            ctx.closePath()
    

            // console.log(this.segments[segment].x0)
            // console.log(segment)
        }
        // console.log(this.level, segmentsAmount)
        // console.log(this.segments[segmentsAmount].xF, this.segments[segmentsAmount].yF)
        // console.log(this.xF, this.yF)
        // console.log(this.segments)

    }

    makeChildBranch(parent: Branch|Root, angleDiff: number) {
        let childBranch: Branch = new Branch (this.xF, this.yF, this.len*0.71 + Math.random()*this.len*0.15, angleDiff, this.lineWidth*0.8, parent)
        // _________ rebranching at different positions. Not worth it for now. _________
        // childBranch.x0 = this.xF + Math.cos(this.angle/180* Math.PI) * this.lineWidth/4 * (childBranch.angle/ Math.abs(childBranch.angle))
        // childBranch.y0 = this.yF + Math.sin(this.angle/180* Math.PI) * this.lineWidth/4 * (childBranch.angle/ Math.abs(childBranch.angle))
        // _________ _________
        childBranch.parent = this
        childBranch.level = this.level +1
        this.children.push(childBranch)
        // setTimeout(() => {childBranch.drawBranch()} , 50)
        return childBranch
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
        // ctx.bezierCurveTo(this.x0, this.y0, (this.x0 + this.xF)/2 + 10, (this.y0 + this.yF)/2 -10, this.xF, this.yF);
        ctx.lineTo(this.xF, this.yF)
        // ctx.fillStyle = 'white'
        // ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF+this.x0)/2 + 10, (this.y0+this.yF)/2)
        ctx.stroke()
        // console.log('drawBranch')
        ctx.closePath()
    }

}

class Tree {
    constructor(
        readonly initX: number,
        readonly initY: number,
        readonly initLen: number,
        readonly initAngle: number,
        readonly branchingProbability: number = 0.8,
        readonly maxLevel: number = 16,
        public allBranches: [Branch[]] = [[]],
    ){
        const startTime = Date.now()
        this.allBranches[0] = [new Branch (initX, initY, initLen, initAngle, 40, root)]   //save trunk as 0lvl branch
        for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
            // prob should = 1 for level 0 (trunk) 
            // this variable lowers branching probability with lever. In range from 1 to branchingProbability linearly
            let branchingProbabilityByLevel = branchingProbability + ( (1-branchingProbability) * ((this.maxLevel-currLvl)/this.maxLevel) )
            // console.log(branchingProbabilityByLevel, currLvl)
            this.allBranches.push([]) // push empty array to fill it by the forEach loop
            this.allBranches[currLvl].forEach( element => {
                // MAKE BRANCHES
                if (Math.random() < branchingProbabilityByLevel){
                    this.allBranches[currLvl+1].push(element.makeChildBranch(element,20 + Math.random()*15))
                }
                if (Math.random() < branchingProbabilityByLevel){
                    this.allBranches[currLvl+1].push(element.makeChildBranch(element,-20 - Math.random()*15))
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
        public angle: number = 0, //Rotates the tree. 
    ){
}}

// _________ INITIALIZE THE TREE _________
// Root just acts as a parent element for the trunk. 
// With the root there is no need for checking for parent element in Branch constructor
const root = new Root ()
const tree = new Tree (canvas.width/2, canvas.height, 200, 0) // initialize tree with trunk params
// tree.drawTheTree() //all at once
console.log(tree.allBranches)


// // _________ ANIMATE _________
// let lvl = 0
// // let item = 0
// let lastTime = 0
// let accumulatedTime = 0
// const timeLimit = 10

// function animateByLvl(timeStamp: number) {
//     const timeDelta = timeStamp - lastTime
//     // console.log(timeDelta)
//     lastTime = timeStamp
//     // break the loop
//     if (lvl > tree.maxLevel) {
//         console.log('___Animation_end___')
//         return
//     }

//     // draw if accumulated Time is higher than timeLimit
//     if (accumulatedTime >= timeLimit) {
//         tree.allBranches[lvl].forEach(element => {element.drawBranch()})
//         lvl++
//         // tree.allBranches[lvl][item].drawBranch()
//         // console.log('lvl ' + (lvl-1) + ', ' + accumulatedTime + 'ms')
//         accumulatedTime = 0

//     }
//     // or add accumulated time 
//     else if (accumulatedTime < timeLimit) {
//         accumulatedTime += timeDelta
//     }

//     requestAnimationFrame(animateByLvl)

//     if (Math.floor(1000/timeDelta) < 50)
//     console.log(Math.floor(1000/timeDelta) + ' FPS!!!') //FPS
// }
// // animate
// animateByLvl(0)
// // _________ ANIMATE _________

})




// // _________ ANIMATE _________
// let lvl = 0
// let item = 0
// let lastTime = 0
// let accumulatedTime = 0
// const timeLimit = 20

// function animate(timeStamp: number) {
//     const timeDelta = timeStamp - lastTime
//     // console.log(timeDelta)
//     lastTime = timeStamp
//     // break the loop
//     if (lvl > tree.maxLevel && item > tree.allBranches[tree.maxLevel].length) {
//         console.log('Animation end')
//         return
//     }

//     // increase lvl if that was the last item in that level
//     if (item >= tree.allBranches[lvl].length) {
//         lvl++
//         item = 0
//         console.log('lvl =' + lvl)
//     }

//     // draw a branch if accumulated Time is higher than timeLimit
//     if (accumulatedTime >= timeLimit) {
//         // tree.allBranches[lvl].forEach(element => {element.drawBranch()})
//         tree.allBranches[lvl][item].drawBranch()
//         item ++
//         accumulatedTime = 0

//     }
//     // or add accumulated time 
//     else if (accumulatedTime < timeLimit) {
//         accumulatedTime += timeDelta
//     }

//     requestAnimationFrame(animate)

//     if (Math.floor(1000/timeDelta) < 50)
//     console.log(Math.floor(1000/timeDelta) + ' FPS') //FPS
// }
// // animate
// animate(0)
// // _________ ANIMATE _________

// })