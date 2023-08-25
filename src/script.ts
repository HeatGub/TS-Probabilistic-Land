window.addEventListener('load', function() {
    //GLOBALS
    const canvas = document.getElementById('canvas1') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    // ctx.lineCap = "round";

    // let lastTime = 0
    // let acumulatedTime = 0

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
            // public timer: number = 0
        ){
            this.parent = parent
            // recalculate the angle according to parent branch first 
            this.angle = this.parent.angle + this.angle
            // THEN CALCULATE TIP (FINAL) COORDINATES
            this.xF = x0 + Math.sin(this.angle/180* Math.PI) * len
            this.yF = y0 - Math.cos(this.angle/180* Math.PI) * len
        }

        makeChildBranch(parent: Branch|Root, angleDiff: number) {
            let childBranch: Branch = new Branch (this.xF, this.yF, this.len*0.8, angleDiff, this.lineWidth*0.75, parent)
            // _________ rebranching at different positions. Not worth it for now. _________
            // childBranch.x0 = this.xF + Math.cos(this.angle/180* Math.PI) * this.lineWidth/4 * (childBranch.angle/ Math.abs(childBranch.angle))
            // childBranch.y0 = this.yF + Math.sin(this.angle/180* Math.PI) * this.lineWidth/4 * (childBranch.angle/ Math.abs(childBranch.angle))
            // _________ _________
            childBranch.parent = this
            childBranch.level = this.level +1
            this.children.push(childBranch)
            // console.log(this.parent)
            // childBranch.drawBranch()
            // setTimeout(() => {childBranch.drawBranch()} , 50)
            return childBranch
        }

        drawBranch() {
            ctx.lineWidth = this.lineWidth
            ctx.strokeStyle = 'rgb(10,' + (30 + 12*this.level) + ', 0)'
            ctx.moveTo(this.x0, this.y0)
            // ctx.bezierCurveTo(this.x0, this.y0, (this.x0 + this.xF)/2 + 10, (this.y0 + this.yF)/2 -10, this.xF, this.yF);
            ctx.lineTo(this.xF, this.yF)
            // ctx.fillStyle = 'white'
            // ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF+this.x0)/2 + 10, (this.y0+this.yF)/2)
            ctx.stroke()
            // console.log('drawBranch')
        }
    
    }

    class Tree {
        constructor(
            readonly initX: number,
            readonly initY: number,
            readonly initLen: number,
            readonly initAngle: number,
            readonly branchingProbability: number = 0.8,
            readonly maxLevel: number = 8,
            public everyLevelBranches: [Branch[]] = [[]],
        ){
            const startTime = Date.now()
            this.everyLevelBranches[0] = [new Branch (initX, initY, initLen, initAngle, 50, root)]   //save trunk as 0lvl branch
            for (let currLvl = 0; currLvl <= this.maxLevel; currLvl++) {
                // prob should = 1 for level 0 (trunk) 
                // this variable lowers branching probability with lever. In range from 1 to branchingProbability linearly
                let branchingProbabilityByLevel = branchingProbability + ( (1-branchingProbability) * ((this.maxLevel-currLvl)/this.maxLevel) )
                // console.log(branchingProbabilityByLevel, currLvl)
                this.everyLevelBranches.push([]) // push empty array to fill it by the forEach loop
                this.everyLevelBranches[currLvl].forEach( element => {
                    // MAKE BRANCHES
                    if (Math.random() < branchingProbabilityByLevel){
                        this.everyLevelBranches[currLvl+1].push(element.makeChildBranch(element,20 + Math.random()*15))
                    }
                    if (Math.random() < branchingProbabilityByLevel){
                        this.everyLevelBranches[currLvl+1].push(element.makeChildBranch(element,-20 - Math.random()*15))
                    }
                })
            }
            console.log('Tree constructed in ' + (Date.now()- startTime) +  ' ms')
        }// constructor end

        drawTheTree() {
            const startTime = Date.now()
            for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
                this.everyLevelBranches[currLvl].forEach( element => {
                    // element.animateBranch()
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
    tree.drawTheTree()
    // console.log(tree.everyLevelBranches)
    
    // // _________ ANIMATE _________
    // function animate(timeStamp: number) {
    //     const deltaTime = timeStamp - lastTime
    //     deltaTime //just to call
    //     lastTime = timeStamp
    //     // drawBranch()
    //     // tree.drawTheTree()
    //     requestAnimationFrame(animate)
    //     console.log(Math.floor(1000/deltaTime) + ' FPS') //FPS
    // }

    // animate(0)
})