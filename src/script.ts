// ______________ CURRENT ______________
window.addEventListener('load', function() {
    //GLOBALS
    const canvas = document.getElementById('canvas1') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    canvas.width = 600
    canvas.height = 800

    class Branch {
        constructor(
            public x0: number,
            public y0: number,
            public len: number,
            public angle: number,
            private lineWidth: number = 25, //trunk width
            private xF: number = 0, //could be ? but then lineTo errors with null
            private yF: number  = 0,
            public level: number = 0,
            public parent?: Branch, // parent branch
            public children: Branch[] = [], // list of children branches
        ){
            // CALCULATE TIP (FINAL) COORDINATES
            this.xF = x0 + Math.sin(angle/180* Math.PI) * len
            this.yF = y0 - Math.cos(angle/180* Math.PI) * len
        }

        makeChildBranch(angleDiff: number) {
            // ctx.strokeStyle = 'green' // why is the trunk green?
            let childBranch = new Branch (this.xF, this.yF, this.len*0.8, angleDiff, this.lineWidth*0.7)
            childBranch.level = this.level +1
            childBranch.parent = this
            // childBranch.parent.angle += angleDiff
            this.children.push(childBranch)
            // console.log(childBranch)
            this.drawBranch()
            return childBranch
        }

        drawBranch() {
            ctx.lineWidth = this.lineWidth
            ctx.strokeStyle = 'rgb(10,' + (80 + 60*this.level) + ', 0)'
            ctx.moveTo(this.x0, this.y0)
            ctx.lineTo(this.xF, this.yF)
            console.log(this.level)
            // console.log(this.lineWidth)
            ctx.stroke()
        }
    }

    class Tree {
        constructor(
            readonly initX: number,
            readonly initY: number,
            readonly initLen: number,
            readonly initAngle: number,
            readonly maxLevel: number = 5,
            readonly trunk: Branch = new Branch (initX, initY, initLen, initAngle), //trunk as branch
            public everyLevelBranches: [Branch[]] = [[]],
        ){
            //save trunk as 0lvl branch
            this.everyLevelBranches[0] = [this.trunk]

            // let currLvl = 1 -> LOOP ALL LEVELS EXCEPT 0 (TRUNK)
            for (let currLvl = 1; currLvl < this.maxLevel; currLvl++) {
                this.everyLevelBranches.push([]) // push empty array to fill it by the forEach loop
                this.everyLevelBranches[currLvl-1].forEach( element => {
                    console.log('parent = ' + element)
                    this.everyLevelBranches[currLvl].push(element.makeChildBranch(45))
                    this.everyLevelBranches[currLvl].push(element.makeChildBranch(-45))
                })
            }
        }// constructor end
    }

    const tree = new Tree (canvas.width/2, canvas.height, 160, 0) // initialize tree with trunk params
    // tree.trunk.drawBranch() //remove later?
    console.log(tree.everyLevelBranches)
    // console.log(tree.levelBranchesLists[0][0])

})


// ______________ CURRENT ______________