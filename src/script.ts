// ______________ CURRENT ______________
window.addEventListener('load', function() {
    //GLOBALS
    const canvas = document.getElementById('canvas1') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    canvas.width = 600
    canvas.height = 800
    ctx.strokeStyle = 'brown'

    class Branch {
        constructor(
            public x0: number,
            public y0: number,
            public len: number,
            public angle: number,
            public lineWidth: number = 16, //trunk width
            public xF: number = 0, //could be ? but then lineTo errors with null
            public yF: number  = 0,
            public level: number = 0,
            public parent?: Branch, // parent branch
            public children: Branch[] = [], // list of children branches
        ){
            // CALCULATE TIP (FINAL) COORDINATES
            this.xF = x0 + Math.sin(angle/180* Math.PI) * len
            this.yF = y0 - Math.cos(angle/180* Math.PI) * len
        }

        makeChildrenBranch(angleDiff: number) {
            ctx.strokeStyle = 'green' // why is the trunk green?
            let childBranch = new Branch (this.xF, this.yF, this.len*0.8, angleDiff, this.lineWidth*0.7)
            childBranch.level = this.level +1
            childBranch.parent = this
            this.children.push(childBranch)
            console.log(childBranch)
            this.drawBranch(childBranch)
        }

        drawBranch(object: Branch) {
            ctx.lineWidth = object.lineWidth
            ctx.moveTo(object.x0, object.y0)
            ctx.lineTo(object.xF, object.yF)
            ctx.stroke()
        } 

    }

    let branch = new Branch (canvas.width/2, canvas.height, 200, 0)
    console.log(branch)
    branch.drawBranch(branch)
    branch.makeChildrenBranch(10)
    branch.makeChildrenBranch(-10)

})
// ______________ CURRENT ______________