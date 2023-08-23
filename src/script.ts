window.addEventListener('load', function() {
    //GLOBALS
    const canvas = document.getElementById('canvas1') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    canvas.width = 1600
    canvas.height = 1200

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
        ){
            this.parent = parent
            // recalculate the angle according to parent branch first 
            this.angle = this.parent.angle + this.angle
            // THEN CALCULATE TIP (FINAL) COORDINATES
            this.xF = x0 + Math.sin(this.angle/180* Math.PI) * len
            this.yF = y0 - Math.cos(this.angle/180* Math.PI) * len
        }

        makeChildBranch(parent: Branch|Root, angleDiff: number) {
            // ctx.strokeStyle = 'green' // why is the trunk green?
            let childBranch: Branch = new Branch (this.xF, this.yF, this.len*0.8, angleDiff, this.lineWidth*0.5, parent)
            childBranch.parent = this
            childBranch.level = this.level +1
            this.children.push(childBranch)
            // console.log(this.parent)
            // childBranch.drawBranch()
            setTimeout(() => {childBranch.drawBranch()} , 100)
            return childBranch
        }

        drawBranch() {
            // console.log(this)
            ctx.lineWidth = this.lineWidth
            ctx.strokeStyle = 'rgb(10,' + 20*this.level + ', 0)'
            ctx.moveTo(this.x0, this.y0)
            ctx.lineTo(this.xF, this.yF)
            // ctx.fillStyle = 'white'
            // ctx.fillText(String(this.angle) + '  ' + String(this.level), (this.xF+this.x0)/2 + 10, (this.y0+this.yF)/2)
            ctx.stroke()
            return
        }
    }

    class Tree {
        constructor(
            readonly initX: number,
            readonly initY: number,
            readonly initLen: number,
            readonly initAngle: number,
            readonly maxLevel: number = 8,
            public everyLevelBranches: [Branch[]] = [[]],
        ){
            this.everyLevelBranches[0] = [new Branch (initX, initY, initLen, initAngle, 20, root)]   //save trunk as 0lvl branch
            this.everyLevelBranches[0][0].drawBranch()     //draw the trunk
            // let currLvl = 1 -> LOOP ALL LEVELS EXCEPT 0 (TRUNK)
            for (let currLvl = 0; currLvl < this.maxLevel; currLvl++) {
                this.everyLevelBranches.push([]) // push empty array to fill it by the forEach loop
                this.everyLevelBranches[currLvl].forEach( element => {
                    // console.log('parent = ' + element)
                    if (Math.random() > 0.1){
                        this.everyLevelBranches[currLvl+1].push(element.makeChildBranch(element,25))
                    }
                    if (Math.random() > 0.1){
                        this.everyLevelBranches[currLvl+1].push(element.makeChildBranch(element,-25))
                    }
                })
            }
        }// constructor end
    }

    class Root {
        constructor(
            public angle: number = 0, //just to hold a value for making branches. Rotates the tree
        ){
    }}


    // _________ INITIALIZE THE TREE _________
    // Root just acts as a parent element for the trunk. 
    // With the root there is no need for checking for parent element in Branch constructor
    const root = new Root ()
    const tree = new Tree (canvas.width/2, canvas.height, 200, 0) // initialize tree with trunk params
    // tree.trunk.drawBranch() // why it draws everything and in one width and col?
    console.log(tree.everyLevelBranches)

})